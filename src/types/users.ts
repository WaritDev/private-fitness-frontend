// User Role Types - ตรงตาม Data Dictionary
export type UserRole = "CUSTOMER" | "TRAINER" | "SALES" | "MANAGER" | "ADMIN";

// Gender Types - ตรงตาม Data Dictionary  
export type Gender = "Male" | "Female" | "Other";

// Database User Type - ตรงตาม Data Dictionary ตาราง USER
export type DbUser = {
  Username: string;                    // Primary Key
  Password: string;                    // Hashed password
  Role: UserRole;                      // ENUM
  First_Name: string;                  // ชื่อจริง
  Last_Name: string;                   // นามสกุล
  Gender?: Gender;                     // เพศ (nullable)
  Date_of_Birth?: string;              // วันเกิด YYYY-MM-DD (nullable)
  Phone_Number?: string;               // เบอร์โทรศัพท์ (unique, nullable)
  Gmail: string;                       // อีเมล (unique, not null)
  Specialty?: string;                  // ความเชี่ยวชาญ สำหรับ TRAINER เท่านั้น
  Is_Active: boolean;                  // สถานะการใช้งาน (default true)
  Created_At: string;                  // วันที่สร้างข้อมูล (ISO timestamp)
  Updated_At: string;                  // วันที่แก้ไขล่าสุด (ISO timestamp)
};

// User interface สำหรับแสดงผลใน UI
export interface User {
  username: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  role: UserRole;
  gender?: Gender;
  dateOfBirth?: string;
  phoneNumber?: string;
  specialty?: string;                  // สำหรับ trainer
  isActive: boolean;
  profileUrl?: string;
}

// Auth User type สำหรับ JWT payload และ authentication
export type AuthUser = { 
  sub: string;                         // Username (subject)
  role: UserRole; 
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
};

// Auth Context Value สำหรับ React Context
export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isTrainer: boolean;
  isSales: boolean;
  isCustomer: boolean;
  hasAnyRole: (...roles: UserRole[]) => boolean;
};

// User Create/Update DTOs
export type CreateUserDto = {
  Username: string;
  Password: string;
  Role: UserRole;
  First_Name: string;
  Last_Name: string;
  Gender?: Gender;
  Date_of_Birth?: string;
  Phone_Number?: string;
  Gmail: string;
  Specialty?: string;
};

export type UpdateUserDto = Partial<Omit<CreateUserDto, 'Username'>>;