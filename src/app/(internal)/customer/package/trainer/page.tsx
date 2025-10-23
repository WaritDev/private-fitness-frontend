'use client';

import * as React from 'react';
import { Container, Stack, Typography, Paper, Avatar, Button } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';

type Trainer = { username: string; name: string; specialty: string; avatarUrl?: string };
const MOCK_TRAINERS: Trainer[] = [
  { username: 'alex', name: 'Alex Walker', specialty: 'Strength' },
  { username: 'olivia', name: 'Olivia Bennett', specialty: 'Yoga' },
  { username: 'john', name: 'John Carter', specialty: 'Conditioning' },
];

export default function TrainerAssignmentPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const selected = React.useRef<Trainer | null>(MOCK_TRAINERS[0]);

  function confirm() {
    const q = new URLSearchParams({
      package_id: sp.get('package_id') || '',
      package_name: sp.get('package_name') || '',
      package_type: 'SESSION',
      price: sp.get('price') || '',
      sessions: sp.get('sessions') || '',
      trainer_username: selected.current?.username || '',
      trainer_name: selected.current?.name || '',
    });
    router.push(`/customer/package/order-summary?${q.toString()}`);
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0 }}>
      <Stack spacing={2} sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={900}>Your Assigned Trainer</Typography>
        <Stack spacing={1.2}>
          {MOCK_TRAINERS.map(t => (
            <Paper
              key={t.username}
              onClick={() => (selected.current = t)}
              sx={{
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                cursor: 'pointer',
                border: '2px solid',
                borderColor: selected.current?.username === t.username ? '#00C853' : 'divider',
              }}
              elevation={1}
            >
              <Avatar src={t.avatarUrl}>{t.name.charAt(0)}</Avatar>
              <Stack sx={{ flex: 1 }}>
                <Typography fontWeight={700}>{t.name}</Typography>
                <Typography variant="caption" color="text.secondary">{t.specialty}</Typography>
              </Stack>
              <Button size="small" variant="outlined">Select</Button>
            </Paper>
          ))}
        </Stack>
        <Button
          variant="contained"
          onClick={confirm}
          sx={{ bgcolor: '#00C853', color: '#000', '&:hover': { bgcolor: '#00B84D' } }}
        >
          Confirm Trainer
        </Button>
      </Stack>
    </Container>
  );
}