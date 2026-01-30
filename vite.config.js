import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    base: "/tomaths/", // ✅ REQUIRED
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: "https://xiadot.com",
                changeOrigin: true,
                secure: true,
            },
        },
    },
});
