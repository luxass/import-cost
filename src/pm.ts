import { find } from "elysius";
import type { Uri } from "vscode";

import { config } from "./configuration";
import { log } from "./log";

export async function getPackageManager(workspaceUri: Uri) {
  let pkgManager = config.get("packageManager", {
    section: "npm"
  });
  log.info("Using package manager", pkgManager);

  if (pkgManager === "auto") {
    const file = await find(
      ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"],
      {
        cwd: workspaceUri.fsPath
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
