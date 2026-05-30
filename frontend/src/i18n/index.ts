import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import ukCommon from "./locales/uk/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    defaultNS: "common",
    resources: {
      en: { common: enCommon },
      uk: { common: ukCommon },
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "uav_language",
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
