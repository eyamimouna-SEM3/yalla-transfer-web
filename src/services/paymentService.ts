import { api } from "@/services/api";

export type PaymentMethod = "wallet" | "tn-card" | "card" | "edinar" | "cash";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod | string;
  status: PaymentStatus | string;
  paymentTiming?: "immediate" | "on_arrival" | "deferred";
  transactionRef?: string;
  voucherCode?: string;
  voucherUrl?: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentMethodInfo {
  id: PaymentMethod;
  label: string;
  description?: string;
  available: boolean;
}

export const paymentService = {
  async methods(): Promise<PaymentMethodInfo[]> {
    return api.get<PaymentMethodInfo[]>("/payments/methods");
  },

  /**
   * Envoie un code de vérification à 6 chiffres par email (Nodemailer côté backend).
   * Accessible sans authentification — utilisable en parcours guest.
   */
  async sendCode(body: { email: string }) {
    return api.post<{ ok: boolean; expiresInMinutes: number }>("/payments/send-code", body);
  },

  /**
   * Vérifie le code reçu par email. Renvoie 401 si invalide ou expiré.
   */
  async verifyCode(body: { email: string; code: string }) {
    return api.post<{ ok: boolean }>("/payments/verify-code", body);
  },
};
