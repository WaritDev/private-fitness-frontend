'use client';

import * as React from 'react';
import { Container, Stack, Typography, Paper, Divider, Button } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';

function money(n: number) {
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
}

export default function OrderSummaryPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const name = sp.get('package_name') || '';
  const type = sp.get('package_type') || '';
  const price = Number(sp.get('price') || 0);
  const durationDays = sp.get('duration_days');
  const sessions = sp.get('sessions');
  const trainerName = sp.get('trainer_name');

  function confirmPayment() {
    const q = new URLSearchParams();
    for (const [k, v] of sp.entries()) q.set(k, v);
    router.push(`/customer/package/payment?${q.toString()}`);
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0 }}>
      <Stack spacing={2} sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={900}>Order Summary</Typography>

        <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography fontWeight={800}>{name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Type: {type}
            </Typography>
            {durationDays && (
              <Typography variant="body2" color="text.secondary">
                Duration: {durationDays} days
              </Typography>
            )}
            {sessions && (
              <Typography variant="body2" color="text.secondary">
                Sessions: {sessions}
              </Typography>
            )}
            {trainerName && (
              <Typography variant="body2" color="text.secondary">
                Trainer: {trainerName}
              </Typography>
            )}

            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={700}>Total</Typography>
              <Typography fontWeight={800}>{money(price)}</Typography>
            </Stack>
          </Stack>
        </Paper>

        <Button
          variant="contained"
          onClick={confirmPayment}
          sx={{ bgcolor: '#00C853', color: '#000', '&:hover': { bgcolor: '#00B84D' } }}
        >
          Confirm Payment
        </Button>
      </Stack>
    </Container>
  );
}