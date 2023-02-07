import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { Uri, commands, window, workspace } from "vscode";

import { config } from "../../configuration";
import { log } from "../../logger";
import { findPackageManager } from "../../pm";
import type { PackageManager } from "../../types";

const IS_WIN = process.platform === "win32";

export async function locateESBuild() {
  const workspaceFolders = workspace.workspaceFolders;

  let pm: PackageManager = config.get("fallback") || "npm";
  if (workspaceFolders?.length) {
    // TODO: Support multiple workspaces
    pm = await findPackageManager(workspaceFolders[0].uri);
  }

  let esbuildPath = getGlobalDirectory(pm);

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
      esbuildPath = getGlobalDirectory(pm);
    }
  }

  return esbuildPath;
}

function getGlobalDirectory(pm: string): string {
  const cmd = IS_WIN ? `${pm}.cmd` : pm;
  const args = pm === "yarn" ? ["global", "dir"] : ["root", "-g"];
  const { stdout } = spawnSync(cmd, args, {
    shell: true,
    encoding: "utf8"
  });

  return join(
    stdout.trim(),
    pm === "yarn" ? "node_modules/esbuild/lib/main.js" : "esbuild/lib/main.js"
  );
}
