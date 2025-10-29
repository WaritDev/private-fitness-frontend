// Calendar Types - อัปเดตให้ใช้ types ใหม่จาก training-schedule
// Re-export จาก files ใหม่เพื่อ backward compatibility

export type { 
  TimeSlot, 
  BookingDetails 
} from './training-schedule';

export type WeekRange = {
  start: string; // Start date of the week in ISO format
  end: string;   // End date of the week in ISO format
};