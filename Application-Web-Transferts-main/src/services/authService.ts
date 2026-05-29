/**
 * 🔐 Auth Service
 * Gère tous les appels d'authentification vers le backend NestJS
 */

import { api } from './api';
import { tokenStorage } from '@/utils/tokenStorage';

/**
 * Interface pour les réponses de login/register
 */
export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    phone?: string;
  };
}

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * 📝 Inscription - Crée un nouvel utilisateur
   * Route: POST /auth/register
   */
  register: async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role:
      | 'user'
      | 'provider'
      | 'admin'
      | 'client_b2c'
      | 'client_b2b'
      | 'driver_independent'
      | 'driver_employee'
      | 'supplier';
  }): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', data);

      // Sauvegarder le token et l'utilisateur
      tokenStorage.setToken(response.access_token);
      tokenStorage.setUser(response.user);

      return response;
    } catch (error: any) {
      console.error('Erreur registration:', error);
      throw error;
    }
  },

  /**
   * 🔑 Login - Connexion utilisateur
   * Route: POST /auth/login
   */
  login: async (data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);

      // Sauvegarder le token et l'utilisateur
      tokenStorage.setToken(response.access_token);
      tokenStorage.setUser(response.user);

      return response;
    } catch (error: any) {
      console.error('Erreur login:', error);
      throw error;
    }
  },

  /**
   * 🚪 Logout - Déconnexion
   */
  logout: () => {
    tokenStorage.clear();
    window.location.href = '/';
  },

  /**
   * 🔍 Récupérer l'utilisateur actuel
   */
  getCurrentUser: () => {
    return tokenStorage.getUser();
  },

  /**
   * 🔐 Vérifier si l'utilisateur est connecté
   */
  isAuthenticated: () => {
    return tokenStorage.isAuthenticated();
  },

  /**
   * 🎫 Récupérer le token JWT
   */
  getToken: () => {
    return tokenStorage.getToken();
  },

  /**
   * 🔄 Rafraîchir le token (optionnel - à implémenter si le backend le supporte)
   * Route: POST /auth/refresh (à adapter selon le backend)
   */
  refreshToken: async (): Promise<void> => {
    try {
      const response = await api.post<AuthResponse>('/auth/refresh');
      tokenStorage.setToken(response.access_token);
      tokenStorage.setUser(response.user);
    } catch (error: any) {
      console.error('Erreur refresh token:', error);
      tokenStorage.clear();
      throw error;
    }
  },
};
