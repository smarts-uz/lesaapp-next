import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'es', 'fr'] as const;
export type Locale = typeof locales[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  // If you want to use domain-based routing, uncomment this:
  // domains: [
  //   {
  //     domain: 'example.com',
  //     defaultLocale: 'en'
  //   },
  //   {
  //     domain: 'example.es',
  //     defaultLocale: 'es'
  //   },
  //   {
  //     domain: 'example.fr',
  //     defaultLocale: 'fr'
  //   }
  // ]
}); 