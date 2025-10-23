import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardActions, Typography, Button, Stack } from '@mui/material';
import type { Product } from '@/types/product';

type Props = { duration: Product };

export default function DurationCard({ duration }: Props) {
  const hrefRegister = `/products/duration/${duration.Product_Id}/register`;

  return (
    <Card sx={{ width: 320 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700}>{duration.Name}</Typography>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          <Typography variant="body2">Category: {duration.Product_Category}</Typography>
          <Typography variant="body2">Price: {duration.Price.toLocaleString()}</Typography>
          <Typography variant="body2">Days: {duration.Duration_Days ?? '-'}</Typography>
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