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
function toIso(date: Date) {
  return new Date(date).toISOString();
}
function addMinutes(d: Date, mins: number) {
  return new Date(d.getTime() + mins * 60_000);
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
   * แปลง API response เป็น TimeSlot[] สำหรับแสดงใน Calendar
   * รวมข้อมูลจาก weeklyAvailability, bookedAppointments, dayOffSlots
   * Generate slots ทุก 30 นาที, แต่ละ slot มี duration 2 ชั่วโมง
   */
  const convertToTimeSlots = useCallback((
    apiResult: BookingSlotsResponse['result'],
    targetDate: string, // YYYY-MM-DD
    currentUsername?: string
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const date = new Date(targetDate);
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()];
    
    // 1. หา weeklyAvailability ของวันนี้
    const todayAvailability = apiResult.weeklyAvailability.find(w => w.dayOfWeek === dayOfWeek);
    if (!todayAvailability) {
      return []; // ไม่มีเวลาทำงานวันนี้
    }

    // 2. Parse startTime และ endTime จาก API (format: "2025-10-31T09:00:00+07:00")
    const availStart = new Date(todayAvailability.startTime);
    const availEnd = new Date(todayAvailability.endTime);
    
    // Extract hours and minutes
    const startHour = availStart.getHours();
    const startMinute = availStart.getMinutes();
    const endHour = availEnd.getHours();
    const endMinute = availEnd.getMinutes();
    
    // 3. สร้าง time slots ทุก 30 นาที, แต่ละ slot มี duration 120 นาที (2 ชั่วโมง)
    // เช่น 09:00-11:00, 09:30-11:30, 10:00-12:00, ... , 15:00-17:00
    const SLOT_DURATION_MINS = 120; // 2 ชั่วโมง
    const SLOT_INTERVAL_MINS = 30;   // ทุก 30 นาที
    
    // คำนวณเวลาเริ่มต้นและสิ้นสุดของการ generate slots
    const firstSlotStart = new Date(targetDate);
    firstSlotStart.setHours(startHour, startMinute, 0, 0);
    
    const lastSlotStart = new Date(targetDate);
    lastSlotStart.setHours(endHour, endMinute, 0, 0);
    lastSlotStart.setMinutes(lastSlotStart.getMinutes() - SLOT_DURATION_MINS); // ลบ 2 ชม. เพื่อให้ slot สุดท้ายไม่เกิน endTime
    
    let currentSlotStart = new Date(firstSlotStart);
    
    while (currentSlotStart <= lastSlotStart) {
      const slotEnd = addMinutes(currentSlotStart, SLOT_DURATION_MINS);
      
      const slotStartIso = currentSlotStart.toISOString();
      const slotEndIso = slotEnd.toISOString();
      
      // 4. ตรวจสอบว่าช่วงนี้ถูกจองหรือไม่
      const bookedAppt = apiResult.bookedAppointments.find(appt => {
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);
        // ตรวจสอบ overlap: slot overlaps with appointment
        return currentSlotStart < apptEnd && slotEnd > apptStart;
      });
      
      // 5. ตรวจสอบว่าเป็นวันหยุดหรือไม่
      const isDayOff = apiResult.dayOffSlots.some(dayOff => {
        const dayOffStart = new Date(dayOff.startTime);
        const dayOffEnd = new Date(dayOff.endTime);
        return currentSlotStart < dayOffEnd && slotEnd > dayOffStart;
      });
      
      // 6. สร้าง TimeSlot object
      const slot: TimeSlot = {
        start: slotStartIso,
        end: slotEndIso,
        durationMins: SLOT_DURATION_MINS,
        available: !bookedAppt && !isDayOff,
      };
      
      // 7. ถ้าถูกจอง, เพิ่มข้อมูลผู้จองและ scheduleId
      if (bookedAppt) {
        slot.bookedBy = bookedAppt.customerUsername;
        slot.isOwn = currentUsername ? bookedAppt.customerUsername === currentUsername : undefined;
        slot.scheduleId = bookedAppt.scheduleId; // ⚠️ สำคัญ: ต้องมีค่านี้สำหรับการยกเลิก
      }
      
      slots.push(slot);
      
      // 8. เลื่อนไปช่วงถัดไป (ทุก 30 นาที)
      currentSlotStart = addMinutes(currentSlotStart, SLOT_INTERVAL_MINS);
    }
    
    return slots;
  }, []);

  const fetchSlots = useCallback(async (dateIso: string, trainerUsername: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // สร้าง calendarStart และ calendarEnd สำหรับช่วง 7 วัน
      const dateStart = new Date(dateIso);
      dateStart.setHours(0, 0, 0, 0);
      
      const dateEnd = new Date(dateIso);
      dateEnd.setDate(dateEnd.getDate() + 6); // +6 วัน = รวม 7 วัน
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
        // แปลง API result เป็น TimeSlot[] สำหรับวันที่เลือก
        const slots = convertToTimeSlots(data.result, dateIso, customerUsername);
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
  }, [customerUsername, convertToTimeSlots]);

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