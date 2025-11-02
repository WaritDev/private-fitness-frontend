'use client';

import * as React from 'react';
import { Avatar, Box, IconButton, Stack, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

type Props = {
  name: string;
  avatarUrl?: string;
  onOpenCalendar?: () => void;
};

export default function TrainerHeader({ name, avatarUrl, onOpenCalendar }: Props) {
  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={avatarUrl} alt={name} />
          <Typography variant="subtitle1" fontWeight={700}>
            {name}
          </Typography>
        </Stack>
        <IconButton size="small" color="primary" onClick={onOpenCalendar} aria-label="Open calendar">
          <CalendarMonthIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}