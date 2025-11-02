# 🎫 Duration Package Registration Flow

> **Module**: Sales - Duration Package Registration  
> **Path**: `/sales/products/duration/[id]/regis`  
> **Use Cases**: 2S (Discount Offer) + 3S (Customer Info)  
> **Date**: October 31, 2025

---

## 📋 Overview

หน้าลงทะเบียนแพ็กเกจ Duration สำหรับพนักงานขาย (Sales) ในการขายแพ็กเกจรายเดือน/รายปีให้กับลูกค้าใหม่

### Flow Summary

```
Step 1: Discount Offer (Use Case 2S)
   ↓
Step 2: Customer Info (Use Case 3S)
   ↓
Step 3: Duration Details (Review)
   ↓
Step 4: Account Credentials
   ↓
Submit → Backend API → Order Summary Page
```

---

## 🎯 Use Cases Implemented

### Use Case 2S: เสนอส่วนลด (Discount Offer)

**Actor**: Sales  
**Description**: พนักงานขายเสนอส่วนลดให้ลูกค้า (สูงสุด 7%) เพื่อจูงใจให้ตัดสินใจซื้อ

**Fields**:
- **Discount Percent**: 0-7% (Number input)

**Validation**:
- ✅ ส่วนลดต้องอยู่ระหว่าง 0-7%
- ✅ คำนวณราคาหลังหักส่วนลดแบบ realtime

**Query Q2S.1**:
```sql
SELECT id, name, type, category, list_price, duration_days, 
       session_amount, payment_account_id, is_active, 
       created_at, updated_at
FROM products
WHERE is_active = TRUE
ORDER BY category, list_price ASC;
```

**Calculation**:
```typescript
const discountAmount = Math.round(basePrice * (discountPercent / 100));
const pricePaid = basePrice - discountAmount;
```

---

### Use Case 3S: กรอกข้อมูลสมาชิก (Customer Info)

**Actor**: Sales  
**Description**: พนักงานขายกรอกข้อมูลลูกค้าใหม่เพื่อสร้างบัญชีและเชื่อมโยงกับแพ็กเกจ

**Fields** (All Required except noted):

#### Basic Information
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| firstName | String | ✅ | Non-empty |
| lastName | String | ✅ | Non-empty |
| gender | Enum | ✅ | MALE \| FEMALE \| OTHER |
| dateOfBirth | Date | ✅ | YYYY-MM-DD, Age >= 14 |
| phone | String | ✅ | `^[0-9]{10}$` + Unique (Q3S.1) |
| email | String | ✅ | `^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$` + Unique (Q3S.2) |

#### Additional Information
| Field | Type | Required | Note |
|-------|------|----------|------|
| healthInfo | String | ❌ | Free text |
| address | String | ❌ | Free text |
| companyName | String | ❌ | - |
| companyPosition | String | ❌ | - |
| maritalStatus | Enum | ❌ | SINGLE \| MARRIED \| DIVORCED \| WIDOWED |
| marketingSource | String | ❌ | How they found us |

#### Emergency Contact
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| emergencyContactName | String | ✅ | Non-empty |
| emergencyContactRelationship | String | ✅ | Non-empty |
| emergencyContactPhone | String | ✅ | `^[0-9]{10}$` |

---

## 🔍 Validation Rules

### Frontend Validation (Regex)

#### Phone Number (Q3S.1)
```typescript
const PHONE_RE = /^[0-9]{10}$/;
```
- ต้องเป็นตัวเลข 10 หลักเท่านั้น
- ตัวอย่าง: `0812345678` ✅, `081-234-5678` ❌

#### Email (Q3S.2)
```typescript
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
```
- รูปแบบอีเมลมาตรฐาน
- ตัวอย่าง: `john@gmail.com` ✅, `john@` ❌

#### Date of Birth
```typescript
function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
```
- ต้องอายุ >= 14 ปี
- Format: `YYYY-MM-DD`

#### Username
```typescript
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
```
- ขึ้นต้นด้วยตัวอักษร (a-z, A-Z)
- มี 4-30 ตัวอักษร
- ประกอบด้วย a-z, A-Z, 0-9

