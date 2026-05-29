import { api } from "@/services/api";

export interface Rating {
  id: string;
  bookingId: string;
  ratedById: string;
  ratedDriverId?: string | null;
  ratedSupplierId?: string | null;
  scorePunctuality?: number | null;
  scoreVehicle?: number | null;
  scoreProfessionalism?: number | null;
  globalScore?: number | null;
  comment?: string | null;
  createdAt: string;
}

export interface RatingAggregate {
  count: number;
  averageGlobal: number | null;
  items: Rating[];
}

export const ratingService = {
  /** Toutes les notes reçues par un chauffeur (avec moyenne). */
  async forDriver(driverUserId: string): Promise<RatingAggregate> {
    return api.get<RatingAggregate>(`/ratings/driver/${driverUserId}`);
  },

  /** Toutes les notes reçues par un fournisseur (avec moyenne). */
  async forSupplier(supplierUserId: string): Promise<RatingAggregate> {
    return api.get<RatingAggregate>(`/ratings/supplier/${supplierUserId}`);
  },

  /** Notes liées à une réservation précise (pour les afficher au client). */
  async forBooking(bookingId: string): Promise<Rating[]> {
    return api.get<Rating[]>(`/ratings/booking/${bookingId}`);
  },
};
