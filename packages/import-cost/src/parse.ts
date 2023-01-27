import type { ParserPlugin } from "@babel/parser";
import { parse } from "@babel/parser";
import type { CallExpression } from "@babel/types";
import { isIdentifier, isStringLiteral, isTemplateLiteral } from "@babel/types";

import { getParserPlugins, traverse } from "./babel";
import type { Language, ParsedImport } from "./types";

export function parseImport(
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
          code: ""
        });
      }
    },
    CallExpression({ node }) {
      if (node.callee.type === "Import") {
        imports.push({
          fileName,
          name: getImportName(node),
          line: node.loc?.end.line || 0,
          code: ""
        });
      } else if ("name" in node.callee && node.callee.name === "require") {
        imports.push({
          fileName,
          name: getImportName(node),
          line: node.loc?.end.line || 0,
          code: ""
        });
      }
    }
  });

  return imports;
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
