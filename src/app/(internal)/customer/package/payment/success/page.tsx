'use client';

import * as React from 'react';
import { Container, Stack, Typography, Paper, Button, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function money(n: number) {
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
}

export default function PurchaseSuccessPage() {
  const sp = useSearchParams();
  const name = sp.get('package_name') || '';
  const price = Number(sp.get('price') || 0);
  const paidAt = sp.get('paid_at');

  return (
    <Container maxWidth="sm" sx={{ px: 0 }}>
      <Stack spacing={2} sx={{ px: 2, py: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 3,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F3F9FF 100%)',
          }}
        >
          <Stack spacing={1.5} alignItems="center">
            <Box sx={{ width: 88, height: 88, borderRadius: '50%', bgcolor: '#E7F2FF', display: 'grid', placeItems: 'center' }}>
              <CheckCircleIcon sx={{ color: '#2196F3', fontSize: 48 }} />
            </Box>
            <Typography variant="h6" fontWeight={900}>Purchase Successful!</Typography>
            <Typography variant="body2" color="text.secondary">{name}</Typography>
            <Typography variant="body2" color="text.secondary">{money(price)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {paidAt ? new Date(paidAt).toLocaleString() : new Date().toLocaleString()}
            </Typography>

            <Button
              component={Link}
              href="/customer/member"
              variant="contained"
              sx={{ mt: 1, bgcolor: '#00C853', color: '#000', '&:hover': { bgcolor: '#00B84D' } }}
            >
              View My Membership
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}