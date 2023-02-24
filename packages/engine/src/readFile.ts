import { readFile as nodeReadFile } from "node:fs/promises";

export default function readFile(path: string) {
  return nodeReadFile(path, "utf-8");
}
