import type { ParserPlugin } from "@babel/parser";
import babelTraverse from "@babel/traverse";

import type { Language } from "./types";

// @ts-expect-error @babel/traverse is not a valid export in esm.
export const traverse: typeof import("@types/babel__traverse").default =
  // @ts-expect-error @babel/traverse is not a valid export in esm.
  babelTraverse.default || babelTraverse;

const SHARED_PLUGINS: Array<ParserPlugin> = [
  "doExpressions",
  "objectRestSpread",
  ["decorators", { decoratorsBeforeExport: true }],
  "classProperties",
  "asyncGenerators",
  "functionBind",
  "functionSent",
  "dynamicImport"
];

const JS_PLUGINS: Array<ParserPlugin> = [...SHARED_PLUGINS, "jsx"];
const TS_PLUGINS: Array<ParserPlugin> = [...SHARED_PLUGINS, "typescript"];
const TSX_PLUGINS: Array<ParserPlugin> = [...TS_PLUGINS, "jsx"];

export function getParserPlugins(language: Language): Array<ParserPlugin> {
  switch (language) {
    case "javascript":
    case "js":
    case "javascriptreact":
    case "jsx":
    case "vue":
    case "svelte":
      return JS_PLUGINS;

    case "typescript":
    case "ts":
      return TS_PLUGINS;
    case "typescriptreact":
    case "tsx":
    case "vue-ts":
    case "svelte-ts":
    case "astro":
      return TSX_PLUGINS;

    default:
      return JS_PLUGINS;
  }
}
