'use client';

import * as React from 'react';
import { Paper, Stack, Typography, Button } from '@mui/material';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import Link from 'next/link';

export default function EmptyStateCard() {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'divider',
        backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <CardMembershipIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
        <Typography variant="h6" fontWeight={800}>No Active Memberships</Typography>
        <Typography variant="body2" color="text.secondary">
          You don&apos;t have any active memberships or packages yet.
        </Typography>
        <Button
          component={Link}
          href="/products"
          variant="contained"
          sx={{ bgcolor: '#00C853', color: '#000', borderRadius: 999, px: 2.5, '&:hover': { bgcolor: '#00B84D' } }}
        >
          Explore Memberships
        </Button>
      </Stack>
    </Paper>
  );
}