'use client';

import * as React from 'react';
import { Box, Container, Stack, Snackbar, Alert } from '@mui/material';
import useWeekRange from '@/hooks/useWeekRange';
import useCalendarData from '@/hooks/useCalendarData';
import TrainerHeader from '@/components/customer/calendar/TrainerHeader';
import DateTabs from '@/components/customer/calendar/DateTabs';
import SlotListContainer from '@/components/customer/calendar/SlotListContainer';
import type { TimeSlot } from '@/types/calendar';

export default function CalendarPage() {
  const { startDate, endDate, days, setWeekBase } = useWeekRange();
  const {
    trainers,
    selectedTrainer,
    setSelectedTrainer,
    selectedDate,
    setSelectedDate,
    availableSlots,
    bookingDetails,
    setBookingDetails,
    fetchSlots,
  } = useCalendarData(startDate, endDate);

  const selectedTrainerName =
    trainers.find((t) => t.username === selectedTrainer)?.name ?? 'Trainer';

  const [snack, setSnack] = React.useState<{ open: boolean; message: string; color: 'success' | 'error' }>({
    open: false,
    message: '',
    color: 'success',
  });
  const [booking, setBooking] = React.useState(false);

  // สมมติจอง (UI only)
  function fakeBookSlot(slot: TimeSlot) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (!slot.available) return reject(new Error('Slot unavailable'));
        // สุ่ม fail เบาๆ 15% เพื่อโชว์ error
        if (Math.random() < 0.15) return reject(new Error('Network error'));
        resolve();
      }, 500);
    });
  }

  function handlePickDate(d: Date) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(iso);
    // ไม่เปลี่ยน base สัปดาห์ เพื่อให้ย้อนกลับวันก่อนหน้าในแท็บได้
    // setWeekBase(d);
    if (selectedTrainer) fetchSlots(iso, selectedTrainer);
  }

  async function handleBook(slot: TimeSlot) {
    try {
      setBooking(true);
      await fakeBookSlot(slot);
      setBookingDetails({
        selectedDate,
        selectedTrainer: selectedTrainer ?? null,
        selectedSlot: slot,
      });
      setSnack({ open: true, message: 'Booking Successful', color: 'success' });
      // ถ้าต้องการรีเฟรชรายการก็เรียก fetchSlots อีกครั้ง
      if (selectedTrainer) fetchSlots(selectedDate, selectedTrainer);
    } catch (e: any) {
      setSnack({ open: true, message: `Booking Failed ${e?.message ?? ''}`.trim(), color: 'error' });
    } finally {
      setBooking(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0 }}>
      <Stack spacing={0}>
        <TrainerHeader name={selectedTrainerName} onOpenCalendar={() => { /* open month picker (future) */ }} />
        <DateTabs
          days={days}
          selected={new Date(selectedDate)}
          onChange={handlePickDate}
        />
        <Box sx={{ height: 8 }} />
        <SlotListContainer slots={availableSlots} onBook={handleBook} />
      </Stack>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.color} onClose={() => setSnack((p) => ({ ...p, open: false }))} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}