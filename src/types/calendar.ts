export type TimeSlot = {
  start: string;         // ISO string
  end: string;           // ISO string
  durationMins: number;  // always 120 for 2-hour session
  available: boolean;
};

export type BookingDetails = {
  selectedDate: string | null; // ISO date (day) e.g. 2025-10-23
  selectedTrainer?: string | null;
  selectedSlot?: TimeSlot | null;
};

export type WeekRange = {
  start: string; // Start date of the week in ISO format
  end: string;   // End date of the week in ISO format
};