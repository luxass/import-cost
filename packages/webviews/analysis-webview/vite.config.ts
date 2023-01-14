import Unocss from "unocss/vite";
import { defineConfig } from "vite";

import preact from "@preact/preset-vite";
import presetUno from "@unocss/preset-uno";

export default defineConfig({
  plugins: [
    Unocss({
      presets: [presetUno()]
    }),
    preact()
  ],
  build: {
    outDir: "../../vscode/dist/webviews/analysis-webview",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]"
      }
    }
  }
});
