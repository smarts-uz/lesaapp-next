"use client";

import { useState, useEffect } from "react";
import i18n, { languages } from "@/lib/i18n";
import { I18nextProvider } from "react-i18next";
import { usePathname } from "next/navigation";

// I18nProvider accepts locale from server component and handles client-side initialization
export default function I18nProvider({ children, locale = "en" }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  // Set up i18n with the locale passed from the server component
  useEffect(() => {
    if (locale && languages.some(lang => lang.code === locale)) {
      i18n.changeLanguage(locale);
    }
    setMounted(true);
  }, [locale, pathname]);

  // Wait for mounting to avoid hydration issues
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
} 