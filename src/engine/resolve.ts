import { join } from "node:path";

import { Uri, workspace } from "vscode";

import { config } from "../configuration";
import { find } from "../find";
import { log } from "../log";
import { builtins } from "./builtins";
import type { Import } from "./parser";

export interface ResolveOptions {
  /**
   * The current working directory.
   */
  cwd: Uri;

  /**
   * The imports to resolve versions.
   */
  imports: Import[];
}

export async function resolve({ cwd, imports }: ResolveOptions): Promise<{
  imports: Import[];
  externals: string[];
}> {
  const node_modules = await find("node_modules", cwd);

  if (!node_modules) {
    throw new TypeError("Could not find node_modules");
  }

  console.time("Promise.allSettled");
  await Promise.allSettled(
    imports.map(async (pkg) => {
      try {
        const pkgName = getPackageName(pkg.name);
        log.info(`Resolving ${pkg.name}`);

        const pkgPath = join(node_modules, pkgName, "package.json");

        console.time(pkg.name);
        const { version } = JSON.parse(
          new TextDecoder().decode(
            await workspace.fs.readFile(Uri.file(pkgPath))
          )
        );
        console.timeEnd(pkg.name);
        log.info(`Found version ${version} for ${pkg.name}`);

        pkg.version = version;
        return pkg;
      } catch (e) {
        return undefined;
      }
    })
  );

  console.timeEnd("Promise.allSettled");

  imports = imports.filter((_import) => {
    log.info(`${_import.version ? "✅" : "❌"} ${_import.name}`);
    return !!_import.version;
  });

  const externals = builtins;

  const pkg = await find("package.json", cwd);

  if (pkg) {
    const { peerDependencies } = JSON.parse(
      new TextDecoder().decode(await workspace.fs.readFile(Uri.file(pkg)))
    );
    if (peerDependencies) {
      log.info(
        `Found peer dependencies: ${Object.keys(peerDependencies).join(", ")}`
      );
      externals.push(...Object.keys(peerDependencies));
    }
  }

  return {
    imports,
    externals: externals.concat(config.get("externals"))
  };
}

function getPackageName(pkg: string): string {
  const pkgParts = pkg.split("/");
  let pkgName = pkgParts.shift() || pkg;
  if (pkgName && pkgName.startsWith("@")) {
    pkgName += `/${pkgParts.shift()}`;
  }
  return pkgName;
}
