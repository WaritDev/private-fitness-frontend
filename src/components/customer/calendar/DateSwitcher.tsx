import React from 'react';
import { format, addDays } from 'date-fns';

const DateSwitcher = ({ selectedDate, onDateChange }) => {
  const startOfWeek = new Date(selectedDate);
  const dates = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek, index));

  return (
    <div className="date-switcher">
      {dates.map((date) => (
        <button
          key={date.toISOString()}
          className={`date-button ${date.toDateString() === selectedDate.toDateString() ? 'active' : ''}`}
          onClick={() => onDateChange(date)}
        >
          {format(date, 'EEEE, MMM d')}
        </button>
      ))}
    </div>
  );
};

export default DateSwitcher;