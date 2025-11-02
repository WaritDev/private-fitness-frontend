// Customer Session Types - ตรงตาม Data Dictionary ตาราง CUSTOMER_SESSION
// Transaction สำหรับบันทึกการซื้อแพ็กเกจแบบนับจำนวนครั้ง

import { MembershipStatus } from './product';

// Session Status (เพิ่ม COMPLETED สำหรับเซสชัน)
export type SessionStatus = 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';

// Database Customer Session Type - ตรงตาม Data Dictionary ตาราง CUSTOMER_SESSION
export type DbCustomerSession = {
  Session_Id: number;                    // Primary Key (SERIAL)
  Customer_Username: string;             // FK → CUSTOMER(Username)
  Trainer_Username: string;              // FK → USER(Username)
  Product_Id: number;                    // FK → PRODUCTS(Product_Id)
  Sales_Username: string;                // FK → USER(Username)
  Purchase_Date: string;                 // วันที่ซื้อ (YYYY-MM-DD)
  Total_Sessions: number;                // จำนวนครั้งที่ซื้อทั้งหมด
  Used_Sessions: number;                 // จำนวนครั้งที่ใช้ไป (default 0)
  Price_Paid: number;                    // ราคาที่จ่ายจริง
  Discount_Amount: number;               // จำนวนเงินส่วนลด (default 0)
  Status: SessionStatus;                 // สถานะของแพ็กเกจ
  Created_At: string;                    // วันที่สร้างข้อมูล (ISO timestamp)
  Updated_At: string;                    // วันที่แก้ไขล่าสุด (ISO timestamp)
};

// Customer Session interface สำหรับแสดงผลใน UI
export interface CustomerSession {
  sessionId: number;
  customerUsername: string;
  customerName?: string;                 // จาก USER table
  trainerUsername: string;
  trainerName?: string;                  // จาก USER table
  productId: number;
  productName?: string;                  // จาก PRODUCTS table
  salesUsername: string;
  salesName?: string;                    // จาก USER table
  purchaseDate: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;             // totalSessions - usedSessions
  pricePaid: number;
  discountAmount: number;
  finalPrice: number;                    // pricePaid - discountAmount
  pricePerSession: number;               // finalPrice / totalSessions
  status: SessionStatus;
  isCompleted?: boolean;                 // usedSessions >= totalSessions
  createdAt: string;
  updatedAt: string;
}

// Session Membership สำหรับแสดงใน Customer UI
export type SessionMembership = {
  title: string;                         // เช่น 20 Personal Training Sessions
  totalSessions: number;
  usedSessions: number;
  status: MembershipStatus;
  sessionId?: number;                    // เพิ่มเพื่อ reference
  remainingSessions?: number;
  trainerName?: string;
  isCompleted?: boolean;
};

// Customer Session Create/Update DTOs
export type CreateCustomerSessionDto = {
  Customer_Username: string;
  Trainer_Username: string;
  Product_Id: number;
  Sales_Username: string;
  Purchase_Date?: string;                // default วันปัจจุบัน
  Total_Sessions: number;
  Used_Sessions?: number;                // default 0
  Price_Paid: number;
  Discount_Amount?: number;              // default 0
  Status?: SessionStatus;                // default 'ACTIVE'
};

export type UpdateCustomerSessionDto = {
  Trainer_Username?: string;
  Total_Sessions?: number;
  Used_Sessions?: number;
  Price_Paid?: number;
  Discount_Amount?: number;
  Status?: SessionStatus;
};

// Session Registration Data (backward compatibility)
export type SessionRegistrationData = {
  Price_Paid: number;
  Discount_Amount?: number;
  Trainer_Username?: string;
  // optional fields (เผื่อ step อื่นใช้อยู่)
  Purchase_Date?: string;
  Sales_Username?: string;
  Start_Date?: string;
  End_Date?: string;
  Session_Id?: string;
  Customer_Username?: string;
  Product_Id?: string;
  Status?: string;
  Used_Sessions?: number;
  Total_Sessions?: number;
};

// Filter และ Sort สำหรับการค้นหา
export type CustomerSessionFilter = {
  customerUsername?: string;
  trainerUsername?: string;
  productId?: number;
  salesUsername?: string;
  status?: SessionStatus;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  hasRemainingSessions?: boolean;       // remainingSessions > 0
  isCompleted?: boolean;                // usedSessions >= totalSessions
};

export type CustomerSessionSort = {
  field: 'Session_Id' | 'Purchase_Date' | 'Total_Sessions' | 'Used_Sessions' | 'Price_Paid' | 'Status';
  direction: 'asc' | 'desc';
};

// Session Usage DTO สำหรับการใช้งานเซสชัน
export type SessionUsageDto = {
  sessionId: number;
  usedSessions: number;                 // จำนวนเซสชันที่ใช้เพิ่มขึ้น (ปกติคือ 1)
  notes?: string;                       // หมายเหตุการใช้งาน
};
