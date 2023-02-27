import ImportTransform from "esbuild-plugin-import-transform";
import { defineConfig } from "tsup";

const noExternal = [
  "path-browserify",
  "import-cost-engine",
  "@babel/parser",
  "@babel/types"
];

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
    tsconfig: "tsconfig.json",
    define: {
      IS_WEB: "false"
    },
    noExternal
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
    esbuildPlugins: [
      ImportTransform({
        "node:path": "path-browserify",
        "./locate": {
          text: "export function locateESBuild() { return \"esbuild-wasm\"}"
        }
      })
    ],
    external: ["fs", "path", "node:path", "vscode"],
    tsconfig: "tsconfig.web.json",
    define: {
      IS_WEB: "true"
    },
    noExternal
  }
]);
