import { build } from "esbuild";
import ImportTransform from "esbuild-plugin-import-transform";

await build({
  platform: "browser",
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  target: ["es2020", "chrome91"],
  outdir: "dist/web",
  plugins: [
    ImportTransform({
      "node:path": "path-browserify",
      "./locate": {
        text: "export function locateESBuild() { return \"esbuild-wasm\"}"
      },
      "./gzip": {
        text: "export { gzip } from \"pako\";"
      }
    })
  ],
  define: {
    IS_WEB: "true"
  },
  external: ["vscode"]
});
