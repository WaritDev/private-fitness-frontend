import React from 'react';
import { Slot } from '@/types/calendar';

type SlotListProps = {
  slots: Slot[];
  onBook: (slotId: number) => void;
};

const SlotList: React.FC<SlotListProps> = ({ slots, onBook }) => {
  return (
    <div className="slot-list">
      {slots.length === 0 ? (
        <p>No available slots for this date.</p>
      ) : (
        slots.map((slot) => (
          <div key={slot.id} className="slot-item">
            <span>{`${slot.startTime} - ${slot.endTime}`}</span>
            <button onClick={() => onBook(slot.id)}>Book</button>
          </div>
        ))
      )}
    </div>
  );
};

export default SlotList;