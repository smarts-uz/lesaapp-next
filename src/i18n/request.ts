import { getRequestConfig } from 'next-intl/server';
import { locales } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the locale is supported
  if (typeof locale !== 'string' || !locales.includes(locale as any)) {
    return {
      locale: 'en', // Fallback to English
      messages: (await import(`../../messages/en.json`)).default
    };
  }
  
  // Load messages based on the locale
  try {
    return {
      locale,
      messages: (await import(`../../messages/${locale}.json`)).default
    };
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}`, error);
    // Fallback to English
    return {
      locale: 'en',
      messages: (await import(`../../messages/en.json`)).default
    };
  }
}); 