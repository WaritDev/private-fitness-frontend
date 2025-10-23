'use client';

import * as React from 'react';
import { Paper, Stack, Typography, Chip } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { DurationMembership } from '@/types/membership';

function daysRemaining(endDateIso: string) {
  const end = new Date(endDateIso);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff < 0 ? 0 : diff;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

type Props = { data: DurationMembership };

export default function DurationMembershipCard({ data }: Props) {
  const days = daysRemaining(data.endDate);
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #F0FFF6 100%)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Chip
            icon={<CalendarMonthIcon />}
            label="Duration Package"
            size="small"
            sx={{ bgcolor: '#E6F8EE', color: '#00C853', fontWeight: 700 }}
          />
          <Typography variant="caption" color="text.secondary">
            Status: {data.status}
          </Typography>
        </Stack>

        <Typography variant="h6" fontWeight={800}>
          {data.title}
        </Typography>

        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h3" fontWeight={900} sx={{ color: '#00C853', lineHeight: 1 }}>
            {days}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Days Remaining
          </Typography>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Valid until {fmtDate(data.endDate)}
        </Typography>
      </Stack>
    </Paper>
  );
}