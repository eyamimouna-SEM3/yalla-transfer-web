/**
 * 🔐 Token Storage Utility
 * Gestion du JWT token dans localStorage
 * Utilisé par web ET mobile (Flutter via localStorage de l'API web)
 */

const TOKEN_KEY = 'yalla_transfer_token';
const USER_KEY = 'yalla_transfer_user';

export const tokenStorage = {
  /**
   * Sauvegarder le token dans localStorage
   */
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  /**
   * Récupérer le token depuis localStorage
   */
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  /**
   * Supprimer le token (logout)
   */
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  /**
   * Sauvegarder les infos de l'utilisateur
   */
  setUser: (user: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  /**
   * Récupérer les infos de l'utilisateur
   */
  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  /**
   * Supprimer les infos de l'utilisateur
   */
  removeUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem(TOKEN_KEY);
    }
    return false;
  },

  /**
   * Vider complètement le storage (logout complet)
   */
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Récupérer le token pour les headers Authorization
   */
  getAuthHeader: () => {
    const token = tokenStorage.getToken();
    return token ? `Bearer ${token}` : null;
  },
};
