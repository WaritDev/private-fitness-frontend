// Trainer Availability Types - ตรงตาม Data Dictionary ตาราง TRAINER_AVAILABILITY
// ใช้เก็บ "ตารางเวร" หรือ "กฎเวลาทำงาน" ประจำสัปดาห์ของเทรนเนอร์

// Day of Week Enum
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// Database Trainer Availability Type - ตรงตาม Data Dictionary ตาราง TRAINER_AVAILABILITY
export type DbTrainerAvailability = {
  Availability_Id: number;              // Primary Key (SERIAL)
  Trainer_Username: string;              // FK → USER(Username)
  Day_of_Week: DayOfWeek;                // วันในสัปดาห์
  Start_Time: string;                    // เวลาที่เริ่มว่าง (HH:MM:SS format)
  End_Time: string;                      // เวลาที่สิ้นสุดความว่าง (HH:MM:SS format)
};

// Trainer Availability interface สำหรับแสดงผลใน UI
export interface TrainerAvailability {
  availabilityId: number;
  trainerUsername: string;
  trainerName?: string;                  // จาก USER table
  dayOfWeek: DayOfWeek;
  startTime: string;                     // HH:MM format
  endTime: string;                       // HH:MM format
  duration: number;                      // ระยะเวลา (นาที)
  timeSlot: string;                      // เช่น "09:00 - 18:00"
  dayName: string;                       // เช่น "จันทร์"
}

// Weekly Availability สำหรับแสดงตารางสัปดาห์
export interface WeeklyAvailability {
  trainerUsername: string;
  trainerName?: string;
  schedule: {
    [key in DayOfWeek]?: TrainerAvailability[];
  };
}

// Trainer Availability Create/Update DTOs
export type CreateTrainerAvailabilityDto = {
  Trainer_Username: string;
  Day_of_Week: DayOfWeek;
  Start_Time: string;                    // HH:MM:SS format
  End_Time: string;                      // HH:MM:SS format
};

export type UpdateTrainerAvailabilityDto = {
  Day_of_Week?: DayOfWeek;
  Start_Time?: string;
  End_Time?: string;
};

// Bulk Update DTO สำหรับอัปเดตตารางสัปดาห์ทั้งหมด
export type BulkUpdateAvailabilityDto = {
  trainerUsername: string;
  availabilities: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string;                   // HH:MM format
    endTime: string;                     // HH:MM format
  }>;
};

// Filter และ Sort สำหรับการค้นหา
export type TrainerAvailabilityFilter = {
  trainerUsername?: string;
  dayOfWeek?: DayOfWeek;
  startTimeAfter?: string;               // HH:MM format
  startTimeBefore?: string;              // HH:MM format
  endTimeAfter?: string;                 // HH:MM format
  endTimeBefore?: string;                // HH:MM format
};

export type TrainerAvailabilitySort = {
  field: 'Availability_Id' | 'Trainer_Username' | 'Day_of_Week' | 'Start_Time' | 'End_Time';
  direction: 'asc' | 'desc';
};

// Trainer Schedule สำหรับแสดงใน Calendar (รวม availability + actual schedule)
export interface TrainerSchedule {
  trainerUsername: string;
  trainerName?: string;
  availability: TrainerAvailability[];   // กฎเวลาทำงาน
  bookedSlots?: Array<{                  // เวลาที่ถูกจองแล้ว
    scheduleId: number;
    startTime: string;                   // ISO timestamp
    endTime: string;                     // ISO timestamp
    customerName?: string;
    scheduleType: string;
  }>;
  availableSlots?: Array<{               // เวลาที่ว่าง (คำนวณจาก availability - bookedSlots)
    start: string;                       // ISO timestamp
    end: string;                         // ISO timestamp
    durationMins: number;
  }>;
}

// Day Names mapping
export const DAY_NAMES: Record<DayOfWeek, string> = {
  MONDAY: 'จันทร์',
  TUESDAY: 'อังคาร',
  WEDNESDAY: 'พุธ',
  THURSDAY: 'พฤหัสบดี',
  FRIDAY: 'ศุกร์',
  SATURDAY: 'เสาร์',
  SUNDAY: 'อาทิตย์'
};

// Utility types สำหรับ backward compatibility กับ trainer.ts เดิม
export type Availability = {
  date: string;                          // YYYY-MM-DD format
  slots: Slot[];
};

export type Slot = {
  startTime: string;                     // ISO 8601 format
  endTime: string;                       // ISO 8601 format
  isBooked: boolean;
};

export type Trainer = {
  username: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  phone: string;
  specialty: string;
  availability: Availability[];
};
