import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = new URL("./", import.meta.url).pathname;

export default defineConfig({
  base: "./",
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
    rollupOptions: {
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
