import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

export type Locale = "fr" | "en" | "es";

/**
 * Hook qui synchronise la langue de l'app avec la préférence utilisateur.
 *
 * - Au boot : i18next utilise la valeur du localStorage (voir i18n.ts).
 * - Quand l'utilisateur se connecte ou change de préférence, on bascule
 *   automatiquement i18next sur sa langue préférée.
 *
 * Le useLocaleSync est monté une seule fois dans App.tsx (composant invisible).
 * Le useLocale est utilisé partout pour récupérer t() et changer de langue.
 */
export const useLocale = () => {
  const { i18n, t } = useTranslation();
  const locale = i18n.language as Locale;

  const setLocale = (next: Locale) => {
    void i18n.changeLanguage(next);
  };

  return { locale, setLocale, t };
};

/**
 * Composant utilitaire (sans rendu) qui synchronise i18n avec user.locale.
 * À monter une seule fois sous AuthProvider.
 */
export const LocaleSync = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    const userLocale = (user as any)?.locale as string | undefined;
    if (
      userLocale &&
      ["fr", "en", "es"].includes(userLocale) &&
      i18n.language !== userLocale
    ) {
      void i18n.changeLanguage(userLocale);
    }
  }, [user, i18n]);

  return null;
};
