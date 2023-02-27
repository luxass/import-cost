import ImportTransform from "esbuild-plugin-import-transform";
import { defineConfig } from "tsup";

const noExternal = ["@babel/parser", "@babel/types"];

const baseEntries = [
  "src/index.ts",
  "src/parser.ts",
  "src/resolve.ts",
  "src/builtins.ts",
  "src/calculate.ts",
  "src/cache.ts"
];

const nodeEntries = baseEntries.concat(["src/find.ts"]);

const webEntries = baseEntries;

export default defineConfig([
  {
    entry: nodeEntries,
    format: ["esm", "cjs"],
    clean: true,
    treeshake: true,
    bundle: true,
    dts: true,
    target: ["es2020", "node16"],
    noExternal
  },
  {
    entry: webEntries,
    outDir: "dist/web",
    format: ["esm"],
    clean: true,
    treeshake: true,
    bundle: true,
    dts: true,
    target: ["es2020"],
    platform: "browser",
    esbuildPlugins: [
      ImportTransform({
        "node:path": "path-browserify"
      })
    ],
    noExternal
  }
]);
