import { window, workspace, type ExtensionContext } from "vscode";

export function activate(context: ExtensionContext) {
  console.log(context);

  console.log("hey!");
  workspace.onDidChangeTextDocument((event) => {
    console.log("workspace#onDidChangeTextDocument", event);
  });

  window.onDidChangeActiveTextEditor((event) => {
    console.log("window#onDidChangeActiveTextEditor", event);
  });
}
