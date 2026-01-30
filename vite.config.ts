import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // ✅ VERY IMPORTANT: subfolder path
  base: "/tomaths/admin/",

  plugins: [react()],

  optimizeDeps: {
    exclude: ["lucide-react"],
  },

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://xiadot.com/admin_maths",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },

  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
});
