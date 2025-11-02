// Customer Log Types - ตรงตาม Data Dictionary ตาราง CUSTOMER_LOG
// ตารางสำหรับบันทึกเหตุการณ์ต่างๆ ที่ลูกค้ากระทำในระบบ

// Log Type Enum
export type LogType = 'CHECK_IN' | 'CHECK_OUT' | 'BOOK_SESSION' | 'CANCEL_SESSION';

// Database Customer Log Type - ตรงตาม Data Dictionary ตาราง CUSTOMER_LOG
export type DbCustomerLog = {
  Log_Id: number;                        // Primary Key (SERIAL)
  Customer_Username: string;             // FK → CUSTOMER(Username)
  Timestamp: string;                     // เวลาเกิดเหตุการณ์ (ISO timestamp)
  Log_Type: LogType;                     // ประเภทเหตุการณ์
};

// Customer Log interface สำหรับแสดงผลใน UI
export interface CustomerLog {
  logId: number;
  customerUsername: string;
  customerName?: string;                 // จาก USER table
  timestamp: string;                     // ISO timestamp
  logType: LogType;
  logTypeName: string;                   // แปลเป็นภาษาไทย
  date: string;                          // วันที่ (YYYY-MM-DD) จาก timestamp
  time: string;                          // เวลา (HH:MM) จาก timestamp
  description?: string;                  // คำอธิบายเพิ่มเติม
}

// Customer Log Create DTO
export type CreateCustomerLogDto = {
  Customer_Username: string;
  Log_Type: LogType;
  Timestamp?: string;                    // default วันเวลาปัจจุบัน
};

// Filter และ Sort สำหรับการค้นหา
export type CustomerLogFilter = {
  customerUsername?: string;
  logType?: LogType;
  dateFrom?: string;                     // YYYY-MM-DD
  dateTo?: string;                       // YYYY-MM-DD
  timestampFrom?: string;                // ISO timestamp
  timestampTo?: string;                  // ISO timestamp
};

export type CustomerLogSort = {
  field: 'Log_Id' | 'Customer_Username' | 'Timestamp' | 'Log_Type';
  direction: 'asc' | 'desc';
};

// Log Type Names mapping
export const LOG_TYPE_NAMES: Record<LogType, string> = {
  CHECK_IN: 'เข้าใช้บริการ',
  CHECK_OUT: 'ออกจากศูนย์ฟิตเนส',
  BOOK_SESSION: 'จองเซสชัน',
  CANCEL_SESSION: 'ยกเลิกการจอง'
};

// Customer Activity Summary
export interface CustomerActivitySummary {
  customerUsername: string;
  customerName?: string;
  totalLogs: number;
  checkInCount: number;
  checkOutCount: number;
  bookSessionCount: number;
  cancelSessionCount: number;
  lastActivity?: CustomerLog;
  firstActivity?: CustomerLog;
  averageSessionsPerWeek?: number;
  averageVisitsPerWeek?: number;
}

// Daily Activity Report
export interface DailyActivityReport {
  date: string;                          // YYYY-MM-DD
  totalActivities: number;
  checkInCount: number;
  checkOutCount: number;
  bookSessionCount: number;
  cancelSessionCount: number;
  uniqueCustomers: number;
  activities: CustomerLog[];
}

// Check-in/Check-out specific DTOs
export type CheckInDto = {
  customerUsername: string;
  timestamp?: string;                    // ISO timestamp, default now
};

export type CheckOutDto = {
  customerUsername: string;
  timestamp?: string;                    // ISO timestamp, default now
};

// Session booking specific DTOs
export type BookSessionLogDto = {
  customerUsername: string;
  sessionId?: number;                    // Customer Session ID ที่จอง
  scheduleId?: number;                   // Training Schedule ID ที่สร้าง
  timestamp?: string;                    // ISO timestamp, default now
};

export type CancelSessionLogDto = {
  customerUsername: string;
  sessionId?: number;                    // Customer Session ID ที่ยกเลิก
  scheduleId?: number;                   // Training Schedule ID ที่ยกเลิก
  timestamp?: string;                    // ISO timestamp, default now
};

// Log Analytics Types
export interface LogAnalytics {
  totalLogs: number;
  logsByType: Record<LogType, number>;
  logsByHour: Record<string, number>;    // '00' to '23'
  logsByDay: Record<string, number>;     // 'monday' to 'sunday'
  logsByMonth: Record<string, number>;   // '2025-01' to '2025-12'
  topActiveCustomers: Array<{
    customerUsername: string;
    customerName?: string;
    activityCount: number;
  }>;
}
