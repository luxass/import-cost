import { cp } from "node:fs/promises";

import { defineConfig } from "tsup";

const globalNoExternal = ["@babel/parser", "@babel/types"];

export default defineConfig([
  {
    entry: ["src/extension.ts"],
    format: ["cjs"],
    clean: true,
    treeshake: true,
    bundle: true,
    target: ["es2020", "node16"],
    platform: "node",
    external: ["vscode"],
    define: {
      IS_WEB: "false"
    },
    tsconfig: "tsconfig.json",
    noExternal: globalNoExternal
  },
  {
    entry: ["src/extension.ts"],
    outDir: "dist/web",
    format: ["cjs"],
    clean: true,
    treeshake: true,
    bundle: true,
    target: ["es2020", "chrome91"],
    platform: "browser",
    external: ["vscode"],
    define: {
      IS_WEB: "true",
      process: JSON.stringify({
        env: {}
      })
    },
    onSuccess: async () => {
      console.log("Copying web assets...");
      await cp(
        "./node_modules/esbuild-wasm/esbuild.wasm",
        "./dist/web/esbuild.wasm"
      );
    },
    tsconfig: "tsconfig.web.json",
    noExternal: globalNoExternal.concat([
      "path-browserify",
      "pako",
      "filesize",
      "esbuild-wasm"
    ])
  }
]);
