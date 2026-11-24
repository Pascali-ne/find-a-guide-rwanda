import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In development the API runs on :4000; the proxy keeps the client free of CORS and URL configuration.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/uploads": "http://localhost:4000",
    },
  },
});
