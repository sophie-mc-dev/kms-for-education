import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") }, 
    ],
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
