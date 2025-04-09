import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  server: {
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
    },
    host: '0.0.0.0',
  },
});
