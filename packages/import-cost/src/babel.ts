import babelTraverse from "@babel/traverse";

// @ts-expect-error @babel/traverse is not a valid export in esm.
export const traverse: typeof import("@types/babel__traverse").default = babelTraverse.default || babelTraverse;
