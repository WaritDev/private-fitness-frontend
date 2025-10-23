'use client';

import * as React from 'react';
import { Container, Stack, Typography, Paper, Button, Box } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';

function money(n: number) {
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
}

export default function PaymentPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const name = sp.get('package_name') || '';
  const price = Number(sp.get('price') || 0);

  function markPaid() {
    const q = new URLSearchParams();
    for (const [k, v] of sp.entries()) q.set(k, v);
    q.set('paid_at', new Date().toISOString());
    router.push(`/customer/package/payment/success?${q.toString()}`);
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0 }}>
      <Stack spacing={2} sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={900}>Payment</Typography>

        <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
          <Stack spacing={2} alignItems="center">
            <Typography fontWeight={800} textAlign="center">{name}</Typography>
            <Typography color="text.secondary">{money(price)}</Typography>

            <FakeQR />

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Please scan to complete your payment
            </Typography>
            <Typography variant="caption" color="text.secondary">Status: Waiting for payment...</Typography>

            <Button
              fullWidth
              variant="contained"
              onClick={markPaid}
              sx={{ bgcolor: '#00C853', color: '#000', '&:hover': { bgcolor: '#00B84D' } }}
            >
              I have paid (Demo)
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}

function FakeQR() {
  return (
    <Box
      aria-label="QR"
      sx={{
        width: 220,
        height: 220,
        bgcolor: '#fff',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        backgroundImage:
          `repeating-linear-gradient(0deg, #000 0 6px, transparent 6px 12px),
           repeating-linear-gradient(90deg, #000 0 6px, transparent 6px 12px)`,
        backgroundBlendMode: 'multiply',
        boxShadow: 'inset 0 0 0 8px #fff',
      }}
    />
  );
}