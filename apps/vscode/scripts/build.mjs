// @ts-check
import { build } from "esbuild";

const args = process.argv.slice(2);

let index = args.indexOf("--mode");
const mode = (index >= 0 ? args[index + 1] : undefined) || "production";

index = args.indexOf("--target");
const target = (index >= 0 ? args[index + 1] : undefined) || "node";

const watch = args.includes("--watch");
const minify = args.includes("--minify");

const webExternals = [
  "vscode",
  "child_process",
  "crypto",
  "fs",
  "stream",
  "os",
  "node-fetch"
];

const nodeExternals = ["vscode"];

build({
  entryPoints: ["src/extension.ts"],
  external: target === "web" ? webExternals : nodeExternals,
  format: "cjs",
  bundle: true,
  keepNames: true,
  logLevel: "info",
  mainFields:
    target === "web" ? ["browser", "module", "main"] : ["module", "main"],
  outdir: target === "web" ? "dist/browser" : "dist",
  platform: target === "web" ? "browser" : "node",
  sourcemap: mode === "development",
  target: ["es2020", "chrome91", "node16"],
  minify,
  treeShaking: true,
  tsconfig: target === "web" ? "tsconfig.web.json" : "tsconfig.json",
  watch,
  define: {
    IS_WEB: `${target === "web"}`
  }
}).catch(() => process.exit(1));
