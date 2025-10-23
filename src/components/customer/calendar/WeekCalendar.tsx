import React from 'react';
import { useWeekRange } from '@/hooks/useWeekRange';
import { useCalendarData } from '@/hooks/useCalendarData';
import TrainerSelect from './TrainerSelect';
import DateSwitcher from './DateSwitcher';
import SlotList from './SlotList';
import BookingSheet from './BookingSheet';
import Filters from './Filters';
import './calendar.css';

const WeekCalendar = () => {
  const { startDate, endDate, setSelectedDate } = useWeekRange();
  const { trainers, availableSlots, loading } = useCalendarData(startDate, endDate);

  return (
    <div className="week-calendar">
      <TrainerSelect trainers={trainers} />
      <DateSwitcher startDate={startDate} endDate={endDate} onDateChange={setSelectedDate} />
      <Filters />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <SlotList slots={availableSlots} />
      )}
      <BookingSheet />
    </div>
  );
};

export default WeekCalendar;