'use client';

import React from 'react';
import CalendarWithList from '@/components/ui/CalendarWithList';
import { Box, Typography } from '@mui/material';

export default function BookingPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={2}>
        🏋️‍♀️ Book Training Session
      </Typography>

      <CalendarWithList />
    </Box>
  );
}