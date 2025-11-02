import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardActions, Typography, Button, Stack } from '@mui/material';
import type { Product, DbProduct } from '@/types/product';

type Props = { duration: Product | DbProduct };

export default function DurationCard({ duration }: Props) {
  // Handle both Product and DbProduct interfaces
  const productId = 'productId' in duration ? duration.productId : duration.Product_Id;
  const name = 'name' in duration ? duration.name : duration.Name;
  const category = 'productCategory' in duration ? duration.productCategory : (duration as DbProduct).Product_Category;
  const price = 'price' in duration ? duration.price : (duration as DbProduct).List_Price;
  const durationDays = 'durationDays' in duration ? duration.durationDays : (duration as DbProduct).Duration_Days;

  const hrefRegister = `/sales/products/duration/${productId}/register`;

  return (
    <Card sx={{ width: 320 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700}>{name}</Typography>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          <Typography variant="body2">Category: {category}</Typography>
          <Typography variant="body2">Price: {price?.toLocaleString()}</Typography>
          <Typography variant="body2">Days: {durationDays ?? '-'}</Typography>
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