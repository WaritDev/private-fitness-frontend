'use client';

import React, { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventContentArg, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { Box, Alert, CircularProgress, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid';
import EventList from './EventList';

type Slot = {
  id: number;
  startTime: string;
  endTime: string;
  trainer: { username: string; name: string };
};

function toTimeRange(startISO: string, endISO: string) {
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const s = new Date(startISO);
  const e = new Date(endISO);
  return `${fmt(s)} - ${fmt(e)}`;
}

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarWithList({ trainerUsername }: { trainerUsername?: string }) {
  const [selectedDate, setSelectedDate] = useState<string>(toYMD(new Date()));
  const calRef = useRef<FullCalendar | null>(null);
  const [rangeSlots, setRangeSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; type: 'success' | 'error' }>({ open: false, msg: '', type: 'success' });

  // โหลด slots ตามช่วงวันที่ที่ Calendar แสดง (เดือนที่มองเห็น)
  async function loadRange(start: string, end: string) {
    setLoading(true);
    try {
      const base = trainerUsername
        ? `/api/trainer/${encodeURIComponent(trainerUsername)}/schedule`
        : `/api/schedule`;
      const res = await fetch(`${base}?start=${start}&end=${end}`, { cache: 'no-store' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed to load schedule');
      setRangeSlots(j.items ?? []);
    } catch (e: any) {
      setRangeSlots([]);
      setSnack({ open: true, msg: e.message || 'โหลดตารางไม่สำเร็จ', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // ให้ FullCalendar แจ้งช่วงวันที่ปัจจุบันทุกครั้งที่เปลี่ยนเดือน/โหลดครั้งแรก
  const onDatesSet = async (arg: DatesSetArg) => {
    await loadRange(toYMD(arg.start), toYMD(arg.end));
  };

  const handleDateClick = (arg: { dateStr: string }) => setSelectedDate(arg.dateStr);
  const handleEventClick = (info: EventClickArg) => setSelectedDate(info.event.startStr.slice(0, 10));

  // อีเวนต์ของ Calendar = ทั้งช่วงที่โหลดมา
  const fcEvents = useMemo(
    () =>
      rangeSlots.map((s) => ({
        id: String(s.id),
        title: s.trainer.name,
        start: s.startTime,
        end: s.endTime,
        allDay: false,
        extendedProps: { slot: s },
      })),
    [rangeSlots]
  );

  // ปรับหน้าตา event: เวลา + ชื่อเทรนเนอร์
  const renderEventContent = (arg: EventContentArg) => (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 600 }}>{arg.timeText}</span>
      <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={arg.event.title}>
        {arg.event.title}
      </span>
    </div>
  );

  // Events สำหรับ EventList ด้านขวา = เฉพาะวันที่เลือก
  const listEvents = useMemo(
    () =>
      rangeSlots
        .filter((s) => s.startTime.slice(0, 10) === selectedDate)
        .map((s) => ({
          id: s.id,
          title: `Trainer: ${s.trainer.name}`,
          time: toTimeRange(s.startTime, s.endTime),
          trainer: s.trainer,
        })),
    [rangeSlots, selectedDate]
  );

  // จองคิว
  async function handleBook(scheduleId: number) {
    try {
      const res = await fetch('/api/schedule/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scheduleId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'จองไม่สำเร็จ');

      setSnack({ open: true, msg: 'จองนัดหมายสำเร็จ', type: 'success' });
      // reload เฉพาะช่วงที่เห็นอยู่
      const api = (calRef.current as any)?.getApi?.();
      if (api) {
        await loadRange(toYMD(api.view.activeStart), toYMD(api.view.activeEnd));
      }
    } catch (e: any) {
      setSnack({ open: true, msg: e.message || 'จองไม่สำเร็จ', type: 'error' });
    }
  }

  return (
    <Grid container spacing={2}>
      {/* Calendar (Left) */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Box sx={{ borderRadius: 2, boxShadow: 2, p: 2, bgcolor: 'white', minHeight: 420, position: 'relative' }}>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 2 }}>
              <CircularProgress />
            </Box>
          )}
          <FullCalendar
            ref={calRef as any}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={selectedDate}
            datesSet={onDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            events={fcEvents}
            height="auto"
            dayMaxEventRows={3}
            displayEventTime
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false, meridiem: false }}
            eventContent={renderEventContent}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          />
        </Box>
      </Grid>

      {/* Event List (Right) */}
      <Grid size={{ xs: 12, md: 5 }}>
        <EventList date={selectedDate} events={listEvents as any} onBook={handleBook} />
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.type} variant="filled" onClose={() => setSnack((p) => ({ ...p, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Grid>
  );
}