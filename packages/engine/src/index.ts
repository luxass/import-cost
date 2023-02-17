import { find } from "env:find";
import { readFile } from "env:fs";
import { join } from "env:path";
import type { Message } from "esbuild";

import { calculateSize } from "./build";
import { builtins } from "./builtins";
import { defaultLog } from "./logger";
import { parseImports } from "./parse";
import type {
  CalculateOptions,
  CalculateResult,
  CalculatedImport,
  FindFn,
  FindOptions,
  Import,
  Language,
  Logger
} from "./types";

export { filesize } from "filesize";
export { cache } from "./caching";
export { parseImports };
export type { FindFn, FindOptions, Logger, Import, Language };

export async function calculate({
  imports,
  log = defaultLog,
  find,
  cwd,
  esbuildBinary,
  externals,
  platform,
  format
}: CalculateOptions): Promise<CalculateResult | undefined> {
  log.info("Calculating cost of imports...");

  try {
    if (!find) {
      find = (await import("./find")).default;
    }

    const node_modules = await find("node_modules", {
      cwd
    });

    if (!node_modules) {
      log.error("Could not find node_modules");
      return undefined;
    }

    await Promise.allSettled(
      imports.map(async (pkg) => {
        try {
          const pkgPath = join(
            node_modules,
            getPackageName(pkg.name),
            "package.json"
          );
          const { version } = JSON.parse(
            new TextDecoder().decode(await readFile(pkgPath))
          );
          log.info(`Found version ${version} for ${pkg.name}`);

          pkg.version = version;
          return pkg;
        } catch (e) {
          return undefined;
        }
      })
    );

    log.info(`Found ${imports.length} imports for ${cwd}`);

    imports = imports.filter((_import) => {
      log.info(`Checking import: ${_import.name}`, _import.version);
      log.info(`${_import.version ? "✅" : "❌"} ${_import.name}`);
      return !!_import.version;
    });

    if (!imports.length) {
      return;
    }

    const warnings: Message[] = [];
    const errors: Message[] = [];
    const packages: CalculatedImport[] = [];

    for await (const result of imports.map((pkg) =>
      calculateSize(pkg, {
        log,
        externals: externals || [],
        esbuild: esbuildBinary,
        format,
        platform
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
    log.error(e);
    return undefined;
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

function getPackageName(pkg: string): string {
  const pkgParts = pkg.split("/");
  let pkgName = pkgParts.shift() || pkg;
  if (pkgName && pkgName.startsWith("@")) {
    pkgName += `/${pkgParts.shift()}`;
  }
  return pkgName;
}
