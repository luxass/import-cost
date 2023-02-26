import { defineConfig } from "tsup";

const noExternal = ["@babel/parser", "@babel/types"];

const entries = [
  "src/index.ts",
  "src/parser.ts",
  "src/find.ts",
  "src/resolve.ts",
  "src/builtins.ts",
  "src/calculate.ts",
  "src/cache.ts"
];

export default defineConfig({
  entry: entries,
  format: ["esm", "cjs"],
  clean: true,
  treeshake: true,
  bundle: true,
  dts: true,
  target: ["es2020", "node16"],
  platform: "node",
  noExternal
});
