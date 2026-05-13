import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGET = process.env.VITE_DEV_API_PROXY || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Same-origin in dev → no CORS. Browser calls /api/v1/... → Express on :5000
      "/api": {
        target: API_TARGET,
        changeOrigin: true
      },
      "/socket.io": {
        target: API_TARGET,
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          editor: ["@tiptap/react", "@tiptap/starter-kit"]
        }
      }
    }
  }
});
