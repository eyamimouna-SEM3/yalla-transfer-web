import type { AuthUser } from "@/services/authService";

const TOKEN_KEY = "yalla_transfer_token";
const USER_KEY = "yalla_transfer_user";

/**
 * Stockage de session utilisé pour persister le JWT et l'utilisateur courant.
 *
 * On utilise sessionStorage (et plus localStorage) pour DEUX raisons :
 *
 * 1. ISOLATION PAR ONGLET : sessionStorage n'est pas partagé entre les
 *    onglets. Cela permet d'ouvrir simultanément plusieurs comptes
 *    (admin + fournisseur + chauffeur + client) dans des onglets différents
 *    sans qu'ils s'écrasent l'un l'autre.
 *
 * 2. SESSION FRAÎCHE À CHAQUE OUVERTURE : à la fermeture de l'onglet, la
 *    session est purgée automatiquement. Cela évite qu'à la prochaine
 *    visite l'utilisateur soit déjà "connecté" avec un compte oublié, et
 *    élimine les conflits de tokens expirés côté admin.
 *
 * On nettoie d'abord d'éventuels résidus en localStorage (héritage de
 * l'ancienne version) pour éviter qu'ils ne créent une session fantôme.
 */
const purgeLegacyLocalStorage = () => {
  try {
    if (localStorage.getItem(TOKEN_KEY) || localStorage.getItem(USER_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    /* navigateur sans localStorage : on ignore */
  }
};
purgeLegacyLocalStorage();

export const tokenStorage = {
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  getUser(): AuthUser | null {
    const value = sessionStorage.getItem(USER_KEY);
    if (!value) return null;

    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      sessionStorage.removeItem(USER_KEY);
      return null;
    }
  },

  setUser(user: AuthUser) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};
