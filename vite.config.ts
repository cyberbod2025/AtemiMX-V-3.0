import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "path";

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
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "web-dist",
    emptyOutDir: false,
    chunkSizeWarningLimit: 1100,
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
