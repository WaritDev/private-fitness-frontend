'use client';

import * as React from 'react';
import { Paper, Stack, Typography, Chip, LinearProgress } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import type { SessionMembership } from '@/types/membership';

type Props = { data: SessionMembership };

export default function SessionMembershipCard({ data }: Props) {
  const left = Math.max(0, (data.totalSessions ?? 0) - (data.usedSessions ?? 0));
  const progress = data.totalSessions ? Math.min(100, Math.round((data.usedSessions / data.totalSessions) * 100)) : 0;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #F3F9FF 100%)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Chip
            icon={<FitnessCenterIcon />}
            label="Session Course"
            size="small"
            sx={{ bgcolor: '#E7F2FF', color: '#1E88E5', fontWeight: 700 }}
          />
          <Typography variant="caption" color="text.secondary">
            Status: {data.status}
          </Typography>
        </Stack>

        <Typography variant="h6" fontWeight={800}>
          {data.title}
        </Typography>

        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h3" fontWeight={900} sx={{ color: '#1E88E5', lineHeight: 1 }}>
            {left}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sessions Left
          </Typography>
        </Stack>

        <Stack spacing={0.5}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: '#E7F2FF',
              '& .MuiLinearProgress-bar': { bgcolor: '#1E88E5' },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Used {data.usedSessions}/{data.totalSessions}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}