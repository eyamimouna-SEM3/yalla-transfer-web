import { api } from "@/services/api";

export interface BookingOffer {
  id: string;
  bookingId: string;
  supplierId: string;
  driverId: string | null;
  vehicleId: string | null;
  price: number;
  notes: string | null;
  status: "pending" | "accepted" | "rejected" | "expired" | "withdrawn";
  expiresAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export const offersService = {
  /** Supplier crée une offre sur une réservation pending. */
  async create(payload: {
    bookingId: string;
    price: number;
    driverId?: string;
    vehicleId?: string;
    notes?: string;
    expiresAt?: string;
  }): Promise<BookingOffer> {
    return api.post<BookingOffer>("/booking-offers", payload);
  },

  /** Offres faites par le supplier connecté. */
  async myOffers(): Promise<BookingOffer[]> {
    return api.get<BookingOffer[]>("/booking-offers/my-offers");
  },

  /** Liste les offres reçues sur une de ses réservations (client only). */
  async byBooking(bookingId: string): Promise<BookingOffer[]> {
    return api.get<BookingOffer[]>(`/booking-offers/booking/${bookingId}`);
  },

  /** Client accepte une offre. */
  async accept(offerId: string): Promise<BookingOffer> {
    return api.post<BookingOffer>(`/booking-offers/${offerId}/accept`, {});
  },

  /** Supplier retire son offre. */
  async withdraw(offerId: string): Promise<BookingOffer> {
    return api.post<BookingOffer>(`/booking-offers/${offerId}/withdraw`, {});
  },
};
