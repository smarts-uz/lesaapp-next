import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;

// Define available languages for the app
export const languages = [
  { code: "en", name: "English", countryCode: "GB" },
  { code: "ru", name: "Русский", countryCode: "RU" },
  { code: "uz", name: "O'zbek", countryCode: "UZ" },
];

// Helper function to generate route paths with locale
export function getLocalizedPath(path, locale) {
  return `/${locale}${path === '/' ? '' : path}`;
} 