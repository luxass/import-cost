import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/extension.ts"],
    format: ["cjs"],
    clean: true,
    treeshake: true,
    bundle: true,
    target: ["es2020", "chrome91", "node16"],
    platform: "node",
    external: ["vscode"],
    tsconfig: "tsconfig.json",
    define: {
      IS_WEB: "false"
    }
  },
  {
    entry: ["src/extension.ts"],
    outDir: "dist/web",
    format: ["cjs"],
    clean: true,
    treeshake: true,
    bundle: true,
    target: ["es2020", "chrome91", "node16"],
    platform: "browser",
    external: ["fs", "vscode"],
    tsconfig: "tsconfig.web.json",
    define: {
      IS_WEB: "true"
    }
  }
]);
