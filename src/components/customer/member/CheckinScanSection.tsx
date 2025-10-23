'use client';

import * as React from 'react';
import { Box, Paper, Stack, Typography, Collapse, IconButton, Button } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import QRCodeGenerator from '@/components/ui/QRCodeGenerator';

export default function CheckinScanSection({ defaultOpen = true, userName = 'Guest', userUuid }: { defaultOpen?: boolean; userName?: string; userUuid?: string }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [uuid, setUuid] = React.useState<string>(userUuid || '');

  React.useEffect(() => {
    if (userUuid) {
      setUuid(userUuid);
      return;
    }
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pf_user_uuid') : null;
    if (saved) {
      setUuid(saved);
    } else {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : 'mock-uuid-1234';
      try { localStorage.setItem('pf_user_uuid', id); } catch {}
      setUuid(id);
    }
  }, [userUuid]);

  function copyUuid() {
    if (!uuid) return;
    navigator.clipboard?.writeText(uuid).catch(() => {});
  }

  function downloadPng() {
    // สร้างภาพจาก Canvas ของ qrcode.react (SVG/Canvas รองรับทั้งคู่; ที่นี่ใช้ Canvas)
    const canvas = document.querySelector('canvas[data-pf-qr="1"]') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `checkin-${uuid}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <Box sx={{ px: 2 }}>
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
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <QrCodeScannerIcon color="primary" />
          <Stack spacing={0}>
            <Typography variant="subtitle1" fontWeight={800}>
              My Check-in QR
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Show this code to staff for check-in
            </Typography>
          </Stack>
        </Stack>
        <IconButton onClick={() => setOpen((v) => !v)} aria-label="toggle">
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
            backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F3F9FF 100%)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              {userName}
            </Typography>

            {/* ใส่ data attribute เพื่อจับ canvas สำหรับดาวน์โหลด */}
            <Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              {/* qrcode.react จะเรนเดอร์เป็น canvas โดยค่าเริ่มต้น */}
              {/* เพิ่ม data attribute ด้วย wrapper hook แบบเล็กๆ */}
              <QRWithDataAttribute uuid={uuid} />
            </Box>

            <Stack spacing={0.5} alignItems="center">
              <Typography variant="caption" color="text.secondary">UUID</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{uuid}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ContentCopyIcon />}
                onClick={copyUuid}
                sx={{ bgcolor: '#00C853', color: '#000', '&:hover': { bgcolor: '#00B84D' } }}
              >
                Copy ID
              </Button>
              <Button fullWidth variant="outlined" startIcon={<DownloadIcon />} onClick={downloadPng}>
                Download
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              Staff will scan this QR to verify your membership/appointment and log your check-in.
            </Typography>
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
}

function QRWithDataAttribute({ uuid }: { uuid: string }) {
  // Render แล้วเติม data attribute ให้ canvas ตัวแรกที่สร้างในกล่องนี้
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const canvas = ref.current?.querySelector('canvas');
    if (canvas) canvas.setAttribute('data-pf-qr', '1');
  }, [uuid]);
  return (
    <div ref={ref}>
      <QRCodeGenerator uuid={uuid} size={220} mode="uuid" />
    </div>
  );
}