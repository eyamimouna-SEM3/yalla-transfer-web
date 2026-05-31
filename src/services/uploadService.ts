/**
 * Service d'upload de documents KYC pendant l'inscription.
 *
 * Endpoint backend : POST /api/uploads/user-document
 * - Public (pas de JWT requis : l'utilisateur n'a pas encore de compte)
 * - Accepte jpg / png / webp / heic / pdf, 8 Mo max
 * - Retourne `{ url }` à stocker dans le payload register
 */
export interface UploadResult {
  uploaded: boolean;
  url: string;
  originalName: string;
  sizeBytes: number;
}

export const uploadService = {
  /**
   * Téléverse un fichier sélectionné par l'utilisateur et retourne l'URL
   * relative qui sera persistée dans la base lors de l'inscription.
   */
  async uploadUserDocument(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/uploads/user-document", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let message = `Échec d'upload (HTTP ${res.status})`;
      try {
        const parsed = JSON.parse(errText);
        message = parsed.message || message;
      } catch {
        if (errText) message = errText;
      }
      throw new Error(message);
    }
    return res.json();
  },
};
