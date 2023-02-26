import { join } from "node:path";

import type { FindFn } from "./find";
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

  /**
   * Find a file in the file system by traversing upwards.
   * @param {string|string[]} name name of the file(s) to find
   * @param {URL} cwd URL the directory to start searching from
   * @returns {Promsie<string | undefined>} the path to the file or undefined if not found
   */
  find: FindFn;

  /**
   * Read a file from the file system.
   * @param path The path to the file to read
   * @returns {Promise<string>} The contents of the file
   */
  readFile: (path: string) => Promise<string>;

  /**
   * Logging function to forward logs
   */
  log?: (...args: any[]) => void;
}

export async function resolve({
  cwd,
  imports,
  find,
  readFile,
  log = console.log
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

        const { version } = JSON.parse(await readFile(pkgPath));
        log(`Found version ${version} for ${pkg.name}`);

        pkg.version = version;
        return pkg;
      } catch (e) {
        return undefined;
      }
    })
  );

  imports = imports.filter((_import) => {
    log(`${_import.version ? "✅" : "❌"} ${_import.name}`);
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
