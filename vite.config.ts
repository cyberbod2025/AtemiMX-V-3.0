import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = new URL("./src", import.meta.url).pathname;

export default defineConfig({
  base: "./",
  assetsInclude: ["**/*.svg"],
  plugins: [react()],
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    alias: {
      "@": projectRoot,
    },
  },
  build: {
    outDir: "web-dist",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) {
              return "firebase";
            }
            if (id.includes("react")) {
              return "react-vendor";
            }
            return "vendor";
          }
        },
      },
      // external: [
      //   "firebase/app",
      //   "firebase/auth",
      //   "firebase/firestore",
      //   "firebase/functions"
      // ],
    },
  },
  optimizeDeps: {
    include: ["firebase/app", "firebase/auth", "firebase/firestore", "firebase/functions"],
  },
});
