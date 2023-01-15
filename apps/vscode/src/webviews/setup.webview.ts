import type { ExtensionContext } from "vscode";
import { Uri, ViewColumn, window } from "vscode";

import { getNonce } from "./utils";

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

  const nonce = getNonce();

  const html = /* html */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" type="text/css" href="${stylesUri}">
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${panel.webview.cspSource}; script-src 'nonce-${nonce}';">
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
        </script>
      </head>
      <body>
        <div id="app"></div>
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>
  `;

  panel.webview.html = html;
}
