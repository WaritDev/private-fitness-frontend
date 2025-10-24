'use client';

import * as React from 'react';
import {
  Container, Stack, Typography, Accordion, AccordionSummary, AccordionDetails,
  Paper, Button, Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useRouter } from 'next/navigation';

type DurationPkg = { id: string; name: string; price: number; durationDays: number };
type SessionPkg = { id: string; name: string; price: number; sessions: number };

const DURATION_PACKAGES: DurationPkg[] = [
  { id: 'D090', name: 'Economy 90 Days', price: 3990, durationDays: 90 },
  { id: 'D365', name: 'First Class 365 Days', price: 14990, durationDays: 365 },
];

const SESSION_PACKAGES: SessionPkg[] = [
  { id: 'S10', name: '10 PT Sessions', price: 8990, sessions: 10 },
  { id: 'S20', name: '20 PT Sessions', price: 15990, sessions: 20 },
];

function money(n: number) {
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
}

export default function PackagesPage() {
  const router = useRouter();

  function buyDuration(p: DurationPkg) {
    const q = new URLSearchParams({
      package_id: p.id,
      package_name: p.name,
      package_type: 'DURATION',
      price: String(p.price),
      duration_days: String(p.durationDays),
    });
    router.push(`/customer/package/order-summary?${q.toString()}`);
  }

  function buySession(p: SessionPkg) {
    const q = new URLSearchParams({
      package_id: p.id,
      package_name: p.name,
      package_type: 'SESSION',
      price: String(p.price),
      sessions: String(p.sessions),
    });
    router.push(`/customer/package/trainer?${q.toString()}`);
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0, pb: `calc(72px + env(safe-area-inset-bottom))` }}>
      <Stack spacing={2} sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={900}>Our Packages</Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocalOfferIcon color="primary" />
              <Typography fontWeight={700}>Duration Memberships</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              {DURATION_PACKAGES.map(p => (
                <Paper
                  key={p.id}
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F0FFF6 100%)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800}>{p.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{p.durationDays} Days</Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={1}>
                      <Typography variant="subtitle1" fontWeight={800}>{money(p.price)}</Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => buyDuration(p)}
                        sx={{ bgcolor: '#2196F3', '&:hover': { bgcolor: '#1e88e5' } }}
                      >
                        Buy Now
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FitnessCenterIcon color="primary" />
              <Typography fontWeight={700}>Session Packages</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              {SESSION_PACKAGES.map(p => (
                <Paper
                  key={p.id}
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F3F9FF 100%)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800}>{p.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{p.sessions} Sessions</Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={1}>
                      <Typography variant="subtitle1" fontWeight={800}>{money(p.price)}</Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => buySession(p)}
                        sx={{ bgcolor: '#2196F3', '&:hover': { bgcolor: '#1e88e5' } }}
                      >
                        Buy Now
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Container>
  );
}