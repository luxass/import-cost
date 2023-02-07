import { find } from "engine/find";
import type { Uri } from "vscode";
import { window, workspace } from "vscode";

import { config } from "./configuration";
import { log } from "./log";

export async function findPackageManager(workspaceUri: Uri) {
  let pkgManager = config.get("packageManager", {
    section: "npm"
  });
  log.info("Using package manager", pkgManager);

  if (pkgManager === "auto") {
    const file = await find(
      ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"],
      {
        cwd: workspaceUri
      }
    );

    log.info("Found package manager lock file", file);

    if (file?.endsWith("yarn.lock")) {
      pkgManager = "yarn";
    } else if (file?.endsWith("pnpm-lock.yaml")) {
      pkgManager = "pnpm";
    } else {
      pkgManager = "npm";
    }
  }

  return pkgManager;
}

export async function getPackageManager() {
  const workspaceFolders = workspace.workspaceFolders;

  let pm: "npm" | "yarn" | "pnpm" = "npm";
  if (!workspaceFolders) {
    const result = await window.showQuickPick(["npm", "yarn", "pnpm"], {
      title: "Select a package manager"
    });

    if (result) {
      pm = result as "npm" | "yarn" | "pnpm";
    }
  } else {
    // TODO: Support multiple workspaces
    pm = await findPackageManager(workspaceFolders[0].uri);
  }

  return pm;
}
