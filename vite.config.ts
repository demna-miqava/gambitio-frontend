/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // With VITE_API_BASE_URL / VITE_WS_BASE_URL left empty the app calls its own
  // origin (/api), as it does on Cloudflare. The dev server forwards those
  // requests and sockets to the local backend, so a phone on the LAN works
  // without knowing the Mac's current IP.
  server: {
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:8080",
        ws: true,
      },
    },
  },
  test: {
    // Tests skip CSS by default (imports come back empty); the share-GIF
    // tests read the piece images out of this one with ?raw
    css: { include: [/chessground\.cburnett\.css/] },
  },
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor code in its own cacheable chunks, so a deploy that
        // only changes app code doesn't make users re-download React or Clerk
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return "react";
          if (id.includes("node_modules/@clerk/")) return "clerk";
        },
      },
    },
  },
});
