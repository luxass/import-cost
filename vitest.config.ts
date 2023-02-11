import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    alias: {
      "env:path": "./src/env/node/path"
    }
  }
});
