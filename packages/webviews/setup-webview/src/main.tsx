import { render } from "preact";

import { App } from "./app";

import "uno.css";

render(<App />, document.getElementById("app") as HTMLElement);
