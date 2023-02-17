import path from "node:path";

export function fixture(fileName: string, ...args: string[]) {
  return path.join(__dirname, "fixtures", fileName, ...args);
}
