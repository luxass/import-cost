import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { getPackageManager } from "pm";
import { Uri, commands, window, workspace } from "vscode";

import { log } from "../../log";

export async function locateESBuild() {
  const pm = await getPackageManager();

  const isWin = process.platform === "win32";

  const cmd = isWin ? `${pm}.cmd` : pm;
  const args = pm === "yarn" ? ["global", "dir"] : ["root", "-g"];

  // TODO: Also check the other global directories, we dont want to install 3 seperate esbuilds....
  // Maybe introduce a new setting to set a fallback path?
  // Like npm is default.
  const createGlobal = () =>
    join(
      getGlobalDirectory(cmd, args),
      pm === "yarn" ? "node_modules/esbuild/lib/main.js" : "esbuild/lib/main.js"
    );

  let esbuildPath = createGlobal();

  try {
    await workspace.fs.stat(Uri.file(esbuildPath));
  } catch (e) {
    esbuildPath = "";
  }

  if (!esbuildPath) {
    log.error("Couldn't locate ESBuild");
    const action = await window.showErrorMessage(
      "ESBuild is not installed. Please install it to use this extension.\nYou can read more about why [here](https://luxass.dev/import-cost)",
      "Install ESBuild",
      "Skip"
    );

    if (action === "Install ESBuild") {
      log.info("Installing ESBuild");
      await commands.executeCommand("import-cost.install-esbuild");
      esbuildPath = createGlobal();
    }
  }

  return esbuildPath;
}

function getGlobalDirectory(pm: string, args: string[]): string {
  const { stdout } = spawnSync(pm, args, {
    shell: true,
    encoding: "utf8"
  });
  return stdout.trim();
}
