'use client';

import * as React from 'react';
import { Paper, Stack, Typography, Button } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { TimeSlot } from '@/types/calendar';

type Props = {
  slot: TimeSlot;
  onBook?: (slot: TimeSlot) => void;
  onCancel?: (slot: TimeSlot) => void;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function SlotCard({ slot, onBook, onCancel }: Props) {
  // Check if slot is in the past
  const slotStartTime = new Date(slot.start);
  const now = new Date();
  const isPast = slotStartTime <= now;
  
  // Determine slot state
  const isAvailable = slot.available;
  const isOwnBooking = slot.isOwn === true;
  const isOthersBooking = !slot.available && !isOwnBooking;
  
  // UI States
  let bg = '#E3F2FD'; // Available (blue)
  let btnVariant: 'contained' | 'outlined' = 'contained';
  let btnColor: 'primary' | 'error' | 'inherit' = 'primary';
  let btnText = 'Book';
  let btnDisabled = false;
  
  if (isPast && isAvailable) {
    // ผ่านเวลาไปแล้ว → สีเทาอ่อน, ปุ่ม Expired (disabled)
    bg = '#FAFAFA';
    btnVariant = 'outlined';
    btnColor = 'inherit';
    btnText = 'Expired';
    btnDisabled = true;
  } else if (isOwnBooking) {
    // ของตัวเอง → สีแดง, ปุ่ม Cancel
    bg = '#FFEBEE';
    btnVariant = 'contained';
    btnColor = 'error';
    btnText = 'Cancel';
    btnDisabled = isPast; // ไม่ให้ยกเลิกถ้าผ่านเวลาไปแล้ว
  } else if (isOthersBooking) {
    // คนอื่นจอง → สีเทา, ปุ่ม Booked (disabled)
    bg = '#F2F2F2';
    btnVariant = 'outlined';
    btnColor = 'inherit';
    btnText = 'Booked';
    btnDisabled = true;
  }

  const handleClick = () => {
    if (isAvailable && onBook) {
      onBook(slot);
    } else if (isOwnBooking && onCancel) {
      onCancel(slot);
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: bg }}>
      <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="space-between">
        <Stack direction="row" spacing={1.2} alignItems="center">
          <AccessTimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Stack>
            <Typography variant="subtitle2" fontWeight={700}>
              {fmtTime(slot.start)} – {fmtTime(slot.end)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(slot.durationMins / 60)} hours
            </Typography>
          </Stack>
        </Stack>
        <Button
          size="small"
          variant={btnVariant}
          color={btnColor}
          disabled={btnDisabled}
          onClick={handleClick}
          sx={{ borderRadius: 999 }}
        >
          {btnText}
        </Button>
      </Stack>
    </Paper>
  );
}