'use client';

import * as React from 'react';
import { 
  Paper, 
  Stack, 
  Typography, 
  Chip, 
  IconButton, 
  Collapse, 
  Box,
  CircularProgress,
  Button,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import type { DurationMembership } from '@/types/membership';
import QRCodeGenerator from '@/components/ui/QRCodeGenerator';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function daysRemaining(endDateIso: string) {
  const end = new Date(endDateIso);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff < 0 ? 0 : diff;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

type Props = { data: DurationMembership };

export default function DurationMembershipCard({ data }: Props) {
  const days = daysRemaining(data.endDate);
  const [open, setOpen] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleGenerateQrCode() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/member/qrcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          packageType: 'DURATION',
        }),
      });

      const responseData = await response.json();

      if (responseData.status === 'success' && responseData.result) {
        setQrCodeUrl(responseData.result.qrCodeUrl);
      } else {
        throw new Error(responseData.message || 'Failed to generate QR code');
      }
    } catch (e: any) {
      console.error('Failed to generate QR code:', e);
      setError(e.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    const newOpen = !open;
    setOpen(newOpen);
    
    // Generate QR code เมื่อเปิดครั้งแรก
    if (newOpen && !qrCodeUrl && !loading) {
      handleGenerateQrCode();
    }
  }

  return (
    <Box>
      <Paper
        elevation={1}
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer',
        }}
        onClick={handleToggle}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <CalendarMonthIcon sx={{ color: '#00C853' }} />
          <Stack spacing={0}>
            <Typography variant="subtitle1" fontWeight={800}>
              Duration Package
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {days} days remaining
            </Typography>
          </Stack>
        </Stack>
        <IconButton onClick={handleToggle} aria-label="toggle">
          {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
        </IconButton>
      </Paper>

      <Collapse in={open} unmountOnExit>
        <Paper
          elevation={3}
          sx={{
            p: 2.5,
            mt: 1.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #F0FFF6 100%)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}
        >
          <Stack spacing={2}>
            {/* Package Info */}
            <Stack spacing={1.25}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                  icon={<CalendarMonthIcon />}
                  label="Duration Package"
                  size="small"
                  sx={{ bgcolor: '#E6F8EE', color: '#00C853', fontWeight: 700 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Status: {data.status}
                </Typography>
              </Stack>

              <Typography variant="h6" fontWeight={800}>
                {data.title}
              </Typography>

              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h3" fontWeight={900} sx={{ color: '#00C853', lineHeight: 1 }}>
                  {days}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Days Remaining
                </Typography>
              </Stack>

              <Typography variant="caption" color="text.secondary">
                Valid until {fmtDate(data.endDate)}
              </Typography>
            </Stack>

            {/* QR Code Section */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Stack spacing={2} alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <QrCodeScannerIcon sx={{ color: '#00C853' }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Check-in QR Code
                  </Typography>
                </Stack>

                {loading && <CircularProgress size={40} />}

                {error && (
                  <Stack spacing={1} alignItems="center">
                    <Typography variant="body2" color="error">
                      {error}
                    </Typography>
                    <Button size="small" variant="outlined" onClick={handleGenerateQrCode}>
                      Retry
                    </Button>
                  </Stack>
                )}

                {qrCodeUrl && !loading && (
                  <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <QRCodeGenerator uuid={qrCodeUrl} size={200} mode="url" />
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Show this QR code at the entrance for check-in
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
}