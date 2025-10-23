'use client';

import * as React from 'react';
import { Container, Stack } from '@mui/material';
import MembershipHeader from '@/components/customer/member/MembershipHeader';
import MembershipContainer from '@/components/customer/member/MembershipContainer';
import CheckinScanSection from '@/components/customer/member/CheckinScanSection';
import type { DurationMembership, SessionMembership } from '@/types/membership';

function mockData(): { duration: DurationMembership | null; session: SessionMembership | null } {
  const duration: DurationMembership | null = {
    title: 'Pro Yearly Membership',
    endDate: new Date(new Date().setDate(new Date().getDate() + 250)).toISOString(),
    status: 'ACTIVE',
  };
  const session: SessionMembership | null = {
    title: '20 Personal Training Sessions',
    totalSessions: 20,
    usedSessions: 5,
    status: 'ACTIVE',
  };
  return { duration, session };
}

export default function CustomerMemberPage() {
  const { duration, session } = mockData();

  return (
    <Container maxWidth="sm" sx={{ px: 0, pb: `calc(72px + env(safe-area-inset-bottom))` }}>
      <Stack spacing={2}>
        <MembershipHeader />
        {/* Check-in section on top with Arrow toggle */}
        <CheckinScanSection defaultOpen />
        <Stack sx={{ px: 2, pb: 2 }}>
          <MembershipContainer duration={duration} session={session} />
        </Stack>
      </Stack>
    </Container>
  );
}