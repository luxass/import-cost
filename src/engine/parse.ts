import type { ParserPlugin } from "@babel/parser";
import { parse } from "@babel/parser";
import type { CallExpression, ImportDeclaration, Node } from "@babel/types";
import {
  isIdentifier,
  isImportDefaultSpecifier,
  isImportNamespaceSpecifier,
  isImportSpecifier,
  isStringLiteral,
  isTemplateLiteral
} from "@babel/types";

import { getParserPlugins, traverse } from "./babel";
import type { ImportDirectives, Language, ParsedImport } from "./types";

export function parseImports(
  fileName: string,
  content: string,
  language: Language
): Array<ParsedImport> {
  const imports: Array<ParsedImport> = [];

  const ast = parse(content, {
    sourceType: "module",
    plugins: getParserPlugins(language) as ParserPlugin[]
  });

  traverse(ast, {
    ImportDeclaration({ node }) {
      if (node.importKind !== "type") {
        imports.push({
          fileName,
          name: node.source.value,
          line: node.loc?.end.line || 0,
          code: getImportString(node),
          directives: getDirectives(node)
        });
      }
    },
    CallExpression({ node }) {
      const directives = getDirectives(node);
      if (node.callee.type === "Import") {
        imports.push({
          fileName,
          name: getImportName(node),
          line: node.loc?.end.line || 0,
          code: `import("${getImportName(node)}")`,
          directives
        });
      } else if ("name" in node.callee && node.callee.name === "require") {
        imports.push({
          fileName,
          name: getImportName(node),
          line: node.loc?.end.line || 0,
          code: `require("${getImportName(node)}")`,
          directives
        });
      }
    }
  });

  return imports;
}

function getDirectives(
  node: CallExpression | ImportDeclaration
): ImportDirectives {
  const directives: ImportDirectives = {};

  if (node.leadingComments) {
    node.leadingComments.forEach((comment) => {
      if (comment.value.includes("import-cost: ")) {
        const directive = comment.value.trim().replace("import-cost: ", "");

        if (directive === "mark-external") {
          directives.external = true;
          return;
        }

        if (directive === "platform-browser") {
          directives.platform = "browser";
        }

        if (directive === "skip") {
          directives.skip = true;
        }
      }
    });
  }

  return directives;
}

function getImportString(node: ImportDeclaration) {
  let importSpecifiers: string | undefined, importString: string;
  if (node.specifiers && node.specifiers.length > 0) {
    importString = ([] as ImportDeclaration["specifiers"])
      .concat(node.specifiers)
      .sort((s1, s2) => {
        if (isImportSpecifier(s1) && isImportSpecifier(s2)) {
          return nameOrValue(s1.imported).localeCompare(
            nameOrValue(s2.imported)
          );
        }
        return 0;
      })
      .map((specifier, i) => {
        if (isImportNamespaceSpecifier(specifier)) {
          return `* as ${specifier.local.name}`;
        } else if (isImportDefaultSpecifier(specifier)) {
          return specifier.local.name;
        } else if (isImportSpecifier(specifier)) {
          if (!importSpecifiers) importSpecifiers = "{";

          importSpecifiers += nameOrValue(specifier.imported);
          if (
            node.specifiers[i + 1] &&
            isImportSpecifier(node.specifiers[i + 1])
          ) {
            importSpecifiers += ", ";
            return undefined;
          } else {
            const result = `${importSpecifiers}}`;
            importSpecifiers = undefined;
            return result;
          }
        } else {
          return undefined;
        }
      })
      .filter(Boolean)
      .join(", ");
  } else {
    importString = "* as tmp";
  }
  return `import ${importString} from '${node.source.value}';
console.log(${importString.replace("* as ", "")});`;
}

function getImportName(node: CallExpression): string {
  const argument = node.arguments[0];
  if (isTemplateLiteral(argument)) {
    return argument.quasis[0].value.raw;
  }
  return (
    (isStringLiteral(argument) && argument.value) ||
    (isIdentifier(argument) && argument.name) ||
    ""
  );
}

function nameOrValue(node: Node) {
  if (isIdentifier(node)) return node.name;
  else if (isStringLiteral(node)) return node.value;
  else return "";
}
