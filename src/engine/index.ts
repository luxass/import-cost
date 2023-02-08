import { dirname, join } from "env:path";
import type { Message } from "esbuild";
import { Uri, workspace } from "vscode";

import { log } from "../logger";
import { calculateSize } from "./build";
import { builtins } from "./builtins";
import { find } from "./find";
import { parseImports } from "./parse";
import type { CostResult, ImportSize, Options, ParsedImport } from "./types";

export async function calculateCost({
  path,
  language,
  externals,
  code,
  cwd,
  esbuild
}: Options): Promise<CostResult | null> {
  try {
    if (language === "astro" || language === "vue" || language === "svelte") {
      const extracted = extractCode(code, language);
      if (extracted) {
        code = extracted.code;
        language = extracted.language;
      }
    }

    let parsedImports = parseImports(path, code, language).filter((pkg) => {
      if (pkg.directives.skip) {
        log.info(`Skipping ${pkg.name} because of skip directive`);
      }

      return !pkg.fileName.startsWith(".") && !pkg.directives.skip;
    });

    await Promise.allSettled(
      parsedImports.map(
        async (_import) => (_import.version = await getVersion(_import))
      )
    );

    log.info(`Found ${parsedImports.length} imports for ${path}`);

    parsedImports = parsedImports.filter((_import) => {
      log.info(`${_import.version ? "✅" : "❌"} ${_import.name}`);
      return !!_import.version;
    });

    if (parsedImports.length === 0) {
      return null;
    }

    const warnings: Message[] = [];
    const errors: Message[] = [];
    const imports: ImportSize[] = [];
    externals = await resolveExternals(Uri.file(dirname(cwd.fsPath)));

    log.info(`Resolving ${externals.length} externals for ${path}`);
    for await (const result of parsedImports.map((_import) =>
      calculateSize(_import, {
        externals,
        format: language === "ts" ? "esm" : "cjs",
        esbuild
      })
    )) {
      result.errors = result.errors.concat(result.errors);
      result.warnings = result.warnings.concat(result.warnings);
      imports.push({
        name: result.pkg.name,
        version: result.pkg.version,
        line: result.pkg.line,
        path: result.pkg.fileName,
        size: {
          bytes: result.pkg.size,
          gzip: result.pkg.gzip
        }
      });
    }
    return {
      imports,
      errors,
      warnings
    };
  } catch (e) {
    // console.error(e);
    return null;
  }
}

async function resolveExternals(cwd: Uri) {
  const pkg = await find("package.json", {
    cwd
  });

  if (pkg) {
    const { peerDependencies } = JSON.parse(
      new TextDecoder().decode(await workspace.fs.readFile(Uri.file(pkg)))
    );
    return builtins.concat(Object.keys(peerDependencies || {}));
  }

  return builtins;
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

async function getVersion(pkg: ParsedImport): Promise<string | undefined> {
  try {
    const node_modules = await find("node_modules", {
      cwd: Uri.file(dirname(pkg.fileName))
    });

    if (node_modules) {
      const name = getPackageName(pkg);
      const pkgPath = join(node_modules, name, "package.json");
      const version = JSON.parse(
        new TextDecoder().decode(await workspace.fs.readFile(Uri.file(pkgPath)))
      ).version;
      return `${name}@${version}`;
    }
  } catch (e) {
    return undefined;
  }
}

function getPackageName(pkg: ParsedImport): string {
  const pkgParts = pkg.name.split("/");
  let pkgName = pkgParts.shift() || pkg.name;
  if (pkgName && pkgName.startsWith("@")) {
    pkgName += `/${pkgParts.shift()}`;
  }
  return pkgName;
}

export type { CostResult, Options, Language } from "./types";
export { parseImports } from "./parse";
