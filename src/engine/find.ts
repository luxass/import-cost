import { workspace } from "vscode";

export interface FindOptions {
  cwd?: string;
}

export async function find(name: string[], options: FindOptions) {
  // TODO: Support multiple workspaces
  

  const fileNames = Array.isArray(name) ? name : [name];

  // let dir = resolve(options?.cwd || process.cwd());

  // const root = options?.stop || parse(dir).root;
  // const fileNames = Array.isArray(name) ? name : [name];

  // while (dir !== root) {
  //   for (const name of fileNames) {
  //     const file = resolve(dir, name);
  //     try {
  //       await stat(file);
  //       if (!options?.test || (await options.test(file))) return file;
  //     } catch (e) {
  //       if (e.code !== "ENOENT") {
  //         throw e;
  //       }
  //     }
  //   }
  //   dir = parse(dir).dir;
  // }
  // return null;
}
