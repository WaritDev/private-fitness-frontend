// Training Schedule Types - ตรงตาม Data Dictionary ตาราง TRAINING_SCHEDULE
// ตารางปฏิทินกลางสำหรับบันทึก Event ทุกประเภทของเทรนเนอร์ (แทนที่ DAY_OFF เดิม)

// Schedule Type Enum
export type ScheduleType = 'APPOINTMENT' | 'DAY_OFF' | 'BREAK' | 'HOLIDAY';

// Database Training Schedule Type - ตรงตาม Data Dictionary ตาราง TRAINING_SCHEDULE
export type DbTrainingSchedule = {
  Schedule_Id: number;                   // Primary Key (SERIAL)
  Trainer_Username: string;              // FK → USER(Username)
  Customer_Username?: string;            // FK → CUSTOMER(Username) - NULL ถ้า Schedule_Type ไม่ใช่ APPOINTMENT
  Session_Id?: number;                   // FK → CUSTOMER_SESSION(Session_Id) - NULL ถ้า Schedule_Type ไม่ใช่ APPOINTMENT
  Start_Time: string;                    // เวลาเริ่มต้น (ISO timestamp)
  End_Time: string;                      // เวลาสิ้นสุด (ISO timestamp)
  Schedule_Type: ScheduleType;           // ประเภทการจองเวลา
  Created_At: string;                    // วันที่สร้างข้อมูล (ISO timestamp)
  Updated_At: string;                    // วันที่แก้ไขล่าสุด (ISO timestamp)
};

// Training Schedule interface สำหรับแสดงผลใน UI
export interface TrainingSchedule {
  scheduleId: number;
  trainerUsername: string;
  trainerName?: string;                  // จาก USER table
  customerUsername?: string;
  customerName?: string;                 // จาก USER table (ถ้ามี)
  sessionId?: number;
  startTime: string;                     // ISO timestamp
  endTime: string;                       // ISO timestamp
  scheduleType: ScheduleType;
  duration: number;                      // คำนวณจาก endTime - startTime (นาที)
  date: string;                          // วันที่ (YYYY-MM-DD) จาก startTime
  timeSlot: string;                      // เช่น "09:00 - 11:00"
  title?: string;                        // สร้างจาก scheduleType และ customerName
  createdAt: string;
  updatedAt: string;
}

// Schedule Create/Update DTOs
export type CreateTrainingScheduleDto = {
  Trainer_Username: string;
  Customer_Username?: string;            // Required ถ้า Schedule_Type = 'APPOINTMENT'
  Session_Id?: number;                   // Required ถ้า Schedule_Type = 'APPOINTMENT'
  Start_Time: string;                    // ISO timestamp
  End_Time: string;                      // ISO timestamp
  Schedule_Type: ScheduleType;
};

export type UpdateTrainingScheduleDto = {
  Customer_Username?: string;
  Session_Id?: number;
  Start_Time?: string;
  End_Time?: string;
  Schedule_Type?: ScheduleType;
};

// Schedule Filter และ Sort สำหรับการค้นหา
export type TrainingScheduleFilter = {
  trainerUsername?: string;
  customerUsername?: string;
  scheduleType?: ScheduleType;
  dateFrom?: string;                     // YYYY-MM-DD
  dateTo?: string;                       // YYYY-MM-DD
  startTimeFrom?: string;                // ISO timestamp
  startTimeTo?: string;                  // ISO timestamp
  hasCustomer?: boolean;                 // มี customerUsername หรือไม่
};

export type TrainingScheduleSort = {
  field: 'Schedule_Id' | 'Start_Time' | 'End_Time' | 'Schedule_Type' | 'Created_At';
  direction: 'asc' | 'desc';
};

// Calendar Event interface (สำหรับแสดงใน Calendar component)
export interface CalendarEvent {
  id: number;                           // scheduleId
  title: string;
  start: Date | string;                 // startTime
  end: Date | string;                   // endTime
  resourceId?: string;                  // trainerUsername
  backgroundColor?: string;             // สีตาม scheduleType
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    scheduleType: ScheduleType;
    customerUsername?: string;
    customerName?: string;
    sessionId?: number;
    trainerUsername: string;
    trainerName?: string;
  };
}

// Time Slot interface (สำหรับแสดงช่วงเวลาว่าง)
export interface TimeSlot {
  start: string;                        // ISO timestamp
  end: string;                          // ISO timestamp
  durationMins: number;                 // ระยะเวลา (นาที)
  available: boolean;                   // ว่างหรือไม่
  scheduleId?: number;                  // ถ้าไม่ว่าง
  scheduleType?: ScheduleType;          // ประเภทการจอง
  bookedBy?: string;                    // username ของคนที่จอง (ถ้ามี)
  isOwn?: boolean;                      // true = จองโดยตัวเอง, false = คนอื่นจอง
}

// Booking Request DTO
export type BookingRequestDto = {
  trainerUsername: string;
  customerUsername: string;
  sessionId: number;                    // Customer Session ที่จะใช้
  startTime: string;                    // ISO timestamp
  endTime: string;                      // ISO timestamp
};

// Booking Details (backward compatibility)
export type BookingDetails = {
  selectedDate: string | null;          // ISO date (day) e.g. 2025-10-23
  selectedTrainer?: string | null;
  selectedSlot?: TimeSlot | null;
};
