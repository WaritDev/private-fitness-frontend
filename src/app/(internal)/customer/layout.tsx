'use client';

import CustomerMobileNav from '@/components/ui/CustomerMobileNav';
import { Box } from '@mui/material';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ pb: `calc(64px + env(safe-area-inset-bottom))`, minHeight: '100dvh', bgcolor: 'background.default' }}>
      {children}
      <CustomerMobileNav />
    </Box>
  );
}