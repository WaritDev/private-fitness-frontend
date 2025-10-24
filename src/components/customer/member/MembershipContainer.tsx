'use client';

import * as React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import type { DurationMembership, SessionMembership } from '@/types/membership';
import DurationMembershipCard from './DurationMembershipCard';
import SessionMembershipCard from './SessionMembershipCard';
import EmptyStateCard from './EmptyStateCard';

type Props = {
  duration?: DurationMembership | null;
  session?: SessionMembership | null;
};

export default function MembershipContainer({ duration, session }: Props) {
  const hasDuration = !!duration && duration.status === 'ACTIVE';
  const hasSession = !!session && session.status === 'ACTIVE';

  return (
    <Box sx={{ px: 0.5 }}>
      <Stack spacing={2}>
        {!hasDuration && !hasSession && <EmptyStateCard />}

        {hasDuration && <DurationMembershipCard data={duration as DurationMembership} />}

        {hasSession && <SessionMembershipCard data={session as SessionMembership} />}

        {!hasSession && hasDuration && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
            You don’t have any Personal Training sessions.
          </Typography>
        )}
        {!hasDuration && hasSession && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
            No active duration packages.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}