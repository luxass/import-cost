import type { ExtensionContext } from "vscode";
import { ExtensionMode, Uri, ViewColumn, window } from "vscode";

import { getHTML } from "./html";

export function openSetupPanel(ctx: ExtensionContext) {
  const panel = window.createWebviewPanel(
    "vscode-import-cost",
    "Import Cost Setup",
    ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  const setupPath = Uri.parse(
    `${ctx.extensionPath}/dist/webviews/setup-webview`
  );

  const scriptUri = panel.webview.asWebviewUri(
    Uri.joinPath(setupPath, "assets", "index.js")
  );

  const stylesUri = panel.webview.asWebviewUri(
    Uri.joinPath(setupPath, "assets", "index.css")
  );

  panel.webview.html = getHTML(ctx, {
    stylesUri: stylesUri.toString(),
    scriptUri: scriptUri.toString(),
    cspSource: panel.webview.cspSource
  });
}
