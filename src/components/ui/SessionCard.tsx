import { Product } from '@/types/product';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import React from 'react';

function SessionCard({ session }: { session: Product }) {
  return (
    <Card
      sx={{
        width: 280,
        height: 220,
        display: 'flex',
        flexDirection: 'column',
      }}
      elevation={2}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          gutterBottom
          variant="h6"
          component="div"
          sx={{
            fontWeight: 600,
            lineHeight: 1.2,
            minHeight: 44, // รองรับ 2 บรรทัด
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {session.Name}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {session.Session_Amount} sessions
        </Typography>

        <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
          {session.Price.toLocaleString()} THB
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button size="small" variant="contained" fullWidth href="/registration">
          Register
        </Button>
      </CardActions>
    </Card>
  );
}

export default SessionCard;