import { redirect } from 'next/navigation';

// Simple dashboard redirect page - the middleware should handle most redirects,
// but this is a fallback to ensure any direct access to /dashboard gets redirected
export default function DashboardPage() {
  // Redirect to the default locale dashboard
  redirect('/en/dashboard');
} 