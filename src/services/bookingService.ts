import { api } from "@/services/api";

/**
 * Booking shape returned by the unified NestJS backend (camelCase).
 * 7 statuts : pending, confirmed, assigned, driver_en_route, arrived, in_progress, completed, cancelled
 */
export interface Booking {
  id: string;
  code: string;
  status:
    | "pending"
    | "confirmed"
    | "assigned"
    | "driver_en_route"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled";
  departure: string;
  destination: string;
  departureAt: string;
  returnAt?: string | null;
  roundTrip?: boolean;
  passengers: number;
  largeLuggage?: number;
  smallLuggage?: number;
  babySeat?: boolean;
  pmr?: boolean;
  totalPrice: number;
  vehiclesTotal?: number;
  optionsTotal?: number;
  clientId: string;
  assignedDriverId?: string | null;
  handledBySupplierId?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  passengerName?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  vehicles?: Array<{
    vehicleId: string;
    quantity: number;
    unitPrice: number;
    vehicle?: { id: string; type: string; category: string };
  }>;
  payment?: {
    id: string;
    amount: number;
    method: string;
    status: string;
    voucherCode?: string;
    voucherUrl?: string;
  };
}

export interface CreateBookingInput {
  departure: string;
  destination: string;
  departureAt: string;
  returnAt?: string | null;
  roundTrip?: boolean;
  passengers?: number;
  largeLuggage?: number;
  smallLuggage?: number;
  babySeat?: boolean;
  pmr?: boolean;
  vehicles: Array<{ id: string; quantity?: number }>;
  selectedOptions?: unknown[];
  paymentMethod?: "wallet" | "tn-card" | "card" | "edinar" | "cash";
  passengerName?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  notes?: string;
}

export const bookingService = {
  async getAll(): Promise<Booking[]> {
    return api.get<Booking[]>("/bookings");
  },

  async getActive(): Promise<Booking | null> {
    return api.get<Booking | null>("/bookings/active");
  },

  async getTracking(id: string) {
    return api.get<{
      lat: number;
      lng: number;
      progress: number;
      status: string;
    } | null>(`/bookings/${id}/tracking`);
  },

  async create(data: CreateBookingInput): Promise<Booking> {
    return api.post<Booking>("/bookings", data);
  },

  async submitClientRating(
    id: string,
    body: { stars: number; comment?: string },
  ) {
    return api.post<{ id: string }>(`/bookings/${id}/client-rating`, body);
  },

  /**
   * Récupère le voucher PDF authentifié et déclenche le téléchargement.
   * Utilise GET /api/bookings/:id/voucher qui renvoie application/pdf.
   */
  async downloadVoucher(bookingId: string): Promise<void> {
    const { tokenStorage } = await import("@/utils/tokenStorage");
    const apiBase =
      (import.meta.env.VITE_API_URL as string | undefined) ||
      "http://localhost:3000/api";
    const token = tokenStorage.getToken();
    const res = await fetch(`${apiBase}/bookings/${bookingId}/voucher`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Téléchargement impossible (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voucher-${bookingId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /**
   * Renvoie l'URL publique partageable du voucher (sans auth).
   */
  async publicVoucherUrl(bookingId: string): Promise<string> {
    const res = await api.get<{ url: string }>(`/bookings/${bookingId}/voucher/public`);
    return res.url;
  },
};
