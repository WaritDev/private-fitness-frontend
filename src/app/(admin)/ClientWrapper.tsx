'use client';

import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/ui/AdminNavbar';

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      }
    }
  }, [loading, user, router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Guard>
        <AdminNavbar />
        <main className="site-main">{children}</main>
      </Guard>
    </AuthProvider>
  );
}