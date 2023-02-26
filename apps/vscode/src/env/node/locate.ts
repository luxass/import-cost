import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { Uri, commands, window, workspace } from "vscode";

import { log } from "../../logger";

const IS_WIN = process.platform === "win32";

export async function locateESBuild() {
  let esbuildPath = getGlobalDirectory();

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
      esbuildPath = getGlobalDirectory();
      log.info("ESBuild path 23", esbuildPath);
      try {
        await workspace.fs.stat(Uri.file(esbuildPath));
      } catch (e) {
        window.showErrorMessage("Couldn't install ESBuild. Please try again.");
      }
    }
  }

  return esbuildPath;
}

function getGlobalDirectory(): string {
  const { stdout } = spawnSync(IS_WIN ? "npm.cmd" : "npm", ["root", "-g"], {
    shell: true,
    encoding: "utf8"
  });

  return join(stdout.trim(), "esbuild/lib/main.js");
}
