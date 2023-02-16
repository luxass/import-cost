import { find } from "env:find";
import { readFile } from "env:fs";
import { dirname, join } from "env:path";
import type { Message } from "esbuild";

import { calculateSize } from "./build";
import { builtins } from "./builtins";
import { log } from "./logger";
import { parseImports } from "./parse";
import type {
  CostResult,
  ImportSize,
  Language,
  Options,
  ParsedImport
} from "./types";

export { filesize } from "filesize";
export { find } from "env:find"

export async function calculateCost({
  path,
  language,
  externals,
  code,
  cwd,
  esbuild,
  skips,
  format,
  platform,
  formats,
  platforms
}: Options): Promise<CostResult | null> {
  try {
    if (language === "astro" || language === "vue" || language === "svelte") {
      const extracted = extractCode(code, language);
      if (extracted) {
        code = extracted.code;
        language = extracted.language;
      }
    }
    let parsedImports = parseImports({
      fileName: path,
      content: code,
      language,
      skips,
      formats: formats || {},
      platforms: platforms || {}
    });

    // They are all using the same file.
    // So no need to check for node_modules in the folder each time.
    const node_modules = await find("node_modules", {
      cwd: new URL(dirname(path))
    });

    await Promise.allSettled(
      parsedImports.map(
        async (pkg) => (pkg.version = await getVersion(pkg, node_modules))
      )
    );

    log.info(`Found ${parsedImports.length} imports for ${path}`);

    parsedImports = parsedImports.filter((_import) => {
      log.info(`${_import.version ? "✅" : "❌"} ${_import.name}`);
      return !!_import.version;
    });


    if (!parsedImports.length) {
      return null;
    }

    const warnings: Message[] = [];
    const errors: Message[] = [];
    const packages: ImportSize[] = [];

    log.info(`Resolving externals for ${path}`);
    externals = await resolveExternals(
      new URL(dirname(cwd.pathname)),
      externals
    );

    for await (const result of parsedImports.map((_import) =>
      calculateSize(_import, {
        externals,
        format,
        platform,
        esbuild
      })
    )) {
      result.errors = result.errors.concat(result.errors);
      result.warnings = result.warnings.concat(result.warnings);
      packages.push({
        name: result.pkg.name,
        line: result.pkg.line,
        path: result.pkg.fileName,
        size: {
          bytes: result.pkg.size,
          gzip: result.pkg.gzip
        }
      });
    }
    return {
      packages,
      errors,
      warnings
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

// This is probably pretty slow, will look into this.
async function resolveExternals(cwd: URL, externals: string[]) {
  const pkg = await find("package.json", {
    cwd
  });

  let extraExternals: string[] = [];
  // This should be a workspace.fs.readFile, in the exported vscode package.
  if (pkg) {
    const { peerDependencies } = JSON.parse(
      new TextDecoder().decode(await readFile(pkg))
    );
    extraExternals = Object.keys(peerDependencies || {});
  }

  return builtins.concat(externals, extraExternals);
}

export function extractCode(
  code: string,
  language: string
): { code: string; language: Language } | null {
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
        language: `${language}-${match[1]}` as Language
      };
    }
  }
  return null;
}

async function getVersion(
  pkg: ParsedImport,
  node_modules?: string
): Promise<string | undefined> {
  try {
    // const node_modules = await find("node_modules", {
    //   cwd: Uri.file(dirname(pkg.fileName))
    // });

    // TODO: Fix this to work with node_modules, like the original import-cost does.
    // EDIT: Do we want that?

    if (node_modules) {
      log.info(`Found node_modules for ${pkg.name}`);
      const pkgPath = join(
        node_modules,
        getPackageName(pkg.name),
        "package.json"
      );
      const { version } = JSON.parse(
        new TextDecoder().decode(await readFile(pkgPath))
      );
      log.info(`Found version ${version} for ${pkg.name}`);
      return version;
    }
  } catch (e) {
    console.error(e);
    return undefined;
  }
}

function getPackageName(pkg: string): string {
  const pkgParts = pkg.split("/");
  let pkgName = pkgParts.shift() || pkg;
  if (pkgName && pkgName.startsWith("@")) {
    pkgName += `/${pkgParts.shift()}`;
  }
  return pkgName;
}

export type { CostResult, Options, Language, Logger, ImportSize } from "./types";
export { cache } from "./caching";
