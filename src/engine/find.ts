import { dirname, parse, resolve } from "env:path";
import { Uri, workspace } from "vscode";

export interface FindOptions {
  cwd: Uri;
}

export async function find(
  name: string | string[],
  options: FindOptions
): Promise<string | undefined> {
  let dir = resolve(dirname(options.cwd.fsPath));

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
