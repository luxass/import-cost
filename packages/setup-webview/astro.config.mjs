import { defineConfig } from "astro/config";

export default defineConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name].[hash].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash][extname]"
        }
      }
    }
  }
});
