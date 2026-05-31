import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

/**
 * Configuration centrale i18next.
 *
 * - 3 langues : fr (par défaut), en, es
 * - Détection initiale via localStorage (clé "yalla.locale")
 * - Le hook useLocale (voir hooks/useLocale.tsx) synchronise la langue
 *   avec user.locale dès que l'utilisateur est connecté.
 *
 * Pour ajouter une langue : créer le JSON dans locales/, l'importer
 * et l'enregistrer dans resources ci-dessous.
 */

const LS_KEY = "yalla.locale";

const detectInitialLocale = (): string => {
  if (typeof window === "undefined") return "fr";
  const saved = localStorage.getItem(LS_KEY);
  if (saved && ["fr", "en", "es"].includes(saved)) return saved;
  // Fallback : langue du navigateur si supportée
  const browser = navigator.language?.slice(0, 2);
  if (["fr", "en", "es"].includes(browser)) return browser;
  return "fr";
};

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es },
    },
    lng: detectInitialLocale(),
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false, // React échappe déjà
    },
    returnNull: false,
  });

// Persiste à chaque changement de langue
i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_KEY, lng);
    // Met aussi à jour l'attribut lang du HTML (accessibilité + SEO)
    document.documentElement.lang = lng;
  }
});

// Synchronise lang du HTML au boot
if (typeof window !== "undefined") {
  document.documentElement.lang = i18n.language;
}

export default i18n;
