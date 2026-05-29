/**
 * 🎣 useAuth Hook
 * Hook React pour gérer l'authentification
 * À utiliser dans les composants pour login, register, logout
 */

import { useState, useCallback, useEffect } from 'react';
import { authService, AuthResponse } from '@/services/authService';

export interface UseAuthState {
  // État
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  user: AuthResponse['user'] | null;

  // Méthodes
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
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
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

/**
 * Hook pour l'authentification
 */
export const useAuth = (): UseAuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);

  // Initialiser l'état depuis le localStorage au mount
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    const isAuth = authService.isAuthenticated();

    setUser(storedUser);
    setIsAuthenticated(isAuth);
  }, []);

  /**
   * 🔑 Login
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login({ email, password });

      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMessage = err.data?.message || err.message || 'Erreur de connexion';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 📝 Register
   */
  const register = useCallback(async (data: {
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
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.register(data);

      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      const errorMessage = err.data?.message || err.message || 'Erreur d\'inscription';
      setError(errorMessage);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🚪 Logout
   */
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  /**
   * 🧹 Effacer les erreurs
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    register,
    logout,
    clearError,
  };
};
