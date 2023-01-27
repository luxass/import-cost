import { readFile } from "node:fs/promises";
import { builtinModules } from "node:module";

import { find } from "elysius";

import { calculateSize } from "./build";
import { parseImport } from "./parse";
import type { CostResult, Options } from "./types";

export async function calculateCost({
  path,
  language,
  externals,
  code,
  cwd = process.cwd(),
  esbuild
}: Options): Promise<CostResult | null> {
  try {
    externals ??= await resolveExternals(cwd);
    if (language === "astro" || language === "vue" || language === "svelte") {
      const extracted = extractCode(code, language);
      if (extracted) {
        code = extracted.code;
        language = extracted.language;
      }
    }

    const imports = parseImport(path, code, language);

    console.log("packages", imports);
    for await (const result of imports.map((_import) =>
      calculateSize(_import, {
        externals,
        format: language === "ts" ? "esm" : "cjs",
        esbuild
      })
    )) {
      console.log(result);
    }
    return {
      imports: []
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function resolveExternals(cwd: string) {
  const pkg = await find("package.json", {
    cwd
  });

  if (pkg) {
    const { peerDependencies } = JSON.parse(await readFile(pkg, "utf8"));
    return builtinModules.concat(Object.keys(peerDependencies || {}));
  }

  return builtinModules;
}

function extractCode(
  code: string,
  language: string
): { code: string; language: "js" | "ts" } | null {
  if (language === "astro") {
    const match = code.match(/(?<=---\n)(?:(?:.|\n)*?)(?=\n---)/);
    if (match) {
      return {
        code: match[0],
        language: "ts"
      };
    }
  } else if (language === "vue" || language === "svelte") {
    const match = code.match(
      /<script(?:.*?lang="(js|ts)")?[^>]*>([\s\S]*?)<\/script>/
    );

    if (match) {
      return {
        code: match[2],
        language: match[1] as "js" | "ts"
      };
    }
  }
  return null;
}

export type { CostResult, Options, Language } from "./types";
export { parseImport as parsePackages } from "./parse";
