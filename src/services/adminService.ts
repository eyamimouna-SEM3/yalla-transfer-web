import { api } from "@/services/api";
import type { Booking } from "@/services/bookingService";
import type { Payment } from "@/services/paymentService";

export interface AdminStats {
  users: { total: number; drivers: number; suppliers: number };
  bookings: { total: number; pending: number; completed: number };
  revenue: { totalPaid: number; currency: string };
  claims: { open: number };
}

export interface AdminUser {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  role: string;
  accountType?: string;
  companyName?: string;
  accountStatus?: string;
  contractStatus?: string;
  driverValidated?: boolean;
  driverOnline?: boolean;
  createdAt: string;
}

export interface AdminBooking extends Booking {
  client?: { id: string; fullName: string; email?: string; phone?: string };
  assignedDriver?: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
  };
  handledBySupplier?: { id: string; fullName: string; companyName?: string };
}

export interface AdminPayment extends Payment {
  booking?: {
    id: string;
    code: string;
    departure: string;
    destination: string;
    clientId: string;
  };
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    return api.get<AdminStats>("/admin/stats");
  },

  async getUsers(filters?: { role?: string; status?: string }): Promise<AdminUser[]> {
    return api.get<AdminUser[]>("/admin/users", { params: filters });
  },

  async updateUser(
    id: string,
    data: {
      role?: string;
      accountStatus?: string;
      contractStatus?: string;
      driverValidated?: boolean;
    },
  ): Promise<AdminUser> {
    return api.patch<AdminUser>(`/admin/users/${id}`, data);
  },

  async getBookings(status?: string): Promise<AdminBooking[]> {
    return api.get<AdminBooking[]>("/admin/bookings", { params: { status } });
  },

  async updateBooking(
    id: string,
    data: {
      status?: string;
      handledBySupplierId?: string | null;
      assignedDriverId?: string | null;
      notes?: string;
    },
  ): Promise<AdminBooking> {
    return api.patch<AdminBooking>(`/admin/bookings/${id}`, data);
  },

  async getPayments(status?: string): Promise<AdminPayment[]> {
    return api.get<AdminPayment[]>("/admin/payments", { params: { status } });
  },

  async updatePayment(
    id: string,
    data: { status?: string; transactionRef?: string; paidAt?: string | null },
  ): Promise<AdminPayment> {
    return api.patch<AdminPayment>(`/admin/payments/${id}`, data);
  },

  async getNotifications(type?: string): Promise<AdminNotification[]> {
    return api.get<AdminNotification[]>("/admin/notifications", { params: type ? { type } : undefined });
  },

  async broadcastNotification(payload: {
    title: string;
    body: string;
    type?: string;
    channel?: string;
    targetRole?: string;
    targetUserId?: string;
  }): Promise<{ count: number; message: string }> {
    return api.post<{ count: number; message: string }>("/admin/notifications/broadcast", payload);
  },

  async getBookingOffers(): Promise<AdminBookingOffer[]> {
    return api.get<AdminBookingOffer[]>("/admin/booking-offers");
  },
};

export interface AdminBookingOffer {
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
  booking: {
    id: string;
    code: string;
    departure: string;
    destination: string;
    departureAt: string;
    passengers: number;
    status: string;
    clientId: string;
    client?: { id: string; fullName: string; email?: string };
  };
  supplier: { id: string; fullName: string; companyName?: string };
  driver?: { id: string; fullName: string } | null;
  vehicle?: { id: string; type: string; category: string } | null;
}

export interface AdminNotification {
  id: string;
  userId: string | null;
  bookingId: string | null;
  title: string;
  body: string;
  type: string;
  channel: string;
  read: boolean;
  createdAt: string;
  user?: { id: string; fullName: string; email?: string; role: string };
}
