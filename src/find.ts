import { parse, resolve } from "node:path";

import { Uri, workspace } from "vscode";

export async function find(
  name: string | string[],
  cwd: URL
): Promise<string | undefined> {
  let dir = resolve(Uri.file(cwd.pathname).fsPath);

  const root = parse(dir).root;
  const fileNames = Array.isArray(name) ? name : [name];

  while (dir !== root) {
    for (const name of fileNames) {
      const file = Uri.file(resolve(dir, name));
      try {
        await workspace.fs.stat(file);
        return file.fsPath;
      } catch (e) {
        if (e.code !== "FileNotFound") {
          throw e;
        }
      }
    }
    dir = parse(dir).dir;
  }
  return undefined;
}
