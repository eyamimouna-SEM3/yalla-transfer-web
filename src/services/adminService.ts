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

export interface AdminUserDetails extends AdminUser {
  isVerified?: boolean;
  avatarUrl?: string | null;
  avatarId?: string | null;
  clientKind?: string | null;
  locale?: string | null;
  themeMode?: string | null;
  googleId?: string | null;
  appleId?: string | null;
  updatedAt?: string;

  // Particulier
  nationality?: string | null;
  country?: string | null;

  // Corporate / B2B
  taxId?: string | null;
  matriculeFiscal?: string | null;
  activityType?: string | null;
  address?: string | null;
  website?: string | null;
  responsibleName?: string | null;
  responsibleEmail?: string | null;
  responsiblePhone?: string | null;

  // Supplier
  fleetSize?: number | null;
  is247?: boolean | null;
  rib?: string | null;
  operationalZones?: string[] | null;
  vehicleTypes?: string[] | null;
  commerceRegister?: string | null;
  patent?: string | null;
  civilLiabilityInsurance?: string | null;

  // Driver
  employerSupplier?: {
    id: string;
    fullName: string;
    companyName?: string | null;
  } | null;
  licenseNumber?: string | null;
  permitNumber?: string | null;
  professionalCardNumber?: string | null;
  city?: string | null;
  languages?: string[] | null;
  experienceYears?: string | null;

  // KYC docs
  driverLicenseFront?: string | null;
  driverLicenseBack?: string | null;
  vehicleRegistrationFront?: string | null;
  vehicleRegistrationBack?: string | null;
  insuranceDocument?: string | null;
  insuranceNumber?: string | null;
  insuranceDateObtained?: string | null;
  insuranceDateExpiration?: string | null;
  patentDocument?: string | null;

  // Véhicule
  vehicleType?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleRegistration?: string | null;
  vehicleYear?: number | null;
  vehicleColor?: string | null;
  vehicleCapacity?: number | null;
  vehicleLuggageLarge?: number | null;
  vehicleLuggageSmall?: number | null;
  vehiclePhotoFront?: string | null;
  vehiclePhotoBack?: string | null;
  vehiclePhotoInterior?: string | null;

  // Stats
  stats?: {
    client?: {
      bookingsTotal: number;
      bookingsByStatus: Record<string, number>;
      totalSpent: number;
      lastBooking?: {
        id: string;
        code: string;
        departure: string;
        destination: string;
        departureAt: string;
        status: string;
        totalPrice: number;
      } | null;
    } | null;
    driver?: {
      tripsTotal: number;
      tripsCompleted: number;
      averageRating: number | null;
      ratingsCount: number;
      lastTrip?: {
        id: string;
        code: string;
        departure: string;
        destination: string;
        departureAt: string;
        status: string;
      } | null;
    } | null;
    supplier?: {
      vehiclesCount: number;
      driversCount: number;
      handledBookings: number;
      completedBookings: number;
      offersTotal: number;
      offersAccepted: number;
      averageRating: number | null;
      ratingsCount: number;
    } | null;
  };
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

  async getUserDetails(id: string): Promise<AdminUserDetails> {
    return api.get<AdminUserDetails>(`/admin/users/${id}`);
  },

  /**
   * Télécharge l'archive ZIP contenant tous les documents KYC de l'utilisateur
   * (permis, carte grise, assurance, patente, photos véhicule…) + un fichier
   * index.txt récapitulatif. Le navigateur enregistre directement le ZIP via
   * un lien temporaire object URL.
   */
  async downloadUserDocuments(id: string, suggestedName?: string): Promise<void> {
    const token =
      sessionStorage.getItem("yalla_transfer_token") ??
      localStorage.getItem("yalla_transfer_token") ??
      "";
    const res = await fetch(`/api/admin/users/${id}/documents.zip`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName ?? `documents_${id.slice(0, 8)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

  async deleteUser(id: string): Promise<{ id: string; deleted: true }> {
    return api.delete<{ id: string; deleted: true }>(`/admin/users/${id}`);
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

  async getSettings(): Promise<AdminSetting[]> {
    return api.get<AdminSetting[]>("/admin/settings");
  },

  async updateSettings(
    payload: Record<string, string | number | boolean>,
  ): Promise<{ updated: string[]; count: number }> {
    return api.patch<{ updated: string[]; count: number }>("/admin/settings", payload);
  },
};

export interface AdminSetting {
  key: string;
  category: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  options?: string[] | null;
  value: string | number | boolean;
  updatedAt: string;
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
