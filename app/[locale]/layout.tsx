import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Navigation from '../../components/Navigation';
import { locales } from '../../src/i18n/routing';
import '../globals.css'

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "LESA POS",
  description: "Point of Sale System",
  generator: 'v0.dev'
}

// Define the locales supported by the application
export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: any;
}) {
  // Access locale from params safely
  const locale = String(params?.locale || 'en');
  
  // Validate locale is supported
  if (!locales.includes(locale as any)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="min-h-screen flex flex-col">
            <header className="p-4 border-b">
              <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-xl font-bold">LESA POS</h1>
                <div className="flex items-center">
                  <Navigation />
                  <div className="ml-6">
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 container mx-auto p-4">
              {children}
            </main>
            <footer className="p-4 border-t">
              <div className="container mx-auto">
                <p className="text-center text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} LESA POS. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
} 