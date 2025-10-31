'use client';

import * as React from 'react';
import { Container, Stack, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/contexts/AuthProvider';
import MembershipHeader from '@/components/customer/member/MembershipHeader';
import MembershipContainer from '@/components/customer/member/MembershipContainer';
import type { DurationMembership, SessionMembership } from '@/types/membership';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// API Response Types
type ActiveDurationResponse = {
  status: string;
  status_code: number;
  message: string;
  result: Array<{
    id: number;
    customerUsername: string;
    productId: number;
    productName: string;
    durationDays: number;
    salesUsername: string;
    purchaseDate: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    pricePaid: number;
    discountAmount: number;
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
  }>;
};

type ActiveSessionResponse = {
  status: string;
  status_code: number;
  message: string;
  result: Array<{
    id: number;
    customerUsername: string;
    trainerUsername: string;
    productId: number;
    productName: string;
    totalSessions: number;
    usedSessions: number;
    sessionsRemaining: number;
    purchaseDate: string;
    pricePaid: number;
    discountAmount: number;
    status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';
    createdAt: string;
  }>;
};

export default function CustomerMemberPage() {
  const { user, loading: authLoading } = useAuth();
  const [duration, setDuration] = React.useState<DurationMembership | null>(null);
  const [session, setSession] = React.useState<SessionMembership | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchActivePackages() {
      if (authLoading || !user?.sub) return;

      try {
        setLoading(true);

        // Fetch Duration packages
        const durationResponse = await fetch(
          `${API_BASE_URL}/api/customers/durations/active/${user.sub}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        
        // Fetch Session packages
        const sessionResponse = await fetch(
          `${API_BASE_URL}/api/customers/sessions/active/${user.sub}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const durationData: ActiveDurationResponse = await durationResponse.json();
        const sessionData: ActiveSessionResponse = await sessionResponse.json();

        // Process Duration data
        if (durationData.result && durationData.result.length > 0) {
          const activeDuration = durationData.result[0]; // เอาตัวแรก
          setDuration({
            title: activeDuration.productName,
            endDate: activeDuration.endDate,
            status: activeDuration.status,
            durationId: activeDuration.id,
            daysRemaining: activeDuration.daysRemaining,
            isExpired: activeDuration.daysRemaining <= 0,
          });
        } else {
          setDuration(null);
        }

        // Process Session data
        if (sessionData.result && sessionData.result.length > 0) {
          const activeSession = sessionData.result[0]; // เอาตัวแรก
          setSession({
            title: activeSession.productName,
            totalSessions: activeSession.totalSessions,
            usedSessions: activeSession.usedSessions,
            status: activeSession.status,
            sessionId: activeSession.id,
            remainingSessions: activeSession.sessionsRemaining,
            isCompleted: activeSession.sessionsRemaining <= 0,
          });
        } else {
          setSession(null);
        }

        setLoading(false);
      } catch (e: any) {
        console.error('Failed to load active packages:', e);
        setError(e.message || 'Failed to load packages');
        setLoading(false);
      }
    }

    fetchActivePackages();
  }, [user, authLoading]);

  // Show loading spinner while fetching
  if (authLoading || loading) {
    return (
      <Container maxWidth="sm" sx={{ px: 2, py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>กำลังโหลดข้อมูลแพ็กเกจ...</Typography>
      </Container>
    );
  }

  // Show error if any
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ px: 2, py: 8, textAlign: 'center' }}>
        <Typography color="error">เกิดข้อผิดพลาด: {error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0, pb: `calc(72px + env(safe-area-inset-bottom))` }}>
      <Stack spacing={2}>
        <MembershipHeader />
        <Stack sx={{ px: 2, pb: 2 }}>
          <MembershipContainer duration={duration} session={session} />
        </Stack>
      </Stack>
    </Container>
  );
}