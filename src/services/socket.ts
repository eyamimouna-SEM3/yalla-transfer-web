import { io, Socket } from "socket.io-client";
import { tokenStorage } from "@/utils/tokenStorage";

/**
 * URL de base pour Socket.IO.
 *
 * Stratégie :
 *  1. Si VITE_API_URL contient une URL absolue (http://… ou https://…), on la
 *     normalise en retirant le suffixe /api → c'est l'origine du backend.
 *  2. Sinon (URL relative comme "/api" en mode proxy Vite), on utilise
 *     `window.location.origin` qui correspond à l'origine actuelle du frontend.
 *     Vite proxy /socket.io vers le backend HTTP en interne, donc le navigateur
 *     n'est pas confronté au Mixed Content.
 */
const SOCKET_BASE = (() => {
  const raw = (import.meta.env.VITE_API_URL ?? "") as string;
  // URL absolue → on retire le suffixe /api
  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/api\/?$/, "");
  }
  // URL relative ou vide → on utilise l'origine du navigateur (proxy Vite gère le reste)
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:3000";
})();

type Namespace = "/bookings" | "/chat" | "/tracking";

const sockets = new Map<Namespace, Socket>();

/**
 * Récupère ou crée un socket sur le namespace donné.
 * Retourne null si aucun JWT n'est disponible (évite les tentatives infinies).
 */
export function getSocket(namespace: Namespace): Socket | null {
  const existing = sockets.get(namespace);
  if (existing) return existing;

  const token = tokenStorage.getToken();
  if (!token) return null;

  const socket = io(`${SOCKET_BASE}${namespace}`, {
    // Callback : socket.io rappelle cette fn avant chaque (re)connexion → token frais.
    auth: (cb) => cb({ token: tokenStorage.getToken() ?? "" }),
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 5,
  });

  sockets.set(namespace, socket);
  return socket;
}

export function disconnectAllSockets() {
  for (const [, socket] of sockets) {
    socket.disconnect();
  }
  sockets.clear();
}

/**
 * Force reconnection after a login or logout (refreshes the JWT used in handshake).
 */
export function reconnectSocketsWithCurrentToken() {
  disconnectAllSockets();
}
