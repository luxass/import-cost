import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    alias: {
      "env:*": "./src/env/node/*"
    },
    
  }
});
