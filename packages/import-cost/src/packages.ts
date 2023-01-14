import type { ParserPlugin } from "@babel/parser";
import { parse } from "@babel/parser";

import { traverse } from "./babel";
import { Language } from "./types";

// type Languages = "ts" | "tsx" | "js" | "jsx" | "vue" | "tsx"

// const SHARED_PLUGINS = [

// ];

// const PLUGINS: Record<Languages, ParserPlugin[]> = {
//   ts: [...SHARED_PLUGINS, "typescript"],

// }

export async function parsePackages(content: string, language: Language) {
  const ast = parse(content, {
    sourceType: "module",
    plugins: [
      "jsx",
      "asyncFunctions",
      "classConstructorCall",
      "doExpressions",
      "trailingFunctionCommas",
      "objectRestSpread",
      ["decorators", { decoratorsBeforeExport: true }],
      "classProperties",
      "exportExtensions",
      "exponentiationOperator",
      "asyncGenerators",
      "functionBind",
      "functionSent",
      "dynamicImport"
    ] as ParserPlugin[]
  });
  traverse(ast, {
    ImportDeclaration(decl) {
      console.log("DECL", decl);
    },
    CallExpression(callee) {
      console.log("CALLEE", callee);
    }
  });
}
