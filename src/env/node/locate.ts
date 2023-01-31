import { getPackageManager } from "pm";
import type { Uri } from "vscode";

export async function locateESBuild(workspaceUri: Uri) {
  const pm = await getPackageManager(workspaceUri);
  console.log(pm);
  
  return "esbuild";
}