#### Password
```typescript
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```
- อย่างน้อย 8 ตัวอักษร
- ต้องมี: lowercase (a-z), uppercase (A-Z), digit (0-9), special char (@$!%*?&)

---

### Backend Validation (API Calls)

#### Check Phone Duplicate (Q3S.1)

**API**: `GET /api/users/check-phone?phone={phone}`

**Query**:
```sql
SELECT COUNT(phone_number) as count
FROM users
WHERE phone_number = ?;
```

**Response**:
```json
{
  "status": "success",
  "result": {
    "exists": true,    // true = มีอยู่แล้ว (ไม่สามารถใช้ได้)
    "available": false
  }
}
```

**Implementation**:
```typescript
const res = await fetch(`${API_BASE_URL}/api/users/check-phone?phone=${s2.phone}`, {
  credentials: 'include',
});
const data = await res.json();
if (data.result?.exists) {
  e.phone = 'เบอร์โทรนี้ถูกใช้งานแล้ว';
}
```

---

#### Check Email Duplicate (Q3S.2)

**API**: `GET /api/users/check-gmail?gmail={email}`

**Query**:
```sql
SELECT COUNT(email) as count
FROM users
WHERE email = ?;
```

**Response**:
```json
{
  "status": "success",
  "result": {
    "exists": false,   // false = ยังไม่มี (สามารถใช้ได้)
    "available": true
  }
}
```

**Implementation**:
```typescript
const res = await fetch(`${API_BASE_URL}/api/users/check-gmail?gmail=${encodeURIComponent(s2.email)}`, {
  credentials: 'include',
});
const data = await res.json();
if (data.result?.exists) {
  e.email = 'อีเมลนี้ถูกใช้งานแล้ว';
}
```

---

## 📊 Stepper Structure

### Step 1: Discount Offer
**Purpose**: เสนอส่วนลด (Use Case 2S)

**UI Elements**:
- Input: Discount Percent (0-7%)
- Display: 
  - ราคาปกติ (Base Price)
  - ส่วนลด (Discount Amount)
  - ราคาหลังหักส่วนลด (Price Paid)

**Navigation**: Next → Step 2

---

### Step 2: Customer Info
**Purpose**: กรอกข้อมูลลูกค้า (Use Case 3S)

**Sections**:
1. **Basic Information**: First Name, Last Name, Gender, DOB, Phone, Email
2. **Additional Info**: Health Info, Address, Company, Position, Marital Status, Marketing Source
3. **Emergency Contact**: Name, Relationship, Phone

**Validation**: 
- ✅ Required fields check
- ✅ Regex validation (Phone, Email)
- ✅ Age >= 14 years
- ✅ Duplicate check (Phone, Email) via API

**Navigation**: Back | Next → Step 3

---

### Step 3: Duration Details
**Purpose**: Review package and pricing

**Display**:
- แพ็กเกจ: {productName}
- ระยะเวลา: {durationDays} วัน
- ราคาปกติ: {basePrice}
- ส่วนลด: {discountAmount}
- **ราคาที่ต้องชำระ: {pricePaid}**

**Navigation**: Back | Next → Step 4

---

### Step 4: Account Credentials
**Purpose**: สร้างบัญชีผู้ใช้

**Fields**:
- Username (4-30 chars, start with letter)
- Password (min 8 chars with complexity)
- Confirm Password (must match)

**Validation**:
- ✅ Username format check
- ✅ Password complexity check
- ✅ Password match check

**Navigation**: Back | Submit → Backend API

---

## 🚀 Submission Flow

### Payload Structure

```typescript
{
  // Account credentials
  username: string,
  password: string,
  confirmPassword: string,
  
  // Customer info (from Step 2)
  firstName: string,
  lastName: string,
  gender: 'MALE' | 'FEMALE' | 'OTHER',
  dateOfBirth: string, // YYYY-MM-DD
  phone: string,
  gmail: string,
  healthInfo: string,
  address: string,
  companyName: string,
  companyPosition: string,
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | '',
  emergencyContactName: string,
  emergencyContactRelationship: string,
  emergencyContactPhone: string,
  marketingSource: string,
  
  // Product & pricing (from Step 1 & 3)
  productId: number,
  pricePaid: number,
  discountAmount: number,
  
  // Sales info
  salesUsername: string, // TODO: Get from auth
  startDate: string, // Today (YYYY-MM-DD)
  durationDays: number
}
```

