# 🔐 Login Flow Implementation Guide

> **Module**: Authentication - Login  
> **Path**: `/login`  
> **Updated**: October 30, 2025

---

## 📋 Table of Contents

1. [Overview](#1-overview)
2. [Implementation Summary](#2-implementation-summary)
3. [Code Structure](#3-code-structure)
4. [Validation Flow](#4-validation-flow)
5. [API Integration](#5-api-integration)
6. [Error Handling](#6-error-handling)
7. [Testing Guide](#7-testing-guide)

---

## 1. Overview

### 1.1 Use Case Mapping

ตามเอกสาร `login_use_case.md` (Use Case 0S: เข้าสู่ระบบ)

| Step | Description | Implementation |
|------|-------------|----------------|
| 1 | ผู้ใช้งานคลิกปุ่ม "Sign In" | `<Button>` ใน MainNavbar |
| 2 | Redirect ไปหน้า Sign In | `router.push('/login')` |
| 3 | กรอก Username, Password | `<TextField>` components |
| 4-5 | Frontend Validation | `validateFields()` method |
| 6 | Backend API Call (Q0S.1) | `fetch()` to `/api/auth/login` |
| 7 | ตรวจสอบ Is_Active | Backend handles this |
| 8 | สร้าง JWT Token (Q0S.2) | Backend handles this |
| 9 | Redirect ตาม Role | `defaultPathForRole()` helper |
| 10 | แสดง Success Message | `useSnack()` hook |

---

## 2. Implementation Summary

### 2.1 Files Modified

```
src/app/(root)/login/page.tsx       ← Main Login Page (Updated)
src/components/snack/SnackProvider.tsx   ← Already exists
src/lib/roleRedirect.ts             ← Already exists
docs/LOGIN_IMPLEMENTATION.md        ← This file (New)
```

### 2.2 Key Changes

#### ✅ Before (Old Implementation)
- ใช้ `/api/auth/login` (Next.js API Route - เดิม)
- ใช้ `Alert` component แสดง error
- ไม่มี validation ที่ชัดเจน
- ไม่มี success message

#### ✅ After (New Implementation)
- ใช้ `http://localhost:8000/api/auth/login` (Golang Backend)
- ใช้ `useSnack()` แสดง success message
- มี frontend validation ชัดเจน (Step 4-5)
- มี error handling ตาม Use Case (Step 6-7)

---

## 3. Code Structure

### 3.1 Component Overview

```tsx
export default function LoginPage() {
  // 🎯 State Management
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const router = useRouter();
  const { setSnack } = useSnack();

  // 📋 Step 4-5: Frontend Validation
  const validateFields = (): boolean => { /* ... */ };

  // 🔐 Step 3, 6-10: Login Handler
  const handleLogin = async (e: FormEvent) => { /* ... */ };

  // ❌ Error Message Handler
  const handleLoginError = (message: string) => { /* ... */ };

  // 🧹 Clear errors on input change
  const handleUsernameChange = (value: string) => { /* ... */ };
  const handlePasswordChange = (value: string) => { /* ... */ };

  return (/* JSX */);
}
```

---

## 4. Validation Flow

### 4.1 Frontend Validation (Step 4-5)

**Method:** `validateFields()`

```typescript
const validateFields = (): boolean => {
  const newErrors: Record<string, string> = {};

  // Username ห้ามค่าว่าง
  if (!username.trim()) {
    newErrors.username = 'Username is required';
  }

  // Password ห้ามค่าว่าง
  if (!password.trim()) {
    newErrors.password = 'Password is required';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

**UI Display:**
- ถ้าผ่าน validation → เรียก API
- ถ้าไม่ผ่าน → แสดง error message สีแดงใต้ field

**Example:**
```tsx
<TextField
  label="Username"
  value={username}
  onChange={(e) => handleUsernameChange(e.target.value)}
  error={!!errors.username}           // ← แสดงขอบสีแดง
  helperText={errors.username}        // ← แสดงข้อความ error
  fullWidth
  required
/>
```

---

### 4.2 Backend Validation (Step 6-7)

**Query Q0S.1:** ตรวจสอบ Username & Password (bcrypt)

```sql
SELECT 
  Username,
  Role,
  First_Name,
  Last_Name,
  Is_Active
FROM USER
WHERE Username = ${Username}
  AND Password = crypt(${Password}, Password);
```

**Backend Response:**

**Success (200 OK):**
```json
{
  "status": "success",
  "message": "Login successful",
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "username": "sales1",
      "role": "SALES",
      "firstName": "Sara",
      "lastName": "Smith",
      "isActive": true
    }
  }
}
```

**Error (400 Bad Request):**
```json
{
  "status": "error",
  "message": "invalid credentials",
  "result": null
}
```

**Error (403 Forbidden):**
```json
{
  "status": "error",
  "message": "This account has been suspended.",
  "result": null
}
```

---

## 5. API Integration

### 5.1 Login Request

**Endpoint:** `POST http://localhost:8000/api/auth/login`

```typescript
const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
  credentials: 'include', // ← สำคัญ! รับ cookie จาก backend
});
```

### 5.2 Response Handling

```typescript
const data = await response.json();

if (response.ok && data.status === 'success') {
  const user = data.result.user;
  
  // Step 10: แสดง Success Message
  setSnack({
    open: true,
    msg: `เข้าสู่ระบบสำเร็จ ✅ ยินดีต้อนรับ คุณ ${user.firstName}!`,
    severity: 'success',
  });

  // Step 9: Redirect ตาม Role
  const targetPath = defaultPathForRole(user.role);
  setTimeout(() => {
    router.replace(targetPath);
  }, 500);
}
```

### 5.3 Role Redirect Mapping

**Helper:** `defaultPathForRole()` in `lib/roleRedirect.ts`

```typescript
export function defaultPathForRole(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return '/admin/user-management';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'TRAINER':
      return '/trainer/calendar-management';
    case 'SALES':
      return '/sales/products';
    case 'CUSTOMER':
      return '/customer/calendar';
    default:
      return '/';
  }
}
```

---

## 6. Error Handling

### 6.1 Error Types

| Error Type | HTTP Status | Frontend Display | Use Case Step |
|------------|-------------|------------------|---------------|
| Empty Fields | - | ใต้ field (สีแดง) | Step 4-5 |
| Invalid Credentials | 400 | "Username or Password is Incorrect" | Step 6 |
| Account Suspended | 403 | "This account has been suspended." | Step 7 |
| Network Error | - | "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์" | - |

### 6.2 Error Handler Method

```typescript
const handleLoginError = (message: string) => {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('invalid credentials') || lowerMsg.includes('incorrect')) {
    // Step 6: Username หรือ Password ไม่ถูกต้อง
    setErrors({ form: 'Username or Password is Incorrect' });
  } else if (lowerMsg.includes('suspended') || lowerMsg.includes('inactive')) {
    // Step 7: บัญชีถูกระงับ
    setErrors({ form: 'This account has been suspended.' });
  } else {
    // Error อื่นๆ
    setErrors({ form: message });
  }
};
```

### 6.3 UI Display

**Form-level Error:**
```tsx
{errors.form && (
  <Typography 
    variant="body2" 
    color="error" 
    sx={{ 
      textAlign: 'center',
      p: 1.5,
      backgroundColor: 'error.lighter',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'error.main',
    }}
  >
    {errors.form}
  </Typography>
)}
```

**Field-level Error:**
```tsx
<TextField
  error={!!errors.username}
  helperText={errors.username}
  /* ... */
/>
```

---

## 7. Testing Guide

### 7.1 Manual Testing Scenarios

#### Test Case 1: Empty Fields (Step 4-5)

**Input:**
- Username: (empty)
- Password: (empty)
- Click "Sign in"

**Expected:**
- ❌ Username field: แสดง "Username is required" (สีแดง)
- ❌ Password field: แสดง "Password is required" (สีแดง)
- ⛔ ไม่เรียก API

---

#### Test Case 2: Valid Login (Step 6-10)

**Input:**
- Username: `sales1`
- Password: `Password123!`
- Click "Sign in"

**Expected:**
- ✅ Loading state: "Signing in…"
- ✅ API Call: `POST http://localhost:8000/api/auth/login`
- ✅ Success Snackbar: "เข้าสู่ระบบสำเร็จ ✅ ยินดีต้อนรับ คุณ Sara!"
- ✅ Redirect: `/sales/products` (ถ้า role = SALES)

**Database Check:**
```sql
-- Q0S.2: Updated_At should be updated
SELECT Username, Updated_At 
FROM USER 
WHERE Username = 'sales1';
-- Updated_At = CURRENT_TIMESTAMP
```

---

#### Test Case 3: Invalid Credentials (Step 6)

**Input:**
- Username: `sales1`
- Password: `WrongPassword`
- Click "Sign in"

**Expected:**
- ❌ Form Error: "Username or Password is Incorrect"
- ⛔ ไม่ redirect
- ⛔ ไม่แสดง success message

---

#### Test Case 4: Suspended Account (Step 7)

**Setup:**
```sql
UPDATE USER 
SET Is_Active = FALSE 
WHERE Username = 'sales1';
```

**Input:**
- Username: `sales1`
- Password: `Password123!`
- Click "Sign in"

**Expected:**
- ❌ Form Error: "This account has been suspended."
- ⛔ ไม่ redirect
- ⛔ ไม่แสดง success message

---

### 7.2 Browser DevTools Testing

**Network Tab:**
1. Open DevTools → Network
2. Login with valid credentials
3. Check Request:
   ```
   POST http://localhost:8000/api/auth/login
   Request Payload: {"username":"sales1","password":"Password123!"}
   ```
4. Check Response:
   ```json
   {
     "status": "success",
     "message": "Login successful",
     "result": { "token": "...", "user": {...} }
   }
   ```
5. Check Cookies:
   ```
   Name: pf_auth
   Value: eyJhbGciOiJIUzI1NiIs...
   HttpOnly: true
   SameSite: Lax
   ```

---

## 8. Implementation Checklist

### ✅ Completed Tasks

- [x] แก้ไข Login Page (`/login/page.tsx`)
- [x] เพิ่ม Frontend Validation (Step 4-5)
- [x] เชื่อมต่อ Golang Backend API (Step 6)
- [x] จัดการ Error Messages (Step 6-7)
- [x] ใช้ Snackbar แสดงข้อความสำเร็จ (Step 10)
- [x] Redirect ตาม Role (Step 9)
- [x] เขียน Documentation

### ⏳ Pending Tasks (Backend)

- [ ] Backend API: `POST /api/auth/login` ใช้งานได้
- [ ] Q0S.1: ตรวจสอบ Username & Password (bcrypt)
- [ ] Q0S.2: อัปเดต `Updated_At` timestamp
- [ ] JWT Token generation (7 days expiry)
- [ ] Cookie setup (HttpOnly, SameSite: Lax)

---

## 9. Next Steps

### Phase 1: Backend Verification
1. ทดสอบ Backend API ด้วย Postman
2. ตรวจสอบ Q0S.1 และ Q0S.2 ทำงานถูกต้อง
3. ตรวจสอบ JWT Token และ Cookie

### Phase 2: Integration Testing
1. เปิด Frontend (`npm run dev`)
2. เปิด Backend (Golang server port 8000)
3. ทดสอบ Login ด้วย test accounts
4. ตรวจสอบ Redirect และ Success Message

### Phase 3: Edge Cases
1. ทดสอบ Network Timeout
2. ทดสอบ Invalid JSON Response
3. ทดสอบ CORS Issues
4. ทดสอบ Cookie ทำงานถูกต้อง

---

## 10. Troubleshooting

### Problem 1: CORS Error

**Error:**
```
Access to fetch at 'http://localhost:8000/api/auth/login' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution (Backend - Golang):**
```go
// ใน router/api_router.go
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Content-Type", "Authorization"},
    AllowCredentials: true, // ← สำคัญ! สำหรับ cookies
}))
```

---

### Problem 2: Cookie ไม่ถูกส่งมา

**Check:**
1. Backend ตั้ง Cookie Options:
   ```go
   c.SetCookie(
       "pf_auth",
       token,
       604800, // 7 days
       "/",
       "localhost",
       false,  // Secure (true in production)
       true,   // HttpOnly
   )
   ```

2. Frontend ใช้ `credentials: 'include'`:
   ```typescript
   fetch(url, {
       credentials: 'include', // ← สำคัญ!
   })
   ```

---

### Problem 3: Redirect ไม่ทำงาน

**Check:**
1. `defaultPathForRole()` return ถูกต้อง
2. ใช้ `router.replace()` แทน `router.push()`
3. เช็ค `user.role` ใน response

---

## 11. Related Files

### Frontend
- `src/app/(root)/login/page.tsx` - Login Page
- `src/lib/roleRedirect.ts` - Role → Path mapping
- `src/components/snack/SnackProvider.tsx` - Success Message
- `src/contexts/AuthProvider.tsx` - Auth Context

### Backend (Golang)
- `internal/adapters/rest/auth_rest.go` - Login Handler
- `domain/usecases/auth_use_case.go` - Business Logic
- `internal/infrastructure/db/queries/users.sql` - Q0S.1, Q0S.2
- `router/api_router.go` - Route Registration

### Documentation
- `docs/login_use_case.md` - Use Case Specification
- `docs/API_DOCUMENTATION.md` - API Reference
- `docs/LOGIN_IMPLEMENTATION.md` - This file

---

**Document Version**: 1.0  
**Last Updated**: October 30, 2025  
**Status**: ✅ Frontend Complete - ⏳ Waiting for Backend API
