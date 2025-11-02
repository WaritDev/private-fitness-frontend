'use client';

import * as React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '@/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import InternalNavBar from '@/components/ui/InternalNavbar';
import { AlertPopUpUI } from '@/components/pop-up/AlertPopUpUI'; // ⬅️ เพิ่ม
import { defaultPathForRole } from '@/lib/roleRedirect';

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Check if user can access the current path based on their role
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Role-based route protection
  useEffect(() => {
    if (!loading && user && pathname) {
      const userRole = user.role;
      const path = pathname;

      // Define allowed paths for each role
      const allowedPaths: Record<string, string[]> = {
        ADMIN: ['/admin', '/profile'],
        MANAGER: ['/manager', '/profile'],
        TRAINER: ['/trainer', '/profile'],
        SALES: ['/sales', '/profile'],
        CUSTOMER: ['/customer', '/profile'],
      };

      // Check if current path is allowed for user's role
      const userAllowedPaths = allowedPaths[userRole] || [];
      const isAllowed = userAllowedPaths.some(allowedPath => path.startsWith(allowedPath));

      if (!isAllowed) {
        // Redirect to default path for user's role
        const defaultPath = defaultPathForRole(userRole);
        router.replace(defaultPath);
      }
    }
  }, [loading, user, pathname, router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AlertPopUpUI>
        <AuthProvider>
          <Guard>
            <InternalNavBar />
            <main className="site-main">{children}</main>
          </Guard>
        </AuthProvider>
      </AlertPopUpUI>
    </ThemeProvider>
  );
}