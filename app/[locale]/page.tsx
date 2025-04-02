'use client';

import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the POS page
  redirect('/pos');
  
  // This code will not be executed due to the redirect
  return null;
} 