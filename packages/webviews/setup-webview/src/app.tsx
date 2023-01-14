import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

import { Logo } from "./Logo";

export function App() {
  return (
    <div>
      <Logo />
      <h1>Setup page</h1>
      <VSCodeButton>Do you want to set it up yourself?</VSCodeButton>
      
    </div>
  );
}
