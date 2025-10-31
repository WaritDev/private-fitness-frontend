'use client';

import * as React from 'react';
import {
  Container, Stack, Typography, Accordion, AccordionSummary, AccordionDetails,
  Paper, Button, Box, CircularProgress, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function money(n: number) {
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
}

export default function PackagesPage() {
  const router = useRouter();
  
  // State for API data
  const [durations, setDurations] = React.useState<Product[]>([]);
  const [sessions, setSessions] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch products from API
  React.useEffect(() => {
    async function fetchDurations() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/durations`, {
          credentials: 'include',
        });
        const data = await res.json();
        
        if (data.status === 'OK' && data.result) {
          const products: Product[] = data.result.map((item: any) => ({
            productId: item.id,
            name: item.name,
            productType: item.type,
            productCategory: item.category,
            listPrice: item.listPrice,
            price: item.listPrice,
            sessionAmount: item.sessionAmount,
            durationDays: item.durationDays,
            isActive: item.isActive,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          setDurations(products);
        }
      } catch (err) {
        console.error('Error fetching durations:', err);
        setError('ไม่สามารถโหลดข้อมูล Duration ได้');
      }
    }

    async function fetchSessions() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/sessions`, {
          credentials: 'include',
        });
        const data = await res.json();
        
        if (data.status === 'OK' && data.result) {
          const products: Product[] = data.result.map((item: any) => ({
            productId: item.id,
            name: item.name,
            productType: item.type,
            productCategory: item.category,
            listPrice: item.listPrice,
            price: item.listPrice,
            sessionAmount: item.sessionAmount,
            durationDays: item.durationDays,
            isActive: item.isActive,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }));
          setSessions(products);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('ไม่สามารถโหลดข้อมูล Session ได้');
      }
    }

    Promise.all([fetchDurations(), fetchSessions()]).finally(() => {
      setLoading(false);
    });
  }, []);

  function buyDuration(product: Product) {
    // Store minimal data for flow detection (use unified key 'pendingOrder')
    const orderData = {
      source: 'customer-purchase',
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // Redirect to payment page with product ID from API
    router.push(`/customer/package/${product.productId}/payment`);
  }

  function buySession(product: Product) {
    // TODO: In the future, this should navigate to trainer selection page first
    // For now, we'll use a default trainer or show error
    // Temporary: prompt user to select trainer (in real app, navigate to trainer selection page)
    
    const trainerUsername = prompt('กรุณาใส่ Username ของ Trainer (ชั่วคราว):');
    
    if (!trainerUsername) {
      alert('กรุณาเลือก Trainer ก่อนซื้อแพ็กเกจ Session');
      return;
    }
    
    // Store order data with trainer info (use unified key 'pendingOrder')
    const orderData = {
      source: 'customer-purchase',
      timestamp: new Date().toISOString(),
      trainerUsername: trainerUsername.trim(),
    };
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // Redirect directly to payment page
    router.push(`/customer/package/${product.productId}/payment`);
  }

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Stack spacing={2} sx={{ px: 2, py: 4 }} alignItems="center">
          <CircularProgress />
          <Typography>กำลังโหลดข้อมูลแพ็กเกจ...</Typography>
        </Stack>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Stack spacing={2} sx={{ px: 2, py: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button variant="outlined" onClick={() => window.location.reload()}>
            ลองใหม่อีกครั้ง
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0, pb: `calc(72px + env(safe-area-inset-bottom))` }}>
      <Stack spacing={2} sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={900}>Our Packages</Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocalOfferIcon color="primary" />
              <Typography fontWeight={700}>Duration Memberships</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {durations.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                ไม่มีแพ็กเกจ Duration ในขณะนี้
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {durations.map(product => (
                  <Paper
                    key={product.productId}
                    elevation={3}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F0FFF6 100%)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>{product.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.durationDays} Days
                        </Typography>
                      </Box>
                      <Stack alignItems="flex-end" spacing={1}>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {money(product.listPrice)}
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => buyDuration(product)}
                          sx={{ bgcolor: '#2196F3', '&:hover': { bgcolor: '#1e88e5' } }}
                        >
                          Buy Now
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FitnessCenterIcon color="primary" />
              <Typography fontWeight={700}>Session Packages</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {sessions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                ไม่มีแพ็กเกจ Session ในขณะนี้
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {sessions.map(product => (
                  <Paper
                    key={product.productId}
                    elevation={3}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F3F9FF 100%)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>{product.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.sessionAmount} Sessions
                        </Typography>
                      </Box>
                      <Stack alignItems="flex-end" spacing={1}>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {money(product.listPrice)}
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => buySession(product)}
                          sx={{ bgcolor: '#2196F3', '&:hover': { bgcolor: '#1e88e5' } }}
                        >
                          Buy Now
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Container>
  );
}