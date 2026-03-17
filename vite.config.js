import { defineConfig } from "vite";
import { resolve } from "path";
export default defineConfig({
    publicDir: "public",
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                background: resolve(__dirname, "src/background/background.js"),
                contentScript: resolve(__dirname, "src/content/content.js"),
                popup: resolve(__dirname, "src/popup/popup.js")
            },
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "[name].js",
                assetFileNames: "[name].[ext]"
            }
        }
    }
});
