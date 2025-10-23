'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import type { BookingDetails, TimeSlot } from '@/types/calendar';
import type { Trainer } from '@/types/trainer';

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

// mock trainers (UI only, no backend)
const MOCK_TRAINERS: TrainerSummary[] = [
  { username: 'alex', name: 'Alex Fitness' },
  { username: 'maya', name: 'Maya Coach' },
  { username: 'john', name: 'John PT' },
];

export default function useCalendarData(startDate: Date, endDate: Date): UseCalendarData {
  const [trainers] = useState<TrainerSummary[]>(MOCK_TRAINERS);
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

  const generateSlots = useCallback((dateIso: string, trainerUsername: string) => {
    // UI only:
    // - เปิดช่วง 09:00-17:00
    // - สร้าง start ทุก 30 นาที
    // - แต่ละ slot มี duration 2 ชั่วโมง (120 นาที)
    // - Mark บางช่วงเป็น unavailable เพื่อเดโม
    const base = new Date(`${dateIso}T09:00:00`);
    const lastStart = new Date(`${dateIso}T15:00:00`); // 15:00 + 2h = 17:00

    const res: TimeSlot[] = [];
    let cur = base;
    let i = 0;
    while (cur <= lastStart) {
      const end = addMinutes(cur, 120);
      const available = (i % 3 !== 0); // ปิดทุกๆ 3 ช่อง
      res.push({
        start: toIso(cur),
        end: toIso(end),
        durationMins: 120,
        available,
      });
      cur = addMinutes(cur, 30);
      i++;
    }
    return res;
  }, []);

  const fetchSlots = useCallback((dateIso: string, trainerUsername: string) => {
    setLoading(true);
    setError(null);
    // simulate fetch
    setTimeout(() => {
      try {
        const slots = generateSlots(dateIso, trainerUsername);
        setAvailableSlots(slots);
        setLoading(false);
      } catch (e: any) {
        setError('Failed to load slots');
        setAvailableSlots([]);
        setLoading(false);
      }
    }, 200);
  }, [generateSlots]);

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