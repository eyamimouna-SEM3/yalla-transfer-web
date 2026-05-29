import type { CreateBookingInput } from "@/services/bookingService";

const KEY = "yalla_pending_booking";

export const pendingBookingStorage = {
  save(payload: CreateBookingInput) {
    try {
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      /* quota plein ou storage indisponible — on ignore */
    }
  },

  load(): CreateBookingInput | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as CreateBookingInput;
    } catch {
      localStorage.removeItem(KEY);
      return null;
    }
  },

  clear() {
    localStorage.removeItem(KEY);
  },
};
