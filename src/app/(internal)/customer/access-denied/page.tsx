'use client';

import { Container, Paper, Typography, Button, Stack, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import BlockIcon from '@mui/icons-material/Block';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <BlockIcon
            sx={{
              fontSize: 80,
              color: 'error.main',
            }}
          />
        </Box>

        <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
          Access Denied
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 3, mb: 4, lineHeight: 1.7 }}
        >
          This page is only available for customers with active Session packages. Please purchase a Session package before booking an appointment.
        </Typography>

        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ShoppingCartIcon />}
            onClick={() => router.push('/customer/package')}
            sx={{ minWidth: 200 }}
          >
            Buy Session Package
          </Button>

          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => router.push('/customer/member')}
            sx={{ minWidth: 200 }}
          >
            Back to Home
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
