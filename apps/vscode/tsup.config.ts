import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: true,
  external: ["vscode", "esbuild"],
  tsconfig: "tsconfig.json"
});
