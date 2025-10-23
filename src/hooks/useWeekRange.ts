'use client';

import { useMemo, useState, useCallback } from 'react';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function useWeekRange(base?: Date) {
  const [baseDate, setBaseDate] = useState<Date>(base ? startOfDay(base) : startOfDay(new Date()));

  // เริ่มสัปดาห์วันนี้ + 6 วัน (โชว์ 7 วันถัดไป)
  const startDate = useMemo(() => startOfDay(baseDate), [baseDate]);
  const endDate = useMemo(() => addDays(startDate, 6), [startDate]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(startDate, i)), [startDate]);

  const nextWeek = useCallback(() => setBaseDate((d) => addDays(d, 7)), []);
  const prevWeek = useCallback(() => setBaseDate((d) => addDays(d, -7)), []);
  const setWeekBase = useCallback((d: Date) => setBaseDate(startOfDay(d)), []);

  return { startDate, endDate, days, nextWeek, prevWeek, setWeekBase };
}
export default useWeekRange;