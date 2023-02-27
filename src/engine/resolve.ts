import { join } from "node:path";

import { Uri, workspace } from "vscode";

import { find } from "../find";
import { log } from "../log";
import type { Import } from "./parser";

export interface ResolveOptions {
  /**
   * The current working directory.
   */
  cwd: URL;

  /**
   * The imports to resolve versions.
   */
  imports: Import[];
}

export async function resolve({
  cwd,
  imports
}: ResolveOptions): Promise<Import[]> {
  const node_modules = await find("node_modules", cwd);

  if (!node_modules) {
    throw new TypeError("Could not find node_modules");
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
          new TextDecoder().decode(
            await workspace.fs.readFile(Uri.file(pkgPath))
          )
        );
        log.info(`Found version ${version} for ${pkg.name}`);

        pkg.version = version;
        return pkg;
      } catch (e) {
        return undefined;
      }
    })
  );

  imports = imports.filter((_import) => {
    log.info(`${_import.version ? "✅" : "❌"} ${_import.name}`);
    return !!_import.version;
  });

  // const externals = builtins;

  // const pkg = await find("package.json", cwd);

  // if (pkg) {
  //   const { peerDependencies } = JSON.parse(await readFile(pkg));
  //   if (peerDependencies) {
  //     log(
  //       `Found peer dependencies: ${Object.keys(peerDependencies).join(", ")}`
  //     );
  //     externals.push(...Object.keys(peerDependencies));
  //   }
  // }

  return imports;
}

function getPackageName(pkg: string): string {
  const pkgParts = pkg.split("/");
  let pkgName = pkgParts.shift() || pkg;
  if (pkgName && pkgName.startsWith("@")) {
    pkgName += `/${pkgParts.shift()}`;
  }
  return pkgName;
}
