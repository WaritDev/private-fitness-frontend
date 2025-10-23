'use client';

import * as React from 'react';
import { Paper, Stack, Typography, Button } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { TimeSlot } from '@/types/calendar';

type Props = {
  slot: TimeSlot;
  onBook?: (slot: TimeSlot) => void;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function SlotCard({ slot, onBook }: Props) {
  const bg = slot.available ? '#E3F2FD' : '#F2F2F2';
  const btnVariant = slot.available ? 'contained' : 'outlined';
  const btnColor = slot.available ? 'primary' : 'inherit';

  return (
    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: bg }}>
      <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="space-between">
        <Stack direction="row" spacing={1.2} alignItems="center">
          <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Stack>
            <Typography variant="subtitle2" fontWeight={700}>
              {fmtTime(slot.start)} – {fmtTime(slot.end)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(slot.durationMins / 60)} hours
            </Typography>
          </Stack>
        </Stack>
        <Button
          size="small"
          variant={btnVariant as any}
          color={btnColor as any}
          disabled={!slot.available}
          onClick={() => slot.available && onBook?.(slot)}
          sx={{ borderRadius: 999 }}
        >
          {slot.available ? 'Book' : 'Booked'}
        </Button>
      </Stack>
    </Paper>
  );
}