---

### API Endpoint

**Endpoint**: `POST /api/customers/durations/register`

**Request**:
```typescript
const response = await fetch(`${API_BASE_URL}/api/customers/durations/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(payload),
});
```

**Success Response (200 OK)**:
```json
{
  "status": "success",
  "status_code": 200,
  "message": "Customer duration registered successfully",
  "result": {
    "username": "cust09",
    "durationId": 109,
    "productId": 1,
    "salesUsername": "sales1",
    "startDate": "2025-11-01T00:00:00Z",
    "endDate": "2025-12-01T00:00:00Z",
    "durationDays": 30,
    "pricePaid": "1200.00",
    "discountAmount": "0.00",
    "message": "Customer duration registered successfully"
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "status": "error",
  "status_code": 400,
  "message": "USERNAME_ALREADY_EXISTS",
  "result": null
}
```

---

### Redirect Logic

```typescript
if (response.ok && data.status === 'success') {
  setSnack({ open: true, message: 'ลงทะเบียนสำเร็จ!', color: 'success' });
  setTimeout(() => {
    router.push('/customer/package/order-summary');
  }, 1500);
}
```

---

## 🧪 Testing Guide

### Test Case 1: Discount Offer (Step 1)

**Steps**:
1. เปิดหน้า `/sales/products/duration/1/regis`
2. กรอกส่วนลด: `5` (%)
3. ตรวจสอบ:
   - ✅ ราคาปกติแสดงถูกต้อง
   - ✅ ส่วนลดคำนวณถูกต้อง (5% ของราคาปกติ)
   - ✅ ราคาหลังหักส่วนลดถูกต้อง
4. กด "Next"
5. ตรวจสอบ: ✅ ไปหน้า Step 2

**Test Invalid Discount**:
- กรอก `-1` → แสดง error "ส่วนลดต้องอยู่ระหว่าง 0-7%"
- กรอก `8` → แสดง error "ส่วนลดต้องอยู่ระหว่าง 0-7%"

---

### Test Case 2: Customer Info - Required Fields (Step 2)

**Steps**:
1. อยู่ที่ Step 2
2. ไม่กรอกอะไรเลย กด "Next"
3. ตรวจสอบ: ✅ แสดง error ทุก required field:
   - ชื่อ, นามสกุล, เพศ, วันเกิด
   - เบอร์โทร, อีเมล
   - ชื่อผู้ติดต่อฉุกเฉิน, ความสัมพันธ์, เบอร์โทรผู้ติดต่อ

---

### Test Case 3: Phone Number Validation

**Test Valid Format**:
- กรอก `0812345678` → ✅ ผ่าน
- กรอก `081-234-5678` → ❌ "เบอร์โทรต้องเป็นตัวเลข 10 หลัก"
- กรอก `08123456789` (11 digits) → ❌ "เบอร์โทรต้องเป็นตัวเลข 10 หลัก"

**Test Duplicate Check**:
1. กรอกเบอร์ที่มีอยู่แล้วใน DB: `0811111001`
2. กด "Next"
3. ตรวจสอบ: ✅ แสดง error "เบอร์โทรนี้ถูกใช้งานแล้ว"

---

### Test Case 4: Email Validation

**Test Valid Format**:
- กรอก `john@gmail.com` → ✅ ผ่าน
- กรอก `john@` → ❌ "รูปแบบอีเมลไม่ถูกต้อง"
- กรอก `john.doe@company.co.th` → ✅ ผ่าน

**Test Duplicate Check**:
1. กรอกอีเมลที่มีอยู่แล้วใน DB: `john.doe@gmail.com`
2. กด "Next"
3. ตรวจสอบ: ✅ แสดง error "อีเมลนี้ถูกใช้งานแล้ว"

---

### Test Case 5: Date of Birth - Age Validation

**Test Valid Age**:
- เลือกวันเกิด: `2000-01-01` (อายุ 25 ปี) → ✅ ผ่าน
- เลือกวันเกิด: `2011-01-01` (อายุ 14 ปี) → ✅ ผ่าน

**Test Invalid Age**:
- เลือกวันเกิด: `2012-01-01` (อายุ 13 ปี) → ❌ "อายุต้องไม่ต่ำกว่า 14 ปี"
- เลือกวันเกิด: `2024-01-01` (อายุ 1 ปี) → ❌ "อายุต้องไม่ต่ำกว่า 14 ปี"

---

### Test Case 6: Account Credentials (Step 4)

**Test Username**:
- กรอก `john123` → ✅ ผ่าน (ขึ้นต้นด้วยตัวอักษร, 4-30 chars)
- กรอก `123john` → ❌ "Username ต้องขึ้นต้นด้วยตัวอักษร..."
- กรอก `joh` → ❌ "Username ต้องขึ้นต้นด้วยตัวอักษร และมี 4-30 ตัวอักษร..."

**Test Password**:
- กรอก `Pass123!` → ✅ ผ่าน (8 chars, มี a-z, A-Z, 0-9, special)
- กรอก `password` → ❌ "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร..."
- กรอก `Password` → ❌ (ไม่มีตัวเลข)
- กรอก `Password123` → ❌ (ไม่มีอักขระพิเศษ)

**Test Password Match**:
- Password: `Pass123!`
- Confirm: `Pass123!` → ✅ ผ่าน
- Confirm: `Pass456!` → ❌ "รหัสผ่านไม่ตรงกัน"

---

### Test Case 7: Full Registration Flow

**Steps**:
1. **Step 1**: กรอกส่วนลด 5%, กด Next
2. **Step 2**: กรอกข้อมูลลูกค้าครบถ้วน (ใช้ข้อมูลใหม่ที่ไม่ซ้ำ), กด Next
3. **Step 3**: Review ข้อมูล, กด Next
4. **Step 4**: กรอก username/password, กด Submit
5. ตรวจสอบ:
   - ✅ แสดง Snackbar "ลงทะเบียนสำเร็จ!"
   - ✅ Redirect ไป `/customer/package/order-summary` หลัง 1.5 วินาที

**Expected Backend Call**:
```
POST http://localhost:8000/api/customers/durations/register
{
  "username": "newuser123",
  "password": "Pass123!",
  ...
  "productId": 1,
  "pricePaid": 1140,
  "discountAmount": 60
}
```

---

## ⚠️ Known Issues & TODOs

### Issue 1: Sales Username Hardcoded

**Current**:
```typescript
salesUsername: 'sales1', // TODO: Get from actual logged-in user
```

**Solution**: Get from AuthContext
```typescript
const { user } = useAuth();
salesUsername: user?.sub || 'unknown',
```

---

### Issue 2: Start Date Fixed to Today

**Current**:
```typescript
startDate: new Date().toISOString().split('T')[0], // Today
```

**Enhancement**: Allow Sales to select start date in Step 3

---

### Issue 3: No Backend Error Display

**Current**: Generic error message

**Enhancement**: Parse backend error and display specific message
```typescript
if (data.message === 'USERNAME_ALREADY_EXISTS') {
  setErrors4({ username: 'Username นี้ถูกใช้งานแล้ว' });
}
```

---

## 📚 Related Documentation

- `docs/USER_MANAGEMENT_FLOW.md` - Pattern และ Validation Rules
- `docs/API_DOCUMENTATION.md` - Backend API Endpoints
- `docs/DATA_DICTIONARY.md` - Database Schema และ Field Types
- `docs/PRODUCTS_PAGE_GOLANG_INTEGRATION.md` - Products List Integration

---

## 🔗 File Structure

```
src/app/(internal)/sales/products/duration/[id]/
├── page.tsx                  # Product detail page
├── regis/
│   └── page.tsx             # ✅ Registration form (NEW)
└── register/
    └── page.tsx             # Old registration (to be removed?)
```

---

**Status**: ✅ Duration Registration Flow Complete  
**Last Updated**: October 31, 2025  
**Version**: 1.0 (Use Case 2S + 3S)
