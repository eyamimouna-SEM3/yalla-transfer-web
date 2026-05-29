import { api } from "@/services/api";

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  channel: string;
  read: boolean;
  createdAt: string;
  bookingId?: string | null;
  /** Champs enrichis ajoutés côté backend (booking, code…) */
  bookingCode?: string;
  departure?: string;
  destination?: string;
}

export const notificationService = {
  /** Récupère les notifications de l'utilisateur connecté (enrichies). */
  async listMine(): Promise<UserNotification[]> {
    return api.get<UserNotification[]>("/notifications");
  },

  /** Marque les notifications passées comme lues (ou toutes si ids omis). */
  async markRead(ids?: string[]): Promise<{ updated: number }> {
    return api.post<{ updated: number }>("/notifications/mark-read", ids ? { ids } : {});
  },
};
