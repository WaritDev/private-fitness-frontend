import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { Slot } from '@/types/calendar';

interface BookingSheetProps {
  selectedSlot: Slot | null;
  onConfirmBooking: (slotId: number) => void;
}

const BookingSheet: React.FC<BookingSheetProps> = ({ selectedSlot, onConfirmBooking }) => {
  if (!selectedSlot) {
    return (
      <Box sx={{ padding: 2, textAlign: 'center' }}>
        <Typography variant="h6">Please select a time slot to book.</Typography>
      </Box>
    );
  }

  const handleBooking = () => {
    onConfirmBooking(selectedSlot.id);
  };

  return (
    <Box sx={{ padding: 2, border: '1px solid #ccc', borderRadius: 2 }}>
      <Typography variant="h6">Booking Details</Typography>
      <Typography variant="body1">Trainer: {selectedSlot.trainer.name}</Typography>
      <Typography variant="body1">Time: {selectedSlot.startTime} - {selectedSlot.endTime}</Typography>
      <Typography variant="body1">Duration: {selectedSlot.duration} minutes</Typography>
      <Button variant="contained" color="primary" onClick={handleBooking}>
        Confirm Booking
      </Button>
    </Box>
  );
};

export default BookingSheet;