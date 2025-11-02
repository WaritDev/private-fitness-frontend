import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardActions, Typography, Button, Stack } from '@mui/material';
import type { Product, DbProduct } from '@/types/product';

type Props = { session: Product | DbProduct };

export default function SessionCard({ session }: Props) {
  // Handle both Product and DbProduct interfaces
  const productId = 'productId' in session ? session.productId : session.Product_Id;
  const name = 'name' in session ? session.name : session.Name;
  const category = 'productCategory' in session ? session.productCategory : (session as DbProduct).Product_Category;
  const price = 'price' in session ? session.price : (session as DbProduct).List_Price;
  const sessionAmount = 'sessionAmount' in session ? session.sessionAmount : (session as DbProduct).Session_Amount;

  const hrefRegister = `/sales/products/session/${productId}/register`;

  return (
    <Card sx={{ width: 320 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700}>{name}</Typography>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          <Typography variant="body2">Category: {category}</Typography>
          <Typography variant="body2">Price: {price?.toLocaleString()}</Typography>
          <Typography variant="body2">Sessions: {sessionAmount ?? '-'}</Typography>
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