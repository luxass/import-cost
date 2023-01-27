import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: ["cjs"],
  clean: true,
  treeshake: true,
  bundle: true,
  target: ["es2020", "chrome91", "node16"],
  external: ["vscode"],
  tsconfig: "tsconfig.json"
});
