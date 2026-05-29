/**
 * Validateurs centralisés pour tous les formulaires (auth, booking, paiement).
 * Chaque fonction retourne `null` si la valeur est valide, sinon un message d'erreur en français.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
// Téléphone international : optionnel +, 8 à 15 chiffres après préfixe.
const PHONE_REGEX = /^\+?[0-9]{8,15}$/;
// Mot de passe : au moins 8 caractères, au moins 1 chiffre, au moins 1 lettre, au moins 1 caractère spécial.
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*(),.?":{}|<>_\-\\/\[\];+=~`]/;

export const validators = {
  required(value: unknown, label = "Ce champ"): string | null {
    if (value === undefined || value === null) return `${label} est requis.`;
    if (typeof value === "string" && value.trim() === "") return `${label} est requis.`;
    return null;
  },

  email(value: string): string | null {
    const v = (value ?? "").trim();
    if (!v) return "Email requis.";
    if (v.length > 150) return "Email trop long (max 150 caractères).";
    if (!EMAIL_REGEX.test(v)) return "Format d'email invalide (ex : prenom.nom@domaine.com).";
    return null;
  },

  fullName(value: string): string | null {
    const v = (value ?? "").trim();
    if (!v) return "Nom complet requis.";
    if (v.length < 2) return "Nom complet trop court (min 2 caractères).";
    if (v.length > 100) return "Nom complet trop long (max 100 caractères).";
    // Rejet de caractères clairement malveillants — autorise lettres, espaces, tirets, apostrophes, accents.
    if (!/^[a-zA-ZÀ-ÿ' \-]+$/.test(v)) return "Le nom ne doit contenir que des lettres, espaces, tirets ou apostrophes.";
    return null;
  },

  phone(value: string): string | null {
    const v = (value ?? "").trim();
    if (!v) return "Numéro de téléphone requis.";
    const cleaned = v.replace(/\s/g, "");
    if (!PHONE_REGEX.test(cleaned)) return "Numéro invalide (format attendu : +21612345678).";
    return null;
  },

  password(value: string): string | null {
    const v = value ?? "";
    if (!v) return "Mot de passe requis.";
    if (v.length < 8) return "Mot de passe trop court (min 8 caractères).";
    if (v.length > 128) return "Mot de passe trop long (max 128 caractères).";
    if (!/[A-Za-z]/.test(v)) return "Doit contenir au moins une lettre.";
    if (!/[0-9]/.test(v)) return "Doit contenir au moins un chiffre.";
    if (!PASSWORD_SPECIAL_REGEX.test(v)) return "Doit contenir au moins un caractère spécial (ex : !@#$%).";
    return null;
  },

  passwordsMatch(password: string, confirm: string): string | null {
    if (password !== confirm) return "Les mots de passe ne correspondent pas.";
    return null;
  },

  // Carte bancaire — Luhn checksum sur 13-19 chiffres.
  cardNumber(value: string): string | null {
    const digits = (value ?? "").replace(/\D/g, "");
    if (!digits) return "Numéro de carte requis.";
    if (digits.length < 13 || digits.length > 19) return "Numéro de carte invalide (13 à 19 chiffres).";
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits[i], 10);
      if (alt) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      alt = !alt;
    }
    if (sum % 10 !== 0) return "Numéro de carte invalide (checksum Luhn).";
    return null;
  },

  cvv(value: string): string | null {
    const v = (value ?? "").trim();
    if (!v) return "CVV requis.";
    if (!/^[0-9]{3,4}$/.test(v)) return "CVV invalide (3 ou 4 chiffres).";
    return null;
  },

  expiry(value: string, departureDate?: Date | null): string | null {
    const v = (value ?? "").trim();
    if (!v) return "Date d'expiration requise.";
    const m = v.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
    if (!m) return "Format attendu : MM/AA.";
    const month = parseInt(m[1], 10);
    let year = parseInt(m[2], 10);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12) return "Mois invalide (01-12).";
    const expiry = new Date(year, month, 0, 23, 59, 59);
    const now = new Date();
    if (expiry < now) return "Carte expirée.";
    if (departureDate) {
      const minValidThrough = new Date(departureDate);
      minValidThrough.setMonth(minValidThrough.getMonth() + 1);
      if (expiry < minValidThrough) {
        return "La carte doit rester valide au moins 1 mois après la date du trajet.";
      }
    }
    return null;
  },

  amount(value: number, label = "Montant"): string | null {
    if (value === undefined || value === null || Number.isNaN(value)) return `${label} invalide.`;
    if (value <= 0) return `${label} doit être supérieur à 0.`;
    if (value > 1_000_000) return `${label} trop élevé.`;
    return null;
  },

  positiveInt(value: number | string, label = "Valeur"): string | null {
    const n = typeof value === "string" ? parseInt(value, 10) : value;
    if (!Number.isFinite(n) || Number.isNaN(n)) return `${label} invalide.`;
    if (n < 1) return `${label} doit être au moins 1.`;
    if (n > 200) return `${label} trop élevé.`;
    return null;
  },

  futureDate(value: Date | string | null | undefined, label = "Date"): string | null {
    if (!value) return `${label} requise.`;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return `${label} invalide.`;
    const now = new Date();
    if (d.getTime() < now.getTime() - 60 * 60 * 1000) {
      return `${label} doit être dans le futur.`;
    }
    return null;
  },

  // Identifiant fiscal tunisien : 7 chiffres + lettre + 3 caractères (souple)
  taxId(value: string): string | null {
    const v = (value ?? "").trim();
    if (!v) return null; // Optionnel par défaut
    if (v.length < 7 || v.length > 20) return "Matricule fiscal invalide (7 à 20 caractères).";
    if (!/^[A-Za-z0-9\/\-]+$/.test(v)) return "Caractères invalides dans le matricule.";
    return null;
  },

  url(value: string, optional = true): string | null {
    const v = (value ?? "").trim();
    if (!v) return optional ? null : "URL requise.";
    try {
      const u = new URL(v.startsWith("http") ? v : `https://${v}`);
      if (!["http:", "https:"].includes(u.protocol)) return "URL invalide.";
      return null;
    } catch {
      return "URL invalide.";
    }
  },
};

/**
 * Helper : valide un objet de champs et retourne un map d'erreurs par champ.
 * Exemple :
 *   const errors = validateAll({
 *     email: () => validators.email(email),
 *     password: () => validators.password(password),
 *   });
 *   if (Object.keys(errors).length > 0) { ... }
 */
export function validateAll(rules: Record<string, () => string | null>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, check] of Object.entries(rules)) {
    const result = check();
    if (result) errors[field] = result;
  }
  return errors;
}
