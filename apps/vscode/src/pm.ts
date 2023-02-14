import { find } from "import-cost-engine/vscode";
import { Uri, workspace } from "vscode";

import { config } from "./configuration";
import { log } from "./logger";
import type { PackageManager } from "./types";

export async function findPackageManager(workspaceUri: Uri) {
  let pkgManager = config.get("packageManager", {
    section: "npm"
  });
  log.info("Using package manager", pkgManager);

  if (pkgManager === "auto") {
    const file = await find(
      ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"],
      {
        cwd: new URL(workspaceUri.fsPath)
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

  let pm: PackageManager = config.get("fallback") || "npm";
  if (workspaceFolders?.length) {
    const work = workspace.getWorkspaceFolder(
      Uri.file("/home/luxas/Desktop/my-t3-app/src/pages/index.tsx")
    );
    log.info("Workspace", work);
    // TODO: Support multiple workspaces
    pm = await findPackageManager(workspaceFolders[0].uri);
  }

  return pm;
}
