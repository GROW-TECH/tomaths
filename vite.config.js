import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    base: "/", // ✅ REQUIRED
    plugins: [react()],
    server: {},
});
