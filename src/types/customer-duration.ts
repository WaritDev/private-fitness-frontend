// Customer Duration Types - ตรงตาม Data Dictionary ตาราง CUSTOMER_DURATION
// Transaction สำหรับบันทึกการซื้อสมาชิกแบบมีระยะเวลา

import { MembershipStatus } from './product';

// Database Customer Duration Type - ตรงตาม Data Dictionary ตาราง CUSTOMER_DURATION
export type DbCustomerDuration = {
  Duration_Id: number;                   // Primary Key (SERIAL)
  Customer_Username: string;             // FK → CUSTOMER(Username)
  Product_Id: number;                    // FK → PRODUCTS(Product_Id)
  Sales_Username: string;                // FK → USER(Username)
  Purchase_Date: string;                 // วันที่ซื้อ (YYYY-MM-DD)
  Start_Date: string;                    // วันที่สมาชิกเริ่มต้น (YYYY-MM-DD)
  End_Date: string;                      // วันที่สมาชิกสิ้นสุด (YYYY-MM-DD)
  Price_Paid: number;                    // ราคาที่จ่ายจริง
  Discount_Amount: number;               // จำนวนเงินส่วนลด (default 0)
  Status: MembershipStatus;              // สถานะของสมาชิก
  Created_At: string;                    // วันที่สร้างข้อมูล (ISO timestamp)
  Updated_At: string;                    // วันที่แก้ไขล่าสุด (ISO timestamp)
};

// Customer Duration interface สำหรับแสดงผลใน UI
export interface CustomerDuration {
  durationId: number;
  customerUsername: string;
  customerName?: string;                 // จาก USER table
  productId: number;
  productName?: string;                  // จาก PRODUCTS table
  salesUsername: string;
  salesName?: string;                    // จาก USER table
  purchaseDate: string;
  startDate: string;
  endDate: string;
  pricePaid: number;
  discountAmount: number;
  finalPrice: number;                    // pricePaid - discountAmount
  status: MembershipStatus;
  daysRemaining?: number;                // คำนวณจาก endDate
  isExpired?: boolean;                   // คำนวณจาก endDate
  createdAt: string;
  updatedAt: string;
}

// Duration Membership สำหรับแสดงใน Customer UI
export type DurationMembership = {
  title: string;                         // เช่น Pro Yearly Membership
  endDate: string;                       // ISO e.g. 2026-12-31T00:00:00Z or YYYY-MM-DD
  status: MembershipStatus;
  durationId?: number;                   // เพิ่มเพื่อ reference
  daysRemaining?: number;
  isExpired?: boolean;
};

// Customer Duration Create/Update DTOs
export type CreateCustomerDurationDto = {
  Customer_Username: string;
  Product_Id: number;
  Sales_Username: string;
  Purchase_Date?: string;                // default วันปัจจุบัน
  Start_Date: string;
  End_Date: string;
  Price_Paid: number;
  Discount_Amount?: number;              // default 0
  Status?: MembershipStatus;             // default 'ACTIVE'
};

export type UpdateCustomerDurationDto = {
  Start_Date?: string;
  End_Date?: string;
  Price_Paid?: number;
  Discount_Amount?: number;
  Status?: MembershipStatus;
};

// Duration Registration Data (backward compatibility)
export type DurationRegistrationData = {
  Price_Paid: number;
  Discount_Amount?: number;
  // optional fields
  Purchase_Date?: string;
  Sales_Username?: string;
  Start_Date?: string;
  End_Date?: string;
  Customer_Username?: string;
  Product_Id?: string;
  Status?: string;
};

// Filter และ Sort สำหรับการค้นหา
export type CustomerDurationFilter = {
  customerUsername?: string;
  productId?: number;
  salesUsername?: string;
  status?: MembershipStatus;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  isExpired?: boolean;
};

export type CustomerDurationSort = {
  field: 'Duration_Id' | 'Purchase_Date' | 'Start_Date' | 'End_Date' | 'Price_Paid' | 'Status';
  direction: 'asc' | 'desc';
};
