'use client';

import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-240px)]">
      <h1 className="text-4xl font-bold mb-6">{t('common.welcome')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <StatCard title={t('dashboard.todaySales')} value="$1,234.56" />
        <StatCard title={t('dashboard.totalSales')} value="$98,765.43" />
        <StatCard title={t('dashboard.totalCustomers')} value="1,234" />
        <StatCard title={t('dashboard.totalProducts')} value="567" />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
} 