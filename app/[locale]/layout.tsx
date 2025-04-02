import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import I18nProvider from "@/components/i18n-provider"

// Generate metadata with properly awaited params
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> | { locale: string } }
): Promise<Metadata> {
  // Await the params object if it's a promise
  const resolvedParams = 'then' in params ? await params : params;
  const locale = resolvedParams?.locale || 'en';
  
  return {
    title: `OpenPOS | Modern Point of Sale System`,
    description: "A modern Point of Sale system for WooCommerce",
    generator: 'v0.dev'
  }
}

// Make the layout an async function to properly await params
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  // Await the params object if it's a promise
  const resolvedParams = 'then' in params ? await params : params;
  const locale = resolvedParams?.locale || 'en';
  
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider locale={locale}>
        {children}
      </I18nProvider>
    </ThemeProvider>
  )
} 