import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // ✅ VERY IMPORTANT: subfolder path
  base: "/admin/",

  plugins: [react()],

  optimizeDeps: {
    exclude: ["lucide-react"],
  },

  server: {
    port: 5173,
   
  },

  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
  },
});
