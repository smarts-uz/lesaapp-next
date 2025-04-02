import { NextRequest, NextResponse } from 'next/server';

const defaultLocale = 'en';
const locales = ['en', 'ru', 'uz'];

// Get the preferred locale from headers
function getLocale(request: NextRequest): string {
  try {
    const acceptLanguage = request.headers.get('accept-language');
    if (!acceptLanguage) return defaultLocale;

    const detectedLocale = acceptLanguage
      .split(',')[0]
      .split('-')[0]
      .toLowerCase();
    
    return locales.includes(detectedLocale) ? detectedLocale : defaultLocale;
  } catch (e) {
    console.error('Error detecting locale:', e);
    return defaultLocale;
  }
}

// Middleware to handle locale detection and redirection
export function middleware(request: NextRequest) {
  try {
    // Get the pathname of the request
    const pathname = request.nextUrl.pathname;

    // Skip public files and API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/)
    ) {
      return NextResponse.next();
    }

    // Handle direct dashboard access - ensure it goes to localized dashboard
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      const locale = getLocale(request);
      
      // Extract any path after '/dashboard'
      const dashboardPath = pathname === '/dashboard' ? '' : pathname.substring('/dashboard'.length);
      
      // Build the localized dashboard URL
      const newUrl = new URL(`/${locale}/dashboard${dashboardPath}`, request.url);
      
      return NextResponse.redirect(newUrl);
    }

    // Check if the pathname already has a locale
    const pathnameHasLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) return NextResponse.next();

    // If no locale is in the pathname, redirect to the default or detected locale
    const locale = getLocale(request);
    
    // Redirect to the same URL but with the detected locale
    return NextResponse.redirect(
      new URL(
        `/${locale}${pathname === '/' ? '' : pathname}`,
        request.url
      )
    );
  } catch (e) {
    console.error('Middleware error:', e);
    return NextResponse.redirect(
      new URL(`/${defaultLocale}`, request.url)
    );
  }
}

// Match all paths except the ones below
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|locales|.*\\.json).*)',
  ],
}; 