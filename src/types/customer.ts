// Customer Types - ตรงตาม Data Dictionary ตาราง CUSTOMER
// เชื่อมต่อแบบ 1:1 กับตาราง USER

// Database Customer Type - ตรงตาม Data Dictionary ตาราง CUSTOMER
export type DbCustomer = {
  Username: string;                      // Primary Key, FK → USER(Username)
  Health_Info?: string;                  // ข้อมูลสุขภาพที่สำคัญ
  Address?: string;                      // ที่อยู่ (อาจเก็บเป็น JSON)
  Company_Name?: string;                 // ชื่อบริษัทที่ทำงาน
  Company_Position?: string;             // ตำแหน่งงาน
  Marital_Status?: string;               // สถานภาพ
  Emergency_Contact_Name?: string;       // ชื่อผู้ติดต่อฉุกเฉิน
  Emergency_Contact_Relationship?: string; // ความสัมพันธ์
  Emergency_Contact_Phone?: string;      // เบอร์โทรผู้ติดต่อฉุกเฉิน
  Marketing_Source?: string;             // ช่องทางที่รู้จักฟิตเนส
};

// Customer interface สำหรับแสดงผลใน UI (รวมข้อมูลจาก USER และ CUSTOMER)
export interface Customer {
  username: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: string;
  phoneNumber?: string;
  isActive: boolean;
  
  // ข้อมูลเฉพาะ Customer
  healthInfo?: string;
  address?: string;
  companyName?: string;
  companyPosition?: string;
  maritalStatus?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  marketingSource?: string;
}

// Customer Create/Update DTOs
export type CreateCustomerDto = {
  // ข้อมูล User (จะไปสร้างใน USER table)
  Username: string;
  Password: string;
  First_Name: string;
  Last_Name: string;
  Gender?: "Male" | "Female" | "Other";
  Date_of_Birth?: string;
  Phone_Number?: string;
  Gmail: string;
  
  // ข้อมูล Customer (จะไปสร้างใน CUSTOMER table)
  Health_Info?: string;
  Address?: string;
  Company_Name?: string;
  Company_Position?: string;
  Marital_Status?: string;
  Emergency_Contact_Name?: string;
  Emergency_Contact_Relationship?: string;
  Emergency_Contact_Phone?: string;
  Marketing_Source?: string;
};

export type UpdateCustomerDto = {
  // ข้อมูล User ที่แก้ไขได้
  First_Name?: string;
  Last_Name?: string;
  Gender?: "Male" | "Female" | "Other";
  Date_of_Birth?: string;
  Phone_Number?: string;
  Gmail?: string;
  Is_Active?: boolean;
  
  // ข้อมูล Customer ที่แก้ไขได้
  Health_Info?: string;
  Address?: string;
  Company_Name?: string;
  Company_Position?: string;
  Marital_Status?: string;
  Emergency_Contact_Name?: string;
  Emergency_Contact_Relationship?: string;
  Emergency_Contact_Phone?: string;
  Marketing_Source?: string;
};

// สำหรับการค้นหาและกรองข้อมูล
export type CustomerFilter = {
  isActive?: boolean;
  gender?: "Male" | "Female" | "Other";
  companyName?: string;
  marketingSource?: string;
};

// สำหรับการจัดเรียงข้อมูล
export type CustomerSort = {
  field: 'username' | 'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'companyName';
  direction: 'asc' | 'desc';
};
