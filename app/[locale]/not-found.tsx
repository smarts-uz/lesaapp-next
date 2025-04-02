'use client';

import { useTranslations } from 'next-intl';
import { Link } from '../../src/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-240px)]">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-lg mb-8">The page you are looking for doesn't exist or has been moved.</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        {t('welcome')}
      </Link>
    </div>
  );
} 