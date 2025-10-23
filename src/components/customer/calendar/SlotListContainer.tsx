'use client';

import * as React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { TimeSlot } from '@/types/calendar';
import SlotCard from './SlotCard';

type Props = {
  slots: TimeSlot[];
  onBook?: (slot: TimeSlot) => void;
};

export default function SlotListContainer({ slots, onBook }: Props) {
  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
        Available Slots
      </Typography>
      <Stack spacing={1.2}>
        {slots.map((s) => (
          <SlotCard key={`${s.start}-${s.end}`} slot={s} onBook={onBook} />
        ))}
        {slots.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No slots available for this day.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}