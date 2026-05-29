import { api } from "@/services/api";

export interface InvoiceLine {
  bookingId: string;
  code: string | null;
  departure: string;
  destination: string;
  departureAt: string;
  totalPrice: number;
  paymentStatus: string;
}

export interface MonthlyInvoice {
  period: string;   // "YYYY-MM"
  label: string;    // "Janvier 2026"
  count: number;
  total: number;
  paid: number;
  due: number;
  currency: "TND";
  lines: InvoiceLine[];
}

export const invoiceService = {
  /** Factures mensuelles agrégées du client B2B connecté. */
  async monthly(): Promise<MonthlyInvoice[]> {
    return api.get<MonthlyInvoice[]>("/b2b/invoices");
  },
};
