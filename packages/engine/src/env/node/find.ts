import { stat } from "node:fs/promises";
import { parse, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface FindOptions {
  cwd: URL;
}

export async function find(
  name: string | string[],
  options: FindOptions
): Promise<string | undefined> {
  let dir = resolve(fileURLToPath(options.cwd));

  const root = parse(dir).root;
  const fileNames = Array.isArray(name) ? name : [name];

  while (dir !== root) {
    for (const name of fileNames) {
      const file = fileURLToPath(resolve(dir, name));
      try {
        await stat(file);
        return file;
      } catch (e) {
        console.log(e);

        if (e.code !== "FileNotFound") {
          throw e;
        }
      }
    }
    dir = parse(dir).dir;
  }
  return undefined;
}
