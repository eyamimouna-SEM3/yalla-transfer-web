/**
 * 💳 Payment Service
 * Gère tous les appels de paiement vers le backend NestJS
 * Format DTO adapté au schéma réel du backend
 */

import { api } from './api';

/**
 * Interface pour un paiement (réponse backend)
 */
export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: 'TND' | 'EUR' | 'USD';
  method: 'cash' | 'card' | 'stripe' | 'paypal' | 'virement';
  payment_timing: 'immediate' | 'deferred';
  status: 'pending' | 'paid' | 'refunded_partial' | 'refunded_full' | 'failed';
  transaction_ref?: string;
  voucher_url?: string;
  paid_at?: string;
  created_at: string;
}

/**
 * Interface pour créer un paiement (requête frontend)
 */
export interface CreatePaymentDTO {
  bookingId: string;
  amount: number;
  currency: 'TND' | 'EUR' | 'USD';
  method: 'cash' | 'card' | 'stripe' | 'paypal' | 'virement';
  paymentTiming: 'immediate' | 'deferred';
}

/**
 * Service de paiement
 */
export const paymentService = {
  /**
   * 💰 Créer un paiement
   * Route: POST /payments
   */
  create: async (data: CreatePaymentDTO): Promise<Payment> => {
    try {
      const response = await api.post<Payment>('/payments', data);
      console.log('✅ Paiement créé:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Erreur création paiement:', error);
      throw error;
    }
  },

  /**
   * 📋 Lister tous les paiements de l'utilisateur
   * Route: GET /payments
   */
  getAll: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Payment[]; total: number }> => {
    try {
      const response = await api.get<{ data: Payment[]; total: number }>(
        '/payments',
        { params }
      );
      return response;
    } catch (error: any) {
      console.error('❌ Erreur récupération paiements:', error);
      throw error;
    }
  },

  /**
   * 🔍 Récupérer un paiement par ID
   * Route: GET /payments/:id
   */
  getById: async (id: string): Promise<Payment> => {
    try {
      const response = await api.get<Payment>(`/payments/${id}`);
      return response;
    } catch (error: any) {
      console.error('❌ Erreur récupération paiement:', error);
      throw error;
    }
  },

  /**
   * 🔍 Récupérer un paiement par booking ID
   * Route: GET /payments/booking/:bookingId
   */
  getByBookingId: async (bookingId: string): Promise<Payment> => {
    try {
      const response = await api.get<Payment>(`/payments/booking/${bookingId}`);
      return response;
    } catch (error: any) {
      console.error('❌ Erreur récupération paiement:', error);
      throw error;
    }
  },

  /**
   * ✏️ Mettre à jour un paiement (ex: marquer comme complété)
   * Route: PUT /payments/:id
   */
  update: async (
    id: string,
    data: Partial<CreatePaymentDTO>
  ): Promise<Payment> => {
    try {
      const response = await api.put<Payment>(`/payments/${id}`, data);
      console.log('✅ Paiement mis à jour:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Erreur mise à jour paiement:', error);
      throw error;
    }
  },

  /**
   * 🎫 Obtenir le statut d'un paiement
   * Route: GET /payments/:id/status
   */
  getStatus: async (id: string): Promise<{ status: string }> => {
    try {
      const response = await api.get<{ status: string }>(
        `/payments/${id}/status`
      );
      return response;
    } catch (error: any) {
      console.error('❌ Erreur récupération statut paiement:', error);
      throw error;
    }
  },

  /**
   * 🔄 Valider un paiement (webhook ou confirmation)
   * Route: POST /payments/:id/verify
   */
  verify: async (id: string, data?: any): Promise<Payment> => {
    try {
      const response = await api.post<Payment>(`/payments/${id}/verify`, data);
      console.log('✅ Paiement vérifié:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Erreur vérification paiement:', error);
      throw error;
    }
  },
};
