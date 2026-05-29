import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // HTTPS local via mkcert (cf. plugins ci-dessous). Pas appliqué en build.
    // Proxy : évite le Mixed Content en relayant /api et /socket.io vers le
    // backend HTTP localhost:3000 en dev.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    // mkcert n'est utile qu'en dev (cert local). En build Vercel, il est inutile
    // et pourrait déclencher des erreurs de génération de cert.
    mode === "development" && mkcert(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
