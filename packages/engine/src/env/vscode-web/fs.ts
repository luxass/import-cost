import { Uri, workspace } from "vscode";

export async function readFile(path: string) {
  return await workspace.fs.readFile(Uri.file(path));
}
