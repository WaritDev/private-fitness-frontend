import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardActions, Typography, Button, Stack } from '@mui/material';
import type { Product } from '@/types/product';

type Props = { session: Product };

export default function SessionCard({ session }: Props) {
  const hrefRegister = `/products/session/${session.Product_Id}/register`;

  return (
    <Card sx={{ width: 320 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700}>{session.Name}</Typography>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          <Typography variant="body2">Category: {session.Product_Category}</Typography>
          <Typography variant="body2">Price: {session.Price.toLocaleString()}</Typography>
          <Typography variant="body2">Sessions: {session.Session_Amount ?? '-'}</Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Button component={Link} href={hrefRegister} variant="contained" color="primary">
          Register
        </Button>
      </CardActions>
    </Card>
  );
}