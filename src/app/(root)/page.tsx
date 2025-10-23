'use client';

import * as React from 'react';
import { Box, Container, Stack, Typography, Grid, Button } from '@mui/material';
import HeroCarousel from '@/components/HeroCarousel';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack spacing={{ xs: 2, md: 4 }}>
        <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <HeroCarousel slides={[]} />
        </Box>

        <Grid container spacing={2}>
          <Grid  size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Book Your Session
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Schedule a private training session with our expert trainers.
              </Typography>
              <Button fullWidth size="large" component={Link} href="/login" variant="contained">
                Get Started
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Explore Products
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose session packages or durations that fit your goals.
              </Typography>
              <Button fullWidth size="large" component={Link} href="/products" variant="outlined">
                Browse Products
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}