import { find } from "env:find";
import { readFile } from "env:fs";
import { join } from "env:path";
import type { Message } from "esbuild";

import { builtins } from "./builtins";
import { defaultLog } from "./logger";
import { parseImports } from "./parse";
import type { CalculateOptions, CalculateResult, CalculatedImport } from "./types";

export { filesize } from "filesize";
export { cache } from "./caching";
export { parseImports };

export async function calculate({
  imports,
  log = defaultLog,
  find,
  cwd
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
        } catch (e) {
          return undefined;
        }
      })
    );

    const warnings: Message[] = [];
    const errors: Message[] = [];
    const packages: CalculatedImport[] = [];

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

// export async function calculateCost({
//   path,
//   language,
//   externals,
//   code,
//   cwd,
//   esbuild,
//   skips,
//   format,
//   platform,
//   formats,
//   platforms
// }: Options): Promise<CostResult | null> {
//   try {
//     // if (language === "astro" || language === "vue" || language === "svelte") {
//     //   const extracted = extractCode(code, language);
//     //   if (extracted) {
//     //     code = extracted.code;
//     //     language = extracted.language;
//     //   }
//     // }
//     let parsedImports = parseImports({
//       fileName: path,
//       content: code,
//       language,
//       skips,
//       formats: formats || {},
//       platforms: platforms || {}
//     });

//     // They are all using the same file.
//     // So no need to check for node_modules in the folder each time.
//     const node_modules = await find("node_modules", {
//       cwd: new URL(dirname(path))
//     });

//     await Promise.allSettled(
//       parsedImports.map(
//         async (pkg) => (pkg.version = await getVersion(pkg, node_modules))
//       )
//     );

//     log.info(`Found ${parsedImports.length} imports for ${path}`);

//     parsedImports = parsedImports.filter((_import) => {
//       log.info(`${_import.version ? "✅" : "❌"} ${_import.name}`);
//       return !!_import.version;
//     });

//     if (!parsedImports.length) {
//       return null;
//     }

//     const warnings: Message[] = [];
//     const errors: Message[] = [];
//     const packages: ImportSize[] = [];

//     log.info(`Resolving externals for ${path}`);
//     externals = await resolveExternals(
//       new URL(dirname(cwd.pathname)),
//       externals
//     );

//     for await (const result of parsedImports.map((_import) =>
//       calculateSize(_import, {
//         externals,
//         format,
//         platform,
//         esbuild
//       })
//     )) {
//       result.errors = result.errors.concat(result.errors);
//       result.warnings = result.warnings.concat(result.warnings);
//       packages.push({
//         name: result.pkg.name,
//         line: result.pkg.line,
//         path: result.pkg.fileName,
//         size: {
//           bytes: result.pkg.size,
//           gzip: result.pkg.gzip
//         }
//       });
//     }
//     return {
//       packages,
//       errors,
//       warnings
//     };
//   } catch (e) {
//     console.error(e);
//     return null;
//   }
// }

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
