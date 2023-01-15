import type { ExtensionContext } from "vscode";
import { ExtensionMode } from "vscode";

export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

interface HTMLContext {
  stylesUri: string;
  scriptUri: string;
  cspSource: string;
}

export function getHTML(
  ctx: ExtensionContext,
  { stylesUri, scriptUri, cspSource }: HTMLContext
) {
  const IS_DEV = ctx.extensionMode === ExtensionMode.Development;
  if (IS_DEV) {
    return /* html */ `
      <iframe src="http://localhost:3000" height="100%" width="100%" frameborder="0" style="position: absolute; width: 100%; height: 100%; top: 0; left:0;"></iframe>
    `;
  }
  const nonce = getNonce();

  return /* html */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        ${
          !IS_DEV &&
          `<link rel="stylesheet" type="text/css" href="${stylesUri}">`
        }
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${cspSource}; script-src 'nonce-${nonce}';">
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>
    `;
}
