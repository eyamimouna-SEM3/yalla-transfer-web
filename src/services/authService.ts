import { api } from "@/services/api";
import { tokenStorage } from "@/utils/tokenStorage";

export type BackendRole =
  | "client_b2c"
  | "client_b2b"
  | "driver_independent"
  | "driver_employee"
  | "supplier"
  | "admin";

export interface AuthUser {
  id: string;
  fullName?: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: BackendRole;
  avatar_url?: string;
  is_verified?: boolean;
  accountStatus?: string;
  contractStatus?: string;
  account_status?: string;
  contract_status?: string;

  // Particulier
  nationality?: string;
  country?: string;

  // Corporate
  activity_type?: string;
  matricule_fiscal?: string;
  address?: string;
  website?: string;
  responsible_name?: string;
  responsible_email?: string;
  responsible_phone?: string;

  // Transport / Supplier
  is_24_7?: boolean;
  rib?: string;
  operational_zones?: string;
  vehicle_types?: string;

  // Chauffeur
  city?: string;
  permit_number?: string;
  professional_card_number?: string;
  languages?: string;
  experience_years?: string;

  // Vehicle (chauffeur)
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_registration?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  vehicle_capacity?: number;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterData {
  // Basic fields
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: BackendRole;
  countryCode?: string;
  avatarUrl?: string;

  // Particulier (client_b2c)
  nationality?: string;
  country?: string;

  // Corporate (client_b2b)
  activityType?: string;
  matriculeFiscal?: string;
  address?: string;
  website?: string;
  responsibleName?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;

  // Transport / Supplier
  is24_7?: boolean;
  rib?: string;
  operationalZones?: string;
  vehicleTypes?: string;
  commerceRegister?: string;
  patent?: string;
  civilLiabilityInsurance?: string;

  // Chauffeur (driver_independent)
  city?: string;
  permitNumber?: string;
  professionalCardNumber?: string;
  languages?: string;
  experienceYears?: string;
  driverLicenseFront?: string;
  driverLicenseBack?: string;
  vehicleRegistrationFront?: string;
  vehicleRegistrationBack?: string;
  insuranceDocument?: string;
  insuranceNumber?: string;
  insuranceDateObtained?: string;
  insuranceDateExpiration?: string;
  patentDocument?: string;

  // Vehicle
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleRegistration?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  vehicleCapacity?: number;
  vehicleLuggageLarge?: number;
  vehicleLuggageSmall?: number;
  vehiclePhotoFront?: string;
  vehiclePhotoBack?: string;
  vehiclePhotoInterior?: string;
}

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post<AuthResponse>("/auth/login", {
      email: email.trim().toLowerCase(),
      password,
    });
    tokenStorage.setToken(response.access_token);
    tokenStorage.setUser(response.user);
    return response;
  },

  async register(data: RegisterData) {
    // `requireEmailVerification: true` force le backend à vérifier que
    // /auth/verify-email-code a bien été appelé avant register.
    const response = await api.post<AuthResponse>("/auth/register", {
      ...data,
      email: data.email.trim().toLowerCase(),
      requireEmailVerification: true,
    });
    tokenStorage.setToken(response.access_token);
    tokenStorage.setUser(response.user);
    return response;
  },

  async me() {
    try {
      const user = await api.get<AuthUser>("/auth/me");
      tokenStorage.setUser(user);
      return user;
    } catch (error) {
      // If me() fails, return stored user
      const stored = tokenStorage.getUser();
      if (stored) return stored;
      throw error;
    }
  },

  logout() {
    tokenStorage.clear();
  },

  /**
   * Met à jour le profil utilisateur (nom, email, téléphone, adresse).
   * Endpoint : PATCH /auth/me/profile
   */
  async updateProfile(data: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    const user = await api.patch<AuthUser>("/auth/me/profile", data);
    tokenStorage.setUser(user);
    return user;
  },

  /**
   * Met à jour les préférences UI (langue, thème).
   * Endpoint : PATCH /auth/me/preferences
   */
  async updatePreferences(data: { locale?: string; themeMode?: string }) {
    const user = await api.patch<AuthUser>("/auth/me/preferences", data);
    tokenStorage.setUser(user);
    return user;
  },

  /**
   * Change le mot de passe (requiert l'ancien).
   * Endpoint : POST /auth/change-password
   */
  async changePassword(currentPassword: string, newPassword: string) {
    return api.post<{ ok: boolean }>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Envoie un code de vérification à 6 chiffres par email (Nodemailer côté backend).
   * À appeler AVANT register() côté web.
   */
  async sendVerificationCode(email: string) {
    return api.post<{ ok: boolean; expiresInMinutes: number }>(
      "/auth/send-verification-code",
      { email: email.trim().toLowerCase() },
    );
  },

  /**
   * Vérifie le code reçu par email. Renvoie 401 si invalide ou expiré.
   * Après succès, le backend retient l'email comme vérifié pendant 30 min.
   */
  async verifyEmailCode(email: string, code: string) {
    return api.post<{ ok: boolean }>(
      "/auth/verify-email-code",
      { email: email.trim().toLowerCase(), code },
    );
  },

  /**
   * Envoie un email de réinitialisation de mot de passe avec un lien.
   * Renvoie 404 si l'email n'existe pas (ou 200 si on veut masquer — actuellement 404).
   */
  async requestPasswordReset(email: string) {
    return api.post<{ message: string }>(
      "/auth/forgot-password",
      { email: email.trim().toLowerCase() },
    );
  },

  /**
   * Réinitialise le mot de passe avec un token reçu par email.
   * Renvoie 401 si le token est invalide ou expiré, 400 si le mot de passe est trop faible.
   */
  async resetPassword(token: string, password: string) {
    return api.post<{ message: string }>(
      "/auth/reset-password",
      { token, password },
    );
  },
};
