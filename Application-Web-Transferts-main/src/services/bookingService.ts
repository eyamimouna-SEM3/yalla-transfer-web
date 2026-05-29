/**
 * 📅 Booking Service
 * Gère tous les appels de réservation vers le backend NestJS
 * Format DTO adapté au schéma réel du backend
 */

import { api } from './api';

/**
 * Interface pour une réservation (réponse backend)
 */
export interface Booking {
  id: string;
  client_id: string;
  partner_id?: string;
  route_id?: string;
  pickup_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
  departure_time: string;
  passengers: number;
  luggage_count: number;
  luggage_details?: any[];
  driver_id?: string;
  vehicle_id?: string;
  supplier_id?: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  voucher_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface pour créer une réservation (requête frontend)
 */
export interface CreateBookingDTO {
  clientId: string;
  pickupAddress: string;
  dropoffAddress: string;
  departureTime: string; // ISO Format: "2026-04-01T10:00:00Z"
  passengers: number;
  luggageCount: number;
  luggageDetails?: Array<{
    type: string; // "valise", "sac", etc.
    longueur?: number;
    largeur?: number;
    hauteur?: number;
  }>;
  babySeat?: boolean;
  pmr?: boolean;
  notes?: string;
}

/**
 * Service de réservation
 */
export const bookingService = {
  /**
   * ✅ Créer une nouvelle réservation
   * Route: POST /bookings
   */
  create: async (data: CreateBookingDTO): Promise<Booking> => {
    try {
      const response = await api.post<Booking>('/bookings', data);
      console.log('✅ Réservation créée:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Erreur création réservation:', error);
      throw error;
    }
  },

  /**
   * 📋 Lister toutes les réservations de l'utilisateur
   * Route: GET /bookings
   */
  getAll: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Booking[]; total: number }> => {
    try {
      const response = await api.get<{ data: Booking[]; total: number }>(
        '/bookings',
        { params }
      );
      return response;
    } catch (error: any) {
      console.error('❌ Erreur récupération réservations:', error);
      throw error;
    }
  },

  /**
   * 🔍 Récupérer une réservation par ID
   * Route: GET /bookings/:id
   */
  getById: async (id: string): Promise<Booking> => {
    try {
      const response = await api.get<Booking>(`/bookings/${id}`);
      return response;
    } catch (error: any) {
      console.error('❌ Erreur récupération réservation:', error);
      throw error;
    }
  },

  /**
   * ✏️ Mettre à jour une réservation
   * Route: PUT /bookings/:id
   */
  update: async (
    id: string,
    data: Partial<CreateBookingDTO>
  ): Promise<Booking> => {
    try {
      const response = await api.put<Booking>(`/bookings/${id}`, data);
      console.log('✅ Réservation mise à jour:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Erreur mise à jour réservation:', error);
      throw error;
    }
  },

  /**
   * 🗑️ Annuler une réservation
   * Route: DELETE /bookings/:id
   */
  cancel: async (id: string): Promise<Booking> => {
    try {
      const response = await api.delete<Booking>(`/bookings/${id}`);
      console.log('✅ Réservation annulée:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Erreur annulation réservation:', error);
      throw error;
    }
  },
};
