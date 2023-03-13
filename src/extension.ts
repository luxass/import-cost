// import { cache } from "import-cost-engine";

import { locateESBuild } from "env:locate";
import type { ExtensionContext, TextDocument } from "vscode";
import {
  ExtensionMode,
  ShellExecution,
  Task,
  TaskScope,
  Uri,
  commands,
  extensions,
  tasks,
  window,
  workspace
} from "vscode";

import { config } from "./configuration";
import { flush } from "./decoration";
import { cache } from "./engine/cache";
import { log } from "./log";
import { scan } from "./scan";

declare global {
  const IS_WEB: boolean;
}

const debouncedScan = debounce(
  (document: TextDocument, esbuildPath: string) => scan(document, esbuildPath),
  300
);

export async function activate(ctx: ExtensionContext) {
  const wixImportCost = extensions.getExtension("wix.vscode-import-cost");
  if (wixImportCost) {
    window.showWarningMessage(
      "You have both Wix Import Cost and Import Cost installed. Please uninstall Wix Import Cost to avoid conflicts."
    );

    if (ctx.extensionMode !== ExtensionMode.Development) {
      return;
    }
  }

  if (!IS_WEB) {
    ctx.subscriptions.push(
      commands.registerCommand("import-cost.install-esbuild", async () => {
        await tasks.executeTask(
          new Task(
            {
              type: "npm"
            },
            TaskScope.Workspace,
            "Installing ESBuild",
            "npm",
            new ShellExecution("npm", ["install", "-g", "esbuild"])
          )
        );
      })
    );
  }

  if (IS_WEB) {
    // We initialize esbuild-wasm here
    const wasm = await import("esbuild-wasm");
    const uri = Uri.joinPath(ctx.extensionUri, "dist/web/esbuild.wasm");
    log.info("ESBuild wasm path", uri.fsPath);
    await wasm.initialize({
      wasmURL: uri.toString(true)
    });
  }

  const esbuildPath = await locateESBuild();
  log.info("ESBuild path", esbuildPath);

  const enable = config.get("enable");
  log.info("Import Cost is turned", enable ? "on" : "off");

  ctx.subscriptions.push(
    workspace.onDidChangeTextDocument(async (event) => {
      if (!event?.document || !esbuildPath || !config.get("enable")) return;
      await debouncedScan(event.document, esbuildPath);
    }),
    window.onDidChangeActiveTextEditor(async (event) => {
      if (!event?.document || !esbuildPath || !config.get("enable")) return;
      await debouncedScan(event.document, esbuildPath);
    }),
    workspace.onDidChangeWorkspaceFolders(async (event) => {
      log.info("Workspace folders changed");
      log.info(event);
    })
  );
  ctx.subscriptions.push(
    commands.registerCommand("import-cost.toggle-import-cost", () => {
      window.showInformationMessage("Import Cost: toggle-declaration");
      const enableValue = config.get("enable");
      if (!enableValue) {
        log.info(window.activeTextEditor, esbuildPath);
        if (window.activeTextEditor?.document && esbuildPath) {
          scan(window.activeTextEditor.document, esbuildPath);
          log.info("scan");
        }
      } else {
        flush(window.activeTextEditor);
      }

      config.set("enable", !enableValue);
      window.showInformationMessage(
        `Import Cost is now turned ${!enableValue ? "on" : "off"}`
      );
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand("import-cost.clear-import-cache", () => {
      log.info(`Cache is now cleared, contained ${cache.size} items`);
      cache.clear();

      flush(window.activeTextEditor);
      window.showInformationMessage("Import Cost cache cleared");
    })
  );

  if (
    window.activeTextEditor?.document &&
    esbuildPath &&
    config.get("enable")
  ) {
    await scan(window.activeTextEditor.document, esbuildPath);
  }
}

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | undefined;

  return async function debounced(
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        const result = await fn(...args);
        resolve(result);
      }, wait);
    });
  };
}
