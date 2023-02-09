import type { BuildOptions } from "esbuild";

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
): ParsedImport[] {
  const imports: ParsedImport[] = [];

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

        if (directive.includes("platform-")) {
          const platform = directive.replace("platform-", "");
          directives.platform = platform as "browser" | "node";
        }

        if (directive.includes("format-")) {
          const format = directive.replace("format-", "");
          directives.format = format as BuildOptions["format"];
        }

        if (directive === "skip") {
          directives.skip = true;
        }
      }
    });
  }

  return directives;
}

function getImportString(node: ImportDeclaration): string {
  const importString =
    node.specifiers.length > 0 ? parseSpecifiers(node) : "* as tmp";

  return `import ${importString} from '${
    node.source.value
  }'\nconsole.log(${importString.replace("* as ", "")});`;
}

function parseSpecifiers(node: ImportDeclaration): string {
  let importSpecifier: string | undefined;
  const importSpecifiers = node.specifiers
    // .sort((s1, s2) => {
    //   if (isImportSpecifier(s1) && isImportSpecifier(s2)) {
    //     return getName(s1.imported).localeCompare(getName(s2.imported));
    //   }
    //   return 0;
    // })
    // TODO: We will need some kind of magic here, to figure out if the import is a type or not.
    // .filter((specifier) => {
    //   if (isImportSpecifier(specifier)) {
    //     return specifier.importKind !== "type";
    //   }
    //   return true;
    // })
    .map((specifier, i) => {
      if (isImportNamespaceSpecifier(specifier)) {
        return `* as ${specifier.local.name}`;
      } else if (isImportDefaultSpecifier(specifier)) {
        return specifier.local.name;
      } else if (isImportSpecifier(specifier)) {
        if (!importSpecifier) {
          console.log("Starting new import specifier");
          
          importSpecifier = "{";
        }
        console.log("checkpoint 1", importSpecifier);
        
        if (specifier.importKind !== "type") {
          importSpecifier += `${getName(specifier.imported)}`;
        }
        console.log("checkpoint 2", importSpecifier);
        
        const next = node.specifiers[i + 1] as any;
        console.log("next", next, node.specifiers.length, i, i + 1);
        
        if (next && isImportSpecifier(next)) {
          if (next.importKind !== "type") {
            console.log("adding to import specifier");
            
            importSpecifier += ", ";
          }
          return undefined;
        } else {
          console.log("closing import specifier");
          
          const result = (importSpecifier += "}");
          importSpecifier = undefined;
          console.log("result", result);
          return result;
        }
      } else {
        return undefined;
      }
    })
    .filter(Boolean)
    .join(", ");
  console.log("importSpecifiers", importSpecifiers);

  return importSpecifiers;
}

function getImportName(node: CallExpression): string {
  const argument = node.arguments[0];
  if (isTemplateLiteral(argument)) {
    return argument.quasis[0].value.raw;
  }
  return getName(argument);
}

function getName(node: Node): string {
  return (
    (isStringLiteral(node) && node.value) ||
    (isIdentifier(node) && node.name) ||
    ""
  );
}
