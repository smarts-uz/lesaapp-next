'use client';

import { useTranslations } from 'next-intl';
import { Link } from '../src/i18n/navigation';

export default function Navigation() {
  const t = useTranslations('common');

  return (
    <nav className="flex items-center space-x-6">
      <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
        {t('welcome')}
      </Link>
      <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
        {t('dashboard')}
      </Link>
      <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
        {t('products')}
      </Link>
      <Link href="/customers" className="text-sm font-medium hover:text-primary transition-colors">
        {t('customers')}
      </Link>
      <Link href="/sales" className="text-sm font-medium hover:text-primary transition-colors">
        {t('sales')}
      </Link>
      <Link href="/reports" className="text-sm font-medium hover:text-primary transition-colors">
        {t('reports')}
      </Link>
      <Link href="/settings" className="text-sm font-medium hover:text-primary transition-colors">
        {t('settings')}
      </Link>
    </nav>
  );
} 