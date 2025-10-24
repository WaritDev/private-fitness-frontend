'use client';

import * as React from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useRouter } from 'next/navigation';

type Props = {
  title?: string;
  onBack?: () => void;
};

export default function MembershipHeader({ title = 'My Membership', onBack }: Props) {
  const router = useRouter();
  return (
    <Box sx={{ px: 2, py: 1.5, position: 'sticky', top: 0, bgcolor: 'background.default', zIndex: (t) => t.zIndex.appBar }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <IconButton size="small" onClick={onBack ?? (() => router.back())} aria-label="Back">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
    </Box>
  );
}