// Product Types - ตรงตาม Data Dictionary ตาราง PRODUCTS
// แทนที่ DURATION_TYPE และ SESSION_TYPE เดิม

// Product Type และ Category Enums
export type ProductType = 'DURATION' | 'SESSION';
export type ProductCategory = 'Economy' | 'Business' | 'First_Class';

// Database Product Type - ตรงตาม Data Dictionary ตาราง PRODUCTS
export type DbProduct = {
  Product_Id: number;                    // Primary Key (SERIAL)
  Name: string;                          // ชื่อสินค้า/แพ็กเกจ
  Product_Type: ProductType;             // ประเภทหลักของสินค้า
  Product_Category?: ProductCategory;    // หมวดหมู่สินค้า (nullable)
  List_Price: number;                    // ราคาตั้งต้น (ราคาปกติ)
  Duration_Days?: number;                // จำนวนวันสมาชิก (สำหรับ DURATION)
  Session_Amount?: number;               // จำนวนครั้งในแพ็กเกจ (สำหรับ SESSION)
  Is_Active: boolean;                    // สถานะการวางขาย
  Created_At: string;                    // วันที่สร้างข้อมูล (ISO timestamp)
  Updated_At: string;                    // วันที่แก้ไขล่าสุด (ISO timestamp)
};

// Product interface สำหรับแสดงผลใน UI
export interface Product {
  productId: number;
  name: string;
  productType: ProductType;
  productCategory?: ProductCategory;
  listPrice: number;
  price: number;                         // mapped from List_Price
  durationDays?: number;
  sessionAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Status Types สำหรับสมาชิกภาพ
export type MembershipStatus = 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED' | 'COMPLETED';

// Gender Type (ย้ายมาจากเดิม)
export type Gender = '' | 'Male' | 'Female' | 'Other';

// Customer Base Info สำหรับการลงทะเบียน
export type CustomerBaseInfo = {
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string | null; // YYYY-MM-DD or null
  phone: string;
  email: string | null;
};

// Credentials สำหรับการสร้างบัญชี
export type Credentials = {
  username: string;
  password: string;
};

// Purchase Request DTOs
export type DurationPurchaseRequest = {
  productId: number;
  customerUsername: string;
  pricePaid: number;
  discountAmount: number;
  salesUsername?: string;
  startDate?: string;                    // YYYY-MM-DD
};

export type SessionPurchaseRequest = {
  productId: number;
  customerUsername: string;
  pricePaid: number;
  discountAmount: number;
  trainerUsername: string;
  salesUsername?: string;
};

// Duration Product DTO (backward compatibility)
export type Duration = {
  Name: string;
  Price: number;
  Duration_Days: number;
  Product_Category: ProductCategory;
};

// Product Create/Update DTOs
export type CreateProductDto = {
  Name: string;
  Product_Type: ProductType;
  Product_Category?: ProductCategory;
  List_Price: number;
  Duration_Days?: number;                // Required if Product_Type = 'DURATION'
  Session_Amount?: number;               // Required if Product_Type = 'SESSION'
  Is_Active?: boolean;
};

export type UpdateProductDto = Partial<Omit<CreateProductDto, 'Product_Type'>>;

// Product Filter และ Sort สำหรับการค้นหา
export type ProductFilter = {
  productType?: ProductType;
  productCategory?: ProductCategory;
  isActive?: boolean;
  priceMin?: number;
  priceMax?: number;
};

export type ProductSort = {
  field: 'Product_Id' | 'Name' | 'List_Price' | 'Created_At';
  direction: 'asc' | 'desc';
};
