'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextValue, AuthUser, UserRole } from '../types/users';

// Backend API Base URL
const API_BASE_URL = 'http://localhost:8000';

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
        // เรียก Golang Backend API แทน Next.js API
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { 
          credentials: 'include', // ส่ง cookie pf_auth ไปด้วย
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          
          // รองรับ response structure จาก Golang
          if (alive && data?.result?.authenticated && data?.result?.user) {
            const backendUser = data.result.user;
            
            // แปลง field names จาก backend → AuthUser type
            const authUser: AuthUser = {
              sub: backendUser.sub || backendUser.username,
              role: backendUser.role as UserRole,
              firstName: backendUser.firstName || backendUser.first_name,
              lastName: backendUser.lastName || backendUser.last_name,
              email: backendUser.email || backendUser.gmail,
            };
            
            setUser(authUser);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
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