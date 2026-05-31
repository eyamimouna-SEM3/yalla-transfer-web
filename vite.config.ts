import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge .env / .env.local pour pouvoir lire VITE_DISABLE_HTTPS
  const env = loadEnv(mode, process.cwd(), "");
  // Mets VITE_DISABLE_HTTPS=1 dans .env.local pour servir en HTTP simple
  // (utile pour tester depuis ton téléphone ou un PC binôme sans installer
  //  la CA mkcert dessus).
  const httpsDisabled = env.VITE_DISABLE_HTTPS === "1";

  return {
    server: {
      host: "::",
      port: 8080,
      // HTTPS local via mkcert (cadenas vert). Désactivé si VITE_DISABLE_HTTPS=1.
      // Proxy : évite le Mixed Content en relayant /api et /socket.io vers le
      // backend HTTP localhost:3000 en dev.
      proxy: {
        "/api": {
          // 127.0.0.1 forcé (pas "localhost") car Node 18+ résout
          // localhost en IPv6 (::1) alors que le backend NestJS écoute
          // uniquement en IPv4 → ECONNREFUSED systématique.
          target: "http://127.0.0.1:3000",
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          // 127.0.0.1 forcé (pas "localhost") car Node 18+ résout
          // localhost en IPv6 (::1) alors que le backend NestJS écoute
          // uniquement en IPv4 → ECONNREFUSED systématique.
          target: "http://127.0.0.1:3000",
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
      // mkcert utile uniquement en dev local. Désactivé si HTTPS off ou en build.
      mode === "development" && !httpsDisabled && mkcert(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
