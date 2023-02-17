import { defineConfig } from "tsup";

const noExternal = [
  "@babel/parser",
  "@babel/types",
  "filesize",
  "pako",
  "path-browserify"
];

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  clean: true,
  treeshake: true,
  bundle: true,
  dts: true,
  target: ["es2020", "chrome91", "node16"],
  platform: "node",
  tsconfig: "tsconfig.json",
  external: ["vscode"],
  noExternal
});
