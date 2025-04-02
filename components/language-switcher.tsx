"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useParams, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import ReactCountryFlag from "react-country-flag";
import { languages, getLocalizedPath } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const [selectedLang, setSelectedLang] = useState("en");
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const pathname = usePathname();
  const { i18n } = useTranslation();

  // Initialize language from params - handle params safely
  useEffect(() => {
    if (params && typeof params.locale === 'string') {
      const locale = params.locale;
      if (languages.some(l => l.code === locale)) {
        setSelectedLang(locale);
      }
    }
  }, [params]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    setSelectedLang(langCode);
    i18n.changeLanguage(langCode);
    
    // Navigate to the selected language page - properly construct the URL
    let newPath = pathname || '';
    const currentLocale = (params && typeof params.locale === 'string') 
      ? params.locale 
      : 'en';
      
    // Replace the current locale with the new one
    if (newPath.startsWith(`/${currentLocale}/`)) {
      newPath = newPath.replace(`/${currentLocale}/`, `/${langCode}/`);
    } else if (newPath === `/${currentLocale}`) {
      newPath = `/${langCode}`;
    } else {
      // Fallback for unexpected cases
      newPath = `/${langCode}`;
    }
    
    window.location.href = newPath;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <div className="flex items-center gap-2">
            <ReactCountryFlag
              countryCode={
                languages.find((lang) => lang.code === selectedLang)
                  ?.countryCode || "GB"
              }
              svg
              style={{
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "0.375rem",
              }}
            />
            <span className="text-sm font-medium">
              {selectedLang.toUpperCase()}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={selectedLang === lang.code ? "bg-muted" : ""}
          >
            <div className="mr-2">
              <ReactCountryFlag
                countryCode={lang.countryCode}
                svg
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "0.375rem",
                }}
              />
            </div>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 