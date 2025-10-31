'use client';

import * as React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '@/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InternalNavBar from '@/components/ui/InternalNavbar';
import { SnackProvider } from '@/components/pop-up/AlertPopUpUI'; // ⬅️ เพิ่ม

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackProvider>
        <AuthProvider>
          <Guard>
            <InternalNavBar />
            <main className="site-main">{children}</main>
          </Guard>
        </AuthProvider>
      </SnackProvider>
    </ThemeProvider>
  );
}