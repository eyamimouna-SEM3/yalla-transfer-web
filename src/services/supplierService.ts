import { api } from "@/services/api";
import type { Booking } from "@/services/bookingService";

export interface SupplierDashboardStats {
  todayBookings?: number;
  pendingBookings?: number;
  confirmedBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  todayRevenue?: number;
  monthRevenue?: number;
  totalRevenue?: number;
  fleetAvailable?: number;
  fleetOnMission?: number;
  fleetMaintenance?: number;
  driversOnline?: number;
  averageRating?: number;
  totalReviews?: number;
  [key: string]: unknown;
}

export interface SupplierClientSummary {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  bookingsCount?: number;
}

export interface SupplierFleetDriver {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  driverValidated?: boolean;
  driverOnline?: boolean;
  vehicleType?: string;
  licenseNumber?: string;
  accountStatus?: string;
  contractStatus?: string;
  role?: string;
  createdAt?: string;
  generatedPassword?: string;
}

export const supplierService = {
  /** KPI globaux du fournisseur (revenus, courses, flotte, notes). */
  async dashboard(): Promise<SupplierDashboardStats> {
    return api.get<SupplierDashboardStats>("/supplier/dashboard");
  },

  /** Réservations non encore assignées à un chauffeur — marketplace fournisseur. */
  async unassignedBookings(): Promise<Booking[]> {
    return api.get<Booking[]>("/supplier/bookings/unassigned");
  },

  /** Réservations récentes gérées par le fournisseur (assignées à sa flotte). */
  async recentBookings(): Promise<Booking[]> {
    return api.get<Booking[]>("/supplier/bookings/recent");
  },

  /** Liste des clients du fournisseur. */
  async clients(): Promise<SupplierClientSummary[]> {
    return api.get<SupplierClientSummary[]>("/supplier/clients");
  },

  /** Chauffeurs employés/affiliés à ce fournisseur. */
  async fleetDrivers(): Promise<SupplierFleetDriver[]> {
    return api.get<SupplierFleetDriver[]>("/supplier/fleet/drivers");
  },

  /** Assigne un chauffeur à une réservation. */
  async assignDriver(bookingId: string, driverId: string) {
    return api.post<{ bookingId: string; assignedDriverId: string; status: string }>(
      `/supplier/bookings/${bookingId}/assign-driver`,
      { driverId },
    );
  },

  // ============== FLOTTE VÉHICULES ==============

  async listVehicles(): Promise<SupplierVehicle[]> {
    return api.get<SupplierVehicle[]>("/supplier/vehicles");
  },

  async createVehicle(payload: VehicleInput): Promise<SupplierVehicle> {
    return api.post<SupplierVehicle>("/supplier/vehicles", payload);
  },

  async updateVehicle(id: string, payload: Partial<VehicleInput>): Promise<SupplierVehicle> {
    return api.patch<SupplierVehicle>(`/supplier/vehicles/${id}`, payload);
  },

  async deleteVehicle(id: string): Promise<{ ok: boolean }> {
    return api.delete<{ ok: boolean }>(`/supplier/vehicles/${id}`);
  },

  // ============== FLOTTE CHAUFFEURS ==============

  async createDriver(payload: DriverInput): Promise<SupplierFleetDriver & { generatedPassword?: string }> {
    return api.post<SupplierFleetDriver & { generatedPassword?: string }>("/supplier/drivers", payload);
  },

  async updateDriver(id: string, payload: Partial<DriverInput>): Promise<SupplierFleetDriver> {
    return api.patch<SupplierFleetDriver>(`/supplier/drivers/${id}`, payload);
  },

  async removeDriver(id: string): Promise<{ ok: boolean }> {
    return api.delete<{ ok: boolean }>(`/supplier/drivers/${id}`);
  },
};

export interface SupplierVehicle {
  id: string;
  supplierId: string;
  brand: string;
  model: string;
  plate: string;
  category: string;
  capacity: number;
  luggage: number;
  basePrice: number | null;
  status: "available" | "on_mission" | "maintenance" | "inactive" | string;
  assignedDriverId: string | null;
  photoUrl: string | null;
  insuranceNumber: string | null;
  insuranceExpiry: string | null;
  createdAt: string;
}

export interface VehicleInput {
  brand: string;
  model: string;
  plate: string;
  category?: string;
  capacity?: number;
  luggage?: number;
  basePrice?: number | null;
  status?: string;
  assignedDriverId?: string | null;
  photoUrl?: string | null;
  insuranceNumber?: string | null;
  insuranceExpiry?: string | null;
}

export interface DriverInput {
  fullName: string;
  phone: string;
  email?: string;
  password?: string;
  licenseNumber?: string;
  vehicleType?: string;
}
