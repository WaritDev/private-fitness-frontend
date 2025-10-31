'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import type { BookingDetails, TimeSlot } from '@/types/calendar';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function formatISODateOnly(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function calculateSlotDuration(start: string, end: string): number {
  const startTime = new Date(start);
  const endTime = new Date(end);
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

type UseCalendarData = {
  trainers: TrainerSummary[];
  selectedTrainer: string | null;
  setSelectedTrainer: (u: string) => void;

  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (isoDate: string) => void;

  availableSlots: TimeSlot[];
  loading: boolean;
  error: string | null;

  bookingDetails: BookingDetails;
  setBookingDetails: (b: BookingDetails) => void;

  fetchSlots: (dateIso: string, trainerUsername: string) => void;
};

type TrainerSummary = {
  username: string;
  name: string;
  avatarUrl?: string;
};

// API Response Types
type BookingSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  isBooked?: boolean;
  bookedBy?: string;
  slotType?: string;
  customerUsername?: string; // username ของคนที่จอง
  scheduleId?: number; // ID ของการจอง (สำหรับยกเลิก)
};

type WeeklyAvailability = {
  dayOfWeek: string;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
};

type BookingSlotsResponse = {
  status: string;
  status_code: number;
  message: string;
  result: {
    trainerUsername: string;
    calendarStart: string;
    calendarEnd: string;
    weeklyAvailability: WeeklyAvailability[];
    dayOffSlots: BookingSlot[];
    bookedAppointments: BookingSlot[];
    availableSlots: BookingSlot[];
    customerBookings: BookingSlot[];
    message: string;
  };
};

export default function useCalendarData(
  startDate: Date, 
  endDate: Date,
  customerUsername?: string
): UseCalendarData {
  // TODO: Fetch trainers from API in the future
  const [trainers] = useState<TrainerSummary[]>([
    { username: 'trainer1', name: 'Trainer 1' },
  ]);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(trainers[0]?.username ?? null);

  const [selectedDate, setSelectedDate] = useState<string>(formatISODateOnly(startDate));
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    selectedDate,
    selectedTrainer,
    selectedSlot: null,
  });

  useEffect(() => {
    setSelectedDate(formatISODateOnly(startDate));
  }, [startDate]);

  useEffect(() => {
    setBookingDetails((b) => ({
      ...b,
      selectedDate,
      selectedTrainer,
    }));
  }, [selectedDate, selectedTrainer]);

  /**
   * แปลง API response (ที่ Backend คำนวณมาแล้ว) เป็น TimeSlot[] สำหรับแสดงใน Calendar
   * ใช้ availableSlots และ customerBookings จาก Backend โดยตรง
   */
  const convertApiSlotsToTimeSlots = useCallback((
    apiResult: BookingSlotsResponse['result'],
    targetDate: string, // YYYY-MM-DD
    currentUsername?: string
  ): TimeSlot[] => {
    const targetDateObj = new Date(targetDate);
    const targetDateStr = targetDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // กรอง customerBookings เฉพาะวันที่เลือก
    const customerBookingsToday = apiResult.customerBookings.filter(slot => {
      const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
      return slotDate === targetDateStr;
    });
    
    // สร้าง Set ของ (startTime, endTime) จาก customerBookings เพื่อหลีกเลี่ยง duplicate
    // ใช้ startTime + endTime เป็น key เพราะ Backend อาจส่ง slot เดียวกันมาทั้งใน availableSlots และ customerBookings
    const customerSlotKeys = new Set(
      customerBookingsToday.map(slot => `${slot.startTime}|${slot.endTime}`)
    );
    
    // กรอง availableSlots เฉพาะวันที่เลือก และตัดที่ซ้ำกับ customerBookings ออก
    const availableSlotsToday = apiResult.availableSlots.filter(slot => {
      const slotDate = new Date(slot.startTime).toISOString().split('T')[0];
      const slotKey = `${slot.startTime}|${slot.endTime}`;
      // เอาเฉพาะ slot ของวันนี้ และไม่ซ้ำกับ customerBookings
      return slotDate === targetDateStr && !customerSlotKeys.has(slotKey);
    });
    
    // รวม availableSlots (ไม่ซ้ำ) + customerBookings
    const allSlots = [
      ...availableSlotsToday,
      ...customerBookingsToday
    ];
    
    // แปลงเป็น TimeSlot[] พร้อมเพิ่มข้อมูล isOwn
    const timeSlots: TimeSlot[] = allSlots.map(slot => {
      const duration = calculateSlotDuration(slot.startTime, slot.endTime);
      const isOwn = slot.bookedBy === currentUsername;
      
      return {
        start: slot.startTime,
        end: slot.endTime,
        durationMins: duration,
        available: slot.available,
        bookedBy: slot.bookedBy || undefined,
        isOwn: slot.isBooked ? isOwn : undefined,
        scheduleId: slot.scheduleId || (slot as any).id, // ใช้ scheduleId หรือ id
      };
    });
    
    // เรียงตามเวลา
    timeSlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    return timeSlots;
  }, []);

  const fetchSlots = useCallback(async (dateIso: string, trainerUsername: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // สร้าง calendarStart และ calendarEnd สำหรับช่วง 1 เดือน
      const dateStart = new Date(dateIso);
      dateStart.setDate(1); // วันแรกของเดือน
      dateStart.setHours(0, 0, 0, 0);
      
      const dateEnd = new Date(dateIso);
      dateEnd.setMonth(dateEnd.getMonth() + 1); // เดือนถัดไป
      dateEnd.setDate(0); // วันสุดท้ายของเดือนปัจจุบัน
      dateEnd.setHours(23, 59, 59, 999);
      
      const calendarStart = dateStart.toISOString();
      const calendarEnd = dateEnd.toISOString();
      
      // Build query params
      const params = new URLSearchParams({
        trainerUsername,
        calendarStart,
        calendarEnd,
      });
      
      if (customerUsername) {
        params.append('customerUsername', customerUsername);
      }
      
      const response = await fetch(
        `${API_BASE_URL}/api/bookings/slots?${params.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: BookingSlotsResponse = await response.json();
      
      if (data.status === 'success' && data.result) {
        // แปลง API result เป็น TimeSlot[] สำหรับวันที่เลือก (Backend คำนวณมาแล้ว)
        const slots = convertApiSlotsToTimeSlots(data.result, dateIso, customerUsername);
        setAvailableSlots(slots);
      } else {
        throw new Error(data.message || 'Failed to fetch slots');
      }
      
      setLoading(false);
    } catch (e: any) {
      console.error('Failed to load slots:', e);
      setError(e.message || 'Failed to load slots');
      setAvailableSlots([]);
      setLoading(false);
    }
  }, [customerUsername, convertApiSlotsToTimeSlots]);

  // initial load
  useEffect(() => {
    if (selectedTrainer && selectedDate) {
      fetchSlots(selectedDate, selectedTrainer);
    }
  }, [selectedTrainer, selectedDate, fetchSlots]);

  return {
    trainers,
    selectedTrainer,
    setSelectedTrainer,

    selectedDate,
    setSelectedDate,

    availableSlots,
    loading,
    error,

    bookingDetails,
    setBookingDetails,

    fetchSlots,
  };
}