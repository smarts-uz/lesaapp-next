import { createTranslator } from 'next-intl';

// Define the message structure to match our JSON files
export type Messages = {
  common: {
    welcome: string;
    login: string;
    logout: string;
    dashboard: string;
    products: string;
    customers: string;
    sales: string;
    reports: string;
    settings: string;
  };
  auth: {
    email: string;
    password: string;
    forgotPassword: string;
    signIn: string;
    signUp: string;
  };
  dashboard: {
    title: string;
    todaySales: string;
    totalSales: string;
    totalCustomers: string;
    totalProducts: string;
  };
};

// Define valid namespaces
export type Namespace = keyof Messages;

export async function getTranslations(locale: string, namespace?: Namespace) {
  try {
    const messages = (await import(`../messages/${locale}.json`)).default as Messages;
    
    // If a specific namespace is requested, return the translator for that namespace
    if (namespace) {
      return createTranslator({ locale, messages, namespace });
    }
    
    // Otherwise return the full messages object
    return messages;
  } catch (error) {
    console.error(`Failed to load translations for locale ${locale}:`, error);
    // Fallback to English if the requested locale fails to load
    const fallbackMessages = (await import('../messages/en.json')).default as Messages;
    return namespace 
      ? createTranslator({ locale: 'en', messages: fallbackMessages, namespace })
      : fallbackMessages;
  }
} 