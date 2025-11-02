# 👥 User Management Flow Documentation

> **Module**: Admin - User Management (Staff Accounts)  
> **Path**: `/admin/user-management`  
> **Updated**: October 30, 2025

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Use Cases](#2-use-cases)
3. [Page Structure](#3-page-structure)
4. [Validation Rules](#4-validation-rules)
5. [API Integration Plan](#5-api-integration-plan)
6. [Implementation Steps](#6-implementation-steps)

---

## 1. Overview

### 1.1 Module Purpose
จัดการบัญชีพนักงาน (Staff) ในระบบ รองรับ 4 บทบาทหลัก:
- **ADMIN**: ผู้ดูแลระบบ
- **MANAGER**: ผู้จัดการ
- **TRAINER**: เทรนเนอร์
- **SALES**: พนักงานขาย

### 1.2 Current Status
- ✅ Frontend UI สำเร็จ (ใช้ Mock Data)
- ⏳ Backend API (Golang) - รอการพัฒนา
- ⏳ Integration - รอการเชื่อมต่อ

### 1.3 Architecture Pattern
```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js - View Layer)           │
│  ┌─────────────────────────────────────┐   │
│  │  Business Rules (RE Validation)     │   │
│  │  - Username format check            │   │
│  │  - Password strength check          │   │
│  │  - Phone/Email format validation    │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│                    │ fetch()                │
│                    ▼                        │
└────────────────────┼────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │   Golang Backend API   │
         │  (Model & Controller)  │
         ├────────────────────────┤
         │  • CRUD Operations     │
         │  • Database Access     │
         │  • Business Logic      │
         └────────────────────────┘
```

---

## 2. Use Cases

### UC-UM-01: List All Staff Accounts
**Actor**: Admin  
**Description**: แสดงรายการพนักงานทั้งหมดในตาราง พร้อม Sort, Pagination  

**Preconditions**: User ต้อง Login และมี role = ADMIN

**Flow**:
1. Admin เข้าหน้า `/admin/user-management`
2. System แสดงตารางพนักงานทั้งหมด
3. Admin สามารถ:
   - Sort by First Name (asc/desc)
   - Paginate (10 rows per page)
   - Search/Filter (future enhancement)

**UI Elements**:
- Table with columns: ชื่อ, นามสกุล, Username, บทบาท, เพศ, วันเกิด, โทรศัพท์, Gmail, ความถนัด, สถานะ
- Action buttons: Edit, Delete
- "เพิ่มผู้ใช้งาน" button

---

### UC-UM-02: Add New Staff Account
**Actor**: Admin  
**Description**: เพิ่มบัญชีพนักงานใหม่เข้าระบบ

**Preconditions**: User ต้อง Login และมี role = ADMIN

**Input Fields**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Username | String | ✅ | `/^[A-Za-z][A-Za-z0-9]{3,29}$/` (4-30 chars, start with letter) |
| Password | String | ✅ | `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/` (min 8 chars, must have lowercase, uppercase, digit, special char) |
| Confirm Password | String | ✅ | Must match Password |
| Role | Enum | ✅ | ADMIN \| MANAGER \| TRAINER \| SALES |
| First Name | String | ✅ | Non-empty |
| Last Name | String | ✅ | Non-empty |
| Gender | Enum | ✅ | Male \| Female \| Other |
| Phone Number | String | ✅ | `/^[0-9]{10}$/` (exactly 10 digits) |
| Gmail | String | ✅ | `/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/` |
| Specialty | String | ❌ (Required if Role = TRAINER) | Free text |

**Business Rules (Frontend Validation)**:
1. Username ต้องไม่ซ้ำกับที่มีอยู่ในระบบ
2. Gmail ต้องไม่ซ้ำกับที่มีอยู่ในระบบ
3. Password และ Confirm Password ต้องตรงกัน
4. ถ้า Role = TRAINER → Specialty จะ required
5. ถ้า Role ≠ TRAINER → Specialty จะ disabled และ save เป็น null

**Flow**:
1. Admin กดปุ่ม "เพิ่มผู้ใช้งาน"
2. System นำทางไป `/admin/user-management/add`
3. Admin กรอกข้อมูลในฟอร์ม
4. **Frontend** ตรวจสอบ validation (realtime onBlur)
5. Admin กดปุ่ม "Save"
6. Frontend ตรวจสอบ validation ทั้งหมดอีกครั้ง
7. **Frontend เรียก API**: `POST /api/users` (Golang Backend)
8. Backend บันทึกข้อมูลลง Database
9. Backend ส่ง response กลับมา
10. Frontend แสดง success message และ redirect กลับไป list page

**Error Handling**:
- ถ้า validation fail → แสดง error message ใต้ field ที่ผิด
- ถ้า API call fail → แสดง Snackbar error message
- ถ้า Username/Gmail ซ้ำ (ตรวจจาก Backend) → แสดง error message

---

### UC-UM-03: Edit Staff Account
**Actor**: Admin  
**Description**: แก้ไขข้อมูลบัญชีพนักงาน

**Preconditions**: User ต้อง Login และมี role = ADMIN

**Editable Fields**:
| Field | Editable | Note |
|-------|----------|------|
| Username | ❌ | Read-only (Primary Key) |
| Password | ✅ | Optional (Reset password only) |
| Role | ✅ | - |
| First Name | ✅ | - |
| Last Name | ✅ | - |
| Gender | ✅ | - |
| Date of Birth | ✅ | - |
| Phone Number | ✅ | Must be unique (except current user) |
| Gmail | ✅ | Must be unique (except current user) |
| Specialty | ✅ | Disabled if Role ≠ TRAINER |
| Is Active | ✅ | Boolean switch |

**Business Rules**:
1. Username ไม่สามารถแก้ไขได้ (Primary Key)
2. Password เป็น optional field:
   - ถ้าไม่กรอก = ไม่เปลี่ยนรหัสผ่าน
   - ถ้ากรอก = ต้องกรอก "Confirm New Password" ให้ตรงกัน และต้องผ่าน regex
3. Phone Number ต้องไม่ซ้ำกับคนอื่น (ยกเว้นตัวเอง)
4. Gmail ต้องไม่ซ้ำกับคนอื่น (ยกเว้นตัวเอง)
5. ถ้า Role ≠ TRAINER → Specialty จะถูก save เป็น null

**Flow**:
1. Admin กดปุ่ม Edit icon ที่แถวพนักงาน
2. System นำทางไป `/admin/user-management/edit?u={username}`
3. System โหลดข้อมูลพนักงานจาก API: `GET /api/users/{username}`
4. แสดงฟอร์มพร้อมข้อมูลเดิม
5. Admin แก้ไขข้อมูล
6. Frontend ตรวจสอบ validation
7. Admin กดปุ่ม "Save"
8. **Frontend เรียก API**: `PUT /api/users/{username}` (Golang Backend)
9. Backend อัปเดตข้อมูลใน Database
10. Frontend แสดง success message และ redirect กลับไป list page

---

### UC-UM-04: Delete Staff Account
**Actor**: Admin  
**Description**: ลบบัญชีพนักงานออกจากระบบ

**Preconditions**: User ต้อง Login และมี role = ADMIN

**Flow**:
1. Admin กดปุ่ม Delete icon ที่แถวพนักงาน
2. System แสดง Confirm Dialog:
   ```
   Warning: Are you sure you want to delete user: {username} ?
   บทบาท: {role}
   ```
3. Admin กดปุ่ม "Confirm"
4. **Frontend เรียก API**: `DELETE /api/users/{username}` (Golang Backend)
5. Backend ลบข้อมูลจาก Database (หรือ soft delete โดยตั้ง is_active = false)
6. Frontend แสดง success message: `Username: {username} deleted successfully`
7. System refresh ตารางรายการพนักงาน

**Business Rules**:
1. ควรมี Confirm Dialog เพื่อป้องกันการลบโดยไม่ตั้งใจ
2. พิจารณาใช้ Soft Delete (set is_active = false) แทน Hard Delete เพื่อเก็บประวัติ

---

## 3. Page Structure

### 3.1 List Page (`/admin/user-management/page.tsx`)

**File Location**: `src/app/(internal)/admin/user-management/page.tsx`

**Key Features**:
- Table with sticky header
- Sort by First Name (asc/desc)
- Pagination (10 rows per page)
- Status chip (Active/Inactive)
- Action buttons (Edit/Delete)
- Confirm Dialog for deletion

**State Management**:
```typescript
const [rows, setRows] = useState<Staff[]>([]); // ข้อมูลพนักงานจาก API
const [order, setOrder] = useState<"asc" | "desc">("asc");
const [page, setPage] = useState(0);
const [rowsPerPage, setRowsPerPage] = useState(10);
```

**Current Implementation**:
- ✅ ใช้ Mock Data ใน component
- ⏳ ต้องแก้ไขเป็น fetch data จาก API

---

### 3.2 Add Page (`/admin/user-management/add/page.tsx`)

**File Location**: `src/app/(internal)/admin/user-management/add/page.tsx`

**Key Features**:
- Form with validation
- Real-time validation (onBlur)
- Conditional field (Specialty แสดงเฉพาะ TRAINER)
- localStorage seed data (for mock)

**Validation Regex**:
```typescript
const RE_USERNAME = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const RE_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const RE_PHONE = /^[0-9]{10}$/;
const RE_GMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
```

**Current Implementation**:
- ✅ Form validation ครบถ้วน
- ✅ ใช้ localStorage สำหรับ mock
- ⏳ ต้องแก้ไขเป็น POST API call

---

### 3.3 Edit Page (`/admin/user-management/edit/page.tsx`)

**File Location**: `src/app/(internal)/admin/user-management/edit/page.tsx`

**Key Features**:
- Pre-filled form with existing data
- Username field disabled (read-only)
- Optional password reset
- Is Active toggle switch
- Validation for unique phone/email (excluding self)

**Query Parameter**: `?u={username}`

**Current Implementation**:
- ✅ Load data from Mock array by username
- ✅ Validation ครบถ้วน
- ⏳ ต้องแก้ไขเป็น GET + PUT API calls

---

## 4. Validation Rules

### 4.1 Frontend Validation (React)

**Purpose**: ตรวจสอบรูปแบบข้อมูลและเงื่อนไขพื้นฐานก่อนส่งไป Backend

| Field | Rule | Error Message |
|-------|------|---------------|
| Username | Regex + Not Empty | "รูปแบบไม่ถูกต้อง (A-Za-z ตามด้วย a-z0-9 ความยาว 4–30)" |
| Password | Regex + Not Empty | "อย่างน้อย 8 ตัว มี a-z, A-Z, 0-9 และอักขระพิเศษ" |
| Confirm Password | Match Password | "ต้องตรงกับ Password" |
| Role | Not Empty | "จำเป็น" |
| First Name | Not Empty | "จำเป็น" |
| Last Name | Not Empty | "จำเป็น" |
| Gender | Not Empty | "จำเป็น" |
| Phone Number | Regex (10 digits) | "ต้องเป็นตัวเลข 10 หลัก" |
| Gmail | Regex (email format) | "อีเมลไม่ถูกต้อง" |
| Specialty | Required if Role = TRAINER | "จำเป็นสำหรับ TRAINER" |

**Validation Timing**:
1. **onBlur**: ตรวจสอบทันทีที่ออกจาก field
2. **onSubmit**: ตรวจสอบทั้งหมดก่อนส่ง API

---

### 4.2 Backend Validation (Golang - Plan)

**Purpose**: ตรวจสอบ Business Logic และ Database Constraints

| Check | Description | HTTP Status |
|-------|-------------|-------------|
| Username Unique | ตรวจสอบว่า username ไม่ซ้ำในฐานข้อมูล | 409 Conflict |
| Gmail Unique | ตรวจสอบว่า gmail ไม่ซ้ำในฐานข้อมูล | 409 Conflict |
| Phone Unique | ตรวจสอบว่า phone ไม่ซ้ำในฐานข้อมูล | 409 Conflict |
| Role Valid | ตรวจสอบว่า role อยู่ใน enum | 400 Bad Request |
| Password Hash | Hash password ก่อนบันทึก (bcrypt) | - |

---

## 5. API Integration Plan

### 5.1 List All Staff
```http
GET /api/users?role=ADMIN,MANAGER,TRAINER,SALES
```

**Request Headers**:
```
Authorization: Bearer {token}
```

**Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "result": [
    {
      "username": "jane.m",
      "role": "MANAGER",
      "firstName": "Jane",
      "lastName": "Moon",
      "gender": "FEMALE",
      "dateOfBirth": "1990-03-11",
      "phoneNumber": "0801112233",
      "gmail": "jane.m@example.com",
      "specialty": null,
      "isActive": true,
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

---

### 5.2 Get User by Username
```http
GET /api/users/{username}
```

**Path Parameters**:
- `username` (string): Username of staff

**Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "User retrieved successfully",
  "result": {
    "username": "jane.m",
    "role": "MANAGER",
    "firstName": "Jane",
    "lastName": "Moon",
    "gender": "FEMALE",
    "dateOfBirth": "1990-03-11",
    "phoneNumber": "0801112233",
    "gmail": "jane.m@example.com",
    "specialty": null,
    "isActive": true
  }
}
```

**Error Response (404 Not Found)**:
```json
{
  "status": "error",
  "message": "User not found",
  "result": null
}
```

---

### 5.3 Create New Staff
```http
POST /api/users
```

**Request Body**:
```json
{
  "username": "john.d",
  "password": "Mock@1234",
  "role": "ADMIN",
  "firstName": "John",
  "lastName": "Doe",
  "gender": "MALE",
  "dateOfBirth": "1989-07-22",
  "phoneNumber": "0812223344",
  "gmail": "john.d@example.com",
  "specialty": null
}
```

**Success Response (201 Created)**:
```json
{
  "status": "success",
  "message": "User created successfully",
  "result": {
    "username": "john.d",
    "role": "ADMIN",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true
  }
}
```

**Error Response (409 Conflict - Username exists)**:
```json
{
  "status": "error",
  "message": "Username already exists",
  "result": null
}
```

**Error Response (409 Conflict - Gmail exists)**:
```json
{
  "status": "error",
  "message": "Gmail already exists",
  "result": null
}
```

---

### 5.4 Update Staff
```http
PUT /api/users/{username}
```

**Request Body** (all fields optional except username):
```json
{
  "password": "NewPass@1234",
  "role": "MANAGER",
  "firstName": "Jane",
  "lastName": "Smith",
  "gender": "FEMALE",
  "dateOfBirth": "1990-03-11",
  "phoneNumber": "0801112233",
  "gmail": "jane.smith@example.com",
  "specialty": null,
  "isActive": true
}
```

**Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "User updated successfully",
  "result": {
    "username": "jane.m",
    "role": "MANAGER",
    "firstName": "Jane",
    "lastName": "Smith",
    "isActive": true
  }
}
```

---

### 5.5 Delete Staff
```http
DELETE /api/users/{username}
```

**Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "User deleted successfully",
  "result": null
}
```

**Alternative: Soft Delete**:
```http
PATCH /api/users/{username}/deactivate
```
(Set `isActive = false` instead of delete)

---

## 6. Implementation Steps

### Phase 1: Backend API Development (Golang)
1. ✅ Setup Golang project structure
2. ⏳ Create User model (struct + database table)
3. ⏳ Implement CRUD endpoints:
   - `GET /api/users` (list)
   - `GET /api/users/{username}` (get one)
   - `POST /api/users` (create)
   - `PUT /api/users/{username}` (update)
   - `DELETE /api/users/{username}` (delete)
4. ⏳ Add validation logic
5. ⏳ Add authentication middleware (JWT)
6. ⏳ Add authorization (only ADMIN can access)
7. ⏳ Test with Postman/Thunder Client

---

### Phase 2: Frontend Integration (Next.js)
1. ⏳ Create API service layer:
   ```typescript
   // src/services/userService.ts
   export const userService = {
     getAll: async () => { /* ... */ },
     getOne: async (username: string) => { /* ... */ },
     create: async (data: CreateUserDto) => { /* ... */ },
     update: async (username: string, data: UpdateUserDto) => { /* ... */ },
     delete: async (username: string) => { /* ... */ },
   };
   ```

2. ⏳ แก้ไข List Page (`page.tsx`):
   ```typescript
   // Remove MOCK data
   const [rows, setRows] = useState<Staff[]>([]);
   const [loading, setLoading] = useState(true);
   
   useEffect(() => {
     const fetchData = async () => {
       try {
         const response = await fetch('http://localhost:8000/api/users');
         const data = await response.json();
         setRows(data.result);
       } catch (error) {
         console.error(error);
         setSnack({ open: true, msg: 'Failed to load data', severity: 'error' });
       } finally {
         setLoading(false);
       }
     };
     fetchData();
   }, []);
   ```

3. ⏳ แก้ไข Add Page (`add/page.tsx`):
   ```typescript
   const onSave = async () => {
     if (!validateAll()) return;
     setSaving(true);
     
     try {
       const response = await fetch('http://localhost:8000/api/users', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           username: form.username,
           password: form.password,
           role: form.role,
           // ... other fields
         }),
       });
       
       const data = await response.json();
       
       if (data.status === 'success') {
         setSnack({ open: true, msg: 'User created successfully', severity: 'success' });
         router.push('/admin/user-management');
       } else {
         setSnack({ open: true, msg: data.message, severity: 'error' });
       }
     } catch (error) {
       setSnack({ open: true, msg: 'Failed to create user', severity: 'error' });
     } finally {
       setSaving(false);
     }
   };
   ```

4. ⏳ แก้ไข Edit Page (`edit/page.tsx`):
   ```typescript
   // Load data from API
   useEffect(() => {
     const fetchData = async () => {
       try {
         const response = await fetch(`http://localhost:8000/api/users/${u}`);
         const data = await response.json();
         if (data.status === 'success') {
           setForm({ ...data.result, newPassword: '', confirmNewPassword: '' });
         }
       } catch (error) {
         console.error(error);
       }
     };
     if (u) fetchData();
   }, [u]);
   
   // Save changes
   const onSave = async () => {
     // ... validation
     try {
       const response = await fetch(`http://localhost:8000/api/users/${form.username}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           password: form.newPassword || undefined,
           role: form.role,
           // ... other fields
         }),
       });
       // ... handle response
     } catch (error) {
       // ... handle error
     }
   };
   ```

5. ⏳ Update Delete handler:
   ```typescript
   const doDelete = async () => {
     const username = confirm.target?.username;
     if (!username) return;
     
     try {
       const response = await fetch(`http://localhost:8000/api/users/${username}`, {
         method: 'DELETE',
       });
       
       const data = await response.json();
       
       if (data.status === 'success') {
         setRows((prev) => prev.filter((it) => it.username !== username));
         setSnack({ open: true, msg: 'User deleted successfully', severity: 'success' });
       }
     } catch (error) {
       setSnack({ open: true, msg: 'Failed to delete user', severity: 'error' });
     }
     
     setConfirm({ open: false });
   };
   ```

---

### Phase 3: Testing & Refinement
1. ⏳ Test all CRUD operations
2. ⏳ Test validation (both Frontend & Backend)
3. ⏳ Test error handling
4. ⏳ Test edge cases (duplicate username/email, etc.)
5. ⏳ Add loading states
6. ⏳ Add error states
7. ⏳ Improve UX (loading indicators, better error messages)

---

## 7. Next Steps

### เมื่อพร้อม Implement:
1. **Backend Developer** พัฒนา API ตาม Section 5
2. **Frontend Developer** ทำ Integration ตาม Section 6 - Phase 2
3. **QA** ทดสอบตาม Section 6 - Phase 3

### คำถามที่ต้องตอบก่อน Implement:
- [ ] Backend API Base URL คืออะไร? (เช่น `http://localhost:8000`)
- [ ] ใช้ JWT Token หรือ Cookie-based authentication?
- [ ] Soft Delete หรือ Hard Delete?
- [ ] Password hashing algorithm? (แนะนำ bcrypt)
- [ ] Gender enum ใน Backend: `"MALE"` หรือ `"M"`?
- [ ] Date format: ISO8601 หรือ `YYYY-MM-DD`?

---

## 8. Notes for Developer

### 🎯 Key Points:
1. **Validation ทำ 2 ชั้น**: Frontend (UX) + Backend (Security)
2. **Frontend มองเป็น View**: ทำหน้าที่แสดงผลและรับ input
3. **Backend เป็น Source of Truth**: Database logic อยู่ที่ Backend
4. **Error Handling**: ต้องจัดการทั้ง Network Error และ Business Logic Error
5. **Loading States**: แสดง Loading indicator เมื่อรอ API response

### 🔒 Security Considerations:
- Password ต้อง hash ที่ Backend (bcrypt)
- JWT Token ต้องส่งใน Authorization header
- API endpoints ต้องมี authentication & authorization middleware
- Input validation ทั้ง Frontend และ Backend

### 📝 Code Style:
- ใช้ TypeScript strict mode
- ใช้ async/await แทน .then/.catch
- แยก API calls ไปอยู่ใน service layer
- ใช้ try-catch สำหรับ error handling

---

**Document Version**: 1.0  
**Last Updated**: October 30, 2025  
**Status**: Draft - Waiting for Backend API Implementation
