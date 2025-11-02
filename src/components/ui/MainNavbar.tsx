'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Button,
  Typography,
} from '@mui/material';

const PRIMARY = { main: '#38E07A', dark: '#2fbb65' } as const;

export default function MainNavbar(): React.JSX.Element {
  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: 'saturate(180%) blur(10px)',
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64, gap: 1 }}>
          <Box
            component={Link}
            href="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mr: 2,
            }}
          >
            <Image src="/gym.png" alt="Private Fitness" width={28} height={28} />
            <Typography variant="h6" sx={{ fontWeight: 400, letterSpacing: '0.3px' }}>
              Private Fitness
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            component={Link}
            href="/login"
            variant="contained"
            size="small"
            sx={{
              backgroundColor: PRIMARY.main,
              '&:hover': { backgroundColor: PRIMARY.dark },
            }}
          >
            Sign In
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}