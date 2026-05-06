import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const serverPort = Number(process.env.SERVER_PORT || 8787);

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT || 3000),
    proxy: {
      "/api": `http://localhost:${serverPort}`,
      "/health": `http://localhost:${serverPort}`,
    },
  },
  preview: {
    port: Number(process.env.PORT || 3000),
  },
});

