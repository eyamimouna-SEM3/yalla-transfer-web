/**
 * 📡 API Configuration
 * URL de base et configuration des appels HTTP
 * Utilisé par React web ET Flutter mobile
 */

import { tokenStorage } from '@/utils/tokenStorage';

// URL de l'API backend NestJS
const legacyApiUrl =
  typeof process !== 'undefined' ? process.env.REACT_APP_API_URL : undefined;

const API_BASE_URL =
  import.meta.env.VITE_API_URL || legacyApiUrl || 'http://localhost:3000/api';

/**
 * Configuration pour tous les appels API
 */
export const apiConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Fonction générique pour faire des appels API
 * Gère l'authentification automatiquement
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit & { params?: Record<string, any> } = {},
): Promise<T> => {
  const { params, ...fetchOptions } = options;

  // Construire l'URL avec les paramètres
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Ajouter les headers par défaut
  const headers = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  // Ajouter le token d'authentification si disponible
  const token = tokenStorage.getToken();
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Gérer les erreurs HTTP
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: error.message || `HTTP ${response.status}`,
        data: error,
      };
    }

    // Retourner les données
    const data = await response.json();
    return data as T;
  } catch (error: any) {
    // Gérer les erreurs de réseau
    if (error.status === 401) {
      // Token expiré ou non valide
      tokenStorage.clear();
      window.location.href = '/auth';
    }
    throw error;
  }
};

/**
 * Shortcuts pour les méthodes HTTP courantes
 */
export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit & { params?: Record<string, any> }) =>
    apiCall<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit & { params?: Record<string, any> }) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit & { params?: Record<string, any> }) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit & { params?: Record<string, any> }) =>
    apiCall<T>(endpoint, { ...options, method: 'DELETE' }),
};
