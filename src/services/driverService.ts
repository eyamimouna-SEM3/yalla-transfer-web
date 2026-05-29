import { api } from "@/services/api";
import type { Booking } from "@/services/bookingService";

export const driverService = {
  /**
   * Renvoie la prochaine course disponible pour ce chauffeur, ou null s'il n'y en a pas.
   * Le backend filtre déjà selon les statuts compatible chauffeur.
   */
  async nextBooking(): Promise<Booking | null> {
    return api.get<Booking | null>("/driver/next-booking");
  },

  /**
   * Le chauffeur accepte la course passée en paramètre (ou la prochaine si bookingId omis).
   */
  async acceptBooking(bookingId?: string) {
    return api.post<Booking | null>(
      "/driver/accept-booking",
      bookingId ? { bookingId } : {},
    );
  },

  /**
   * Le chauffeur refuse une course (elle reste dans le pool, lui ne la verra plus en priorité).
   */
  async passBooking(bookingId: string) {
    return api.post<{ ok: boolean }>("/driver/pass-booking", { bookingId });
  },

  /**
   * Bascule le statut en ligne / hors ligne.
   */
  async setOnline(online: boolean) {
    return api.patch<{ id: string; driverOnline: boolean }>("/driver/online", { online });
  },

  /**
   * Met à jour la position GPS du chauffeur (lat/lng + progress 0..1).
   */
  async updateLocation(body: { lat: number; lng: number; progress?: number; status?: string }) {
    return api.patch<unknown>("/driver/location", body);
  },
};
