import { defineConfig } from "vite";

// this config lets frontend call /api/v1 while php backend runs on port 8000
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});