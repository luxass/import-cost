import ImportTransform from "esbuild-plugin-import-transform";
import { defineConfig } from "tsup";

const noExternal = ["@babel/parser", "@babel/types"];

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
    noExternal
  },
  {
    entry: ["src/extension.ts"],
    outDir: "dist/web",
    format: ["cjs"],
    clean: true,
    // treeshake: true,
    bundle: true,
    target: ["es2020", "chrome91"],
    platform: "browser",
    esbuildPlugins: [
      ImportTransform({
        // "node:path": "path-browserify",
        "./locate": {
          text: "export function locateESBuild() { return \"esbuild-wasm\"}"
        },
        "./gzip": {
          text: "export { gzip } from \"pako\";"
        }
      }),
      {
        name: "node-polyfills",
        setup(build) {
          build.onResolve(
            {
              filter: /^node:path$/
            },
            async (args) => {
              console.log("node:path");
              return {
                path: args.path
              };
            }
          );
        }
      }
    ],
    external: ["vscode", "path-browserify", "pako"],
    define: {
      IS_WEB: "true"
    },
    plugins: [
      {
        name: "node-polyfills",
        esbuildOptions(options) {
          console.log("Setting options");
          
          options.alias = {
            ...options.alias,
            "node:path": "path-browserify"
          };
        }
      }
    ],
    noExternal
  }
]);
