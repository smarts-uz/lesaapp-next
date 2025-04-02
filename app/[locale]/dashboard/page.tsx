'use client';

import { useTranslations } from 'next-intl';
import { Link } from '../../../src/i18n/navigation';

export default function Dashboard() {
  const t = useTranslations();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <Link 
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {t('common.welcome')}
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title={t('dashboard.todaySales')} value="$1,234.56" />
        <DashboardCard title={t('dashboard.totalSales')} value="$98,765.43" />
        <DashboardCard title={t('dashboard.totalCustomers')} value="1,234" />
        <DashboardCard title={t('dashboard.totalProducts')} value="567" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t('common.sales')}</h2>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            Sales Chart Placeholder
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{t('common.products')}</h2>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            Products Chart Placeholder
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
} 