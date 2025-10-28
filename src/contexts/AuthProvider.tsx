'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextValue, AuthUser, UserRole } from '../types/users';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAdmin: false,
  isManager: false,
  isTrainer: false,
  isSales: false,
  isCustomer: false,
  hasAnyRole: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (alive && data?.authenticated && data?.user?.role) {
            setUser(data.user as AuthUser);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isTrainer = user?.role === 'TRAINER';
  const isSales = user?.role === 'SALES';
  const isCustomer = user?.role === 'CUSTOMER';
  const hasAnyRole = (...roles: UserRole[]) => !!user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin, 
      isManager, 
      isTrainer, 
      isSales, 
      isCustomer, 
      hasAnyRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}