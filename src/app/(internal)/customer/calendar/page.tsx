'use client';

import * as React from 'react';
import { Box, Container, Stack, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useAlertPopUp } from '@/components/pop-up/AlertPopUpUI';
import ConfirmPopUpUI from '@/components/pop-up/ConfirmPopUpUI';
import useWeekRange from '@/hooks/useWeekRange';
import useCalendarData from '@/hooks/useCalendarData';
import TrainerHeader from '@/components/customer/calendar/TrainerHeader';
import DateTabs from '@/components/customer/calendar/DateTabs';
import SlotListContainer from '@/components/customer/calendar/SlotListContainer';
import type { TimeSlot } from '@/types/calendar';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function CalendarPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { setAlert } = useAlertPopUp();
  
  // Permission check state
  const [permissionChecked, setPermissionChecked] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState(false);
  
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
  } = useCalendarData(startDate, endDate, user?.sub); // ส่ง customerUsername

  const selectedTrainerName =
    trainers.find((t) => t.username === selectedTrainer)?.name ?? 'Trainer';

  const [booking, setBooking] = React.useState(false);
  
  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [slotToCancel, setSlotToCancel] = React.useState<TimeSlot | null>(null);

  // Check permission on mount
  React.useEffect(() => {
    async function checkPermission() {
      if (authLoading || !user) return;
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/customers/sessions/check-permission?username=${user.sub}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );
        
        const data = await response.json();
        console.log('Permission check response:', data);
        
        if (data.status === 'success' && data.result) {
          setHasPermission(data.result.hasPermission);
          setPermissionChecked(true);
          
          // Redirect to access denied if no permission
          if (!data.result.hasPermission) {
            router.push('/customer/access-denied');
          }
        } else {
          setHasPermission(false);
          setPermissionChecked(true);
          router.push('/customer/access-denied');
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
        setPermissionChecked(true);
        router.push('/customer/access-denied');
      }
    }
    
    checkPermission();
  }, [user, authLoading, router]);

  function handlePickDate(d: Date) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(iso);
    // ไม่เปลี่ยน base สัปดาห์ เพื่อให้ย้อนกลับวันก่อนหน้าในแท็บได้
    // setWeekBase(d);
    if (selectedTrainer) fetchSlots(iso, selectedTrainer);
  }

  async function handleBook(slot: TimeSlot) {
    if (!user?.sub || !selectedTrainer) {
      setAlert({
        open: true,
        msg: 'กรุณาเข้าสู่ระบบและเลือกเทรนเนอร์',
        severity: 'error'
      });
      return;
    }

    // ตรวจสอบว่า slot ยังไม่ผ่านเวลาไป
    const slotStartTime = new Date(slot.start);
    const now = new Date();
    
    if (slotStartTime <= now) {
      setAlert({
        open: true,
        msg: '❌ ไม่สามารถจองช่วงเวลาที่ผ่านไปแล้ว',
        severity: 'error'
      });
      return;
    }

    try {
      setBooking(true);
      
      const bookingData = {
        trainerUsername: selectedTrainer,
        customerUsername: user.sub,
        sessionId: null, // auto-find ACTIVE session
        startTime: slot.start,
        endTime: slot.end
      };

      const response = await fetch(`${API_BASE_URL}/api/bookings/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(bookingData)
      });
      console.log('Booking response1:', response);
      const data = await response.json();
      console.log('Booking response2:', data);

      if (data.status === 'success' && data.result?.success) {
        setAlert({
          open: true,
          msg: `✅ จองนัดสำเร็จ! คงเหลือ ${data.remainingSession} ครั้ง`,
          severity: 'success'
        });
        
        setBookingDetails({
          selectedDate,
          selectedTrainer,
          selectedSlot: slot,
        });
        
        // Refresh slots
        if (selectedTrainer) fetchSlots(selectedDate, selectedTrainer);
      } else {
        throw new Error(data.message || 'ไม่สามารถจองนัดได้');
      }
    } catch (e: any) {
      setAlert({
        open: true,
        msg: `❌ จองนัดไม่สำเร็จ: ${e.message || 'เกิดข้อผิดพลาด'}`,
        severity: 'error'
      });
    } finally {
      setBooking(false);
    }
  }

  function handleCancel(slot: TimeSlot) {
    // เปิด confirm dialog แทนการยกเลิกทันที
    setSlotToCancel(slot);
    setConfirmOpen(true);
  }

  async function confirmCancel() {
    console.log('Confirming cancellation for slot:', slotToCancel);
    console.log('User:', user);
    if (!user?.sub || !slotToCancel?.scheduleId) {
      setAlert({
        open: true,
        msg: 'ไม่สามารถยกเลิกนัดได้',
        severity: 'error'
      });
      return;
    }

    try {
      setBooking(true);

      const response = await fetch(
        `${API_BASE_URL}/api/bookings/cancel/${slotToCancel.scheduleId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            customerUsername: user.sub
          })
        }
      );
      console.log('Cancel response1:', response);
      const data = await response.json();
      console.log('Cancel response2:', data);

      // ตรวจสอบ response status ที่ถูกต้อง
      if (data.status === 'success' && data.result?.success) {
        setAlert({
          open: true,
          msg: `✅ Booking cancelled successfully. คงเหลือ ${data.result.remainingSessions} ครั้ง`,
          severity: 'success'
        });
        
        // Refresh slots
        if (selectedTrainer) fetchSlots(selectedDate, selectedTrainer);
      } else {
        throw new Error(data.message || 'ไม่สามารถยกเลิกนัดได้');
      }
    } catch (e: any) {
      setAlert({
        open: true,
        msg: `❌ ยกเลิกนัดไม่สำเร็จ: ${e.message || 'เกิดข้อผิดพลาด'}`,
        severity: 'error'
      });
    } finally {
      setBooking(false);
      setConfirmOpen(false);
      setSlotToCancel(null);
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  // Show loading while checking permission
  if (authLoading || !permissionChecked) {
    return (
      <Container maxWidth="sm" sx={{ px: 2, py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>กำลังตรวจสอบสิทธิ์การเข้าถึง...</Typography>
      </Container>
    );
  }

  // Don't render calendar if no permission (will redirect)
  if (!hasPermission) {
    return null;
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
        <SlotListContainer 
          slots={availableSlots} 
          onBook={handleBook}
          onCancel={handleCancel}
        />
      </Stack>

      {/* Confirm Cancellation Dialog */}
      <ConfirmPopUpUI
        open={confirmOpen}
        title="ยืนยันการยกเลิกนัด"
        message={
          slotToCancel ? (
            <Typography>
              Confirm cancellation for{' '}
              <strong>
                {formatTime(slotToCancel.start)} – {formatTime(slotToCancel.end)}
              </strong>
              ?
            </Typography>
          ) : null
        }
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmCancel}
        onClose={() => {
          setConfirmOpen(false);
          setSlotToCancel(null);
        }}
      />
    </Container>
  );
}