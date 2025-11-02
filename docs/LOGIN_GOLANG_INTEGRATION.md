# 🔐 Login Integration with Golang Backend - Update Log

> **Status**: ✅ Integrated with Golang Backend  
> **Date**: October 31, 2025

---

## 📝 Changes Made

### 1. **Updated AuthProvider** (`src/contexts/AuthProvider.tsx`)

#### Changed API Endpoint:
```typescript
// ❌ Before (Next.js API)
const res = await fetch('/api/auth/me', { credentials: 'include' });

// ✅ After (Golang Backend)
const res = await fetch('http://localhost:8000/api/auth/me', { 
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
});
```

#### Updated Response Handling:
```typescript
// Golang Response Structure:
{
  "status": "success",
  "result": {
    "authenticated": true,
    "user": {
      "sub": "username",
      "role": "ADMIN",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}

// Map to AuthUser type:
const authUser: AuthUser = {
  sub: backendUser.sub || backendUser.username,
  role: backendUser.role as UserRole,
  firstName: backendUser.firstName || backendUser.first_name,
  lastName: backendUser.lastName || backendUser.last_name,
  email: backendUser.email || backendUser.gmail,
};
```

---

### 2. **Updated Login Page** (`src/app/(root)/login/page.tsx`)

#### Changed Response Status Check:
```typescript
// ❌ Before
if (response.ok && data.status === 'OK')

// ✅ After
if (response.ok && data.status === 'success')
```

#### Improved Redirect Logic:
```typescript
// ใช้ window.location.href แทน router.push() เพื่อ force refresh
setTimeout(() => {
  window.location.href = targetPath;
}, 1500);
```

---

## 🍪 Cookie Configuration

### Backend (Golang - Fiber)

#### Login - Set Cookie:
```go
c.Cookie(&fiber.Cookie{
    Name:     "pf_auth",
    Value:    result.Token,
    HTTPOnly: true,
    SameSite: "None",
    Secure:   os.Getenv("NODE_ENV") == "production",
    Path:     "/",
    MaxAge:   60 * 60 * 24 * 7, // 7 days
})
```

#### Logout - Clear Cookie:
```go
c.Cookie(&fiber.Cookie{
    Name:     "pf_auth",
    Value:    "",
    HTTPOnly: true,
    SameSite: "None",
    Secure:   os.Getenv("NODE_ENV") == "production",
    Path:     "/",
    MaxAge:   -1, // Delete cookie
    Expires:  time.Now().Add(-1 * time.Hour),
})
```

### Frontend (Next.js)

#### API Calls with Credentials:
```typescript
fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  credentials: 'include', // ← สำคัญ! เพื่อส่ง/รับ cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
```

---

## 🔄 Flow After Changes

```
┌─────────────────┐
│  User Login     │
│  (Login Page)   │
└────────┬────────┘
         │
         │ POST /api/auth/login
         │ credentials: 'include'
         ▼
┌─────────────────────────────┐
│  Golang Backend             │
│  • Verify credentials       │
│  • Generate JWT             │
│  • Set Cookie: pf_auth      │
│  • Return user data         │
└────────┬────────────────────┘
         │
         │ Response + Cookie
         ▼
┌─────────────────┐
│  Frontend       │
│  • Show Success │
│  • Redirect     │
└────────┬────────┘
         │
         │ Navigate to /admin/* or /sales/*
         ▼
┌─────────────────────────────┐
│  Protected Page             │
│  (ClientWrapper with Guard) │
└────────┬────────────────────┘
         │
         │ GET /api/auth/me
         │ credentials: 'include'
         │ (Send pf_auth cookie)
         ▼
┌─────────────────────────────┐
│  Golang Backend             │
│  • Verify JWT from cookie   │
│  • Return user data         │
└────────┬────────────────────┘
         │
         │ Response
         ▼
┌─────────────────┐
│  AuthProvider   │
│  • Set user     │
│  • Allow access │
└─────────────────┘
```

---

## 🧪 Testing Checklist

### Test 1: Login Flow
- [ ] เปิด `http://localhost:3000/login`
- [ ] กรอก username และ password ที่ถูกต้อง
- [ ] กด "Sign in"
- [ ] ดูที่ Console → ควรเห็น:
  ```
  Login response: { status: "success", result: {...} }
  User: { sub: "...", role: "...", ... }
  Role: ADMIN
  Redirecting to: /admin/user-management
  ```
- [ ] ดู Snackbar แสดงที่ top-center (3 วินาที)
- [ ] Redirect ไปหน้าที่เหมาะสมตาม Role

### Test 2: Cookie Check
- [ ] เปิด DevTools → Application → Cookies
- [ ] ดู cookie `pf_auth`:
  ```
  Name: pf_auth
  Value: eyJhbGciOiJIUzI1NiIs...
  Domain: localhost
  Path: /
  HttpOnly: true
  SameSite: None
  Max-Age: 604800 (7 days)
  ```

### Test 3: Protected Routes
- [ ] Login สำเร็จ → redirect ไป `/admin/user-management`
- [ ] Refresh หน้า → ควรยัง login อยู่ (ไม่ redirect กลับไป `/login`)
- [ ] เปิดหน้าใหม่ → ควรยัง login อยู่

### Test 4: Logout
- [ ] กด Logout button
- [ ] ดูที่ Console/Network
- [ ] Cookie `pf_auth` ควรถูกลบ
- [ ] Redirect กลับไป `/login`

---

## ⚠️ Known Issues & Solutions

### Issue 1: CORS Error

**Error:**
```
Access to fetch at 'http://localhost:8000/api/auth/login' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Solution (Backend):**
```go
// In Golang Backend
app.Use(cors.New(cors.Config{
    AllowOrigins:     "http://localhost:3000",
    AllowCredentials: true, // ← สำคัญ! สำหรับ cookies
    AllowHeaders:     "Content-Type, Authorization",
    AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
}))
```

---

### Issue 2: Cookie Not Set

**Symptoms:**
- Login สำเร็จแต่ redirect กลับไป `/login` ทันที
- Cookie `pf_auth` ไม่ถูก set

**Check:**
1. Frontend ใช้ `credentials: 'include'` ทุก request
2. Backend ตั้ง `SameSite: "None"` และ `Secure` ถูกต้อง
3. CORS config มี `AllowCredentials: true`

---

### Issue 3: SameSite Cookie Warning

**Warning in Console:**
```
Cookie "pf_auth" has been rejected because it is in a cross-site context 
and its "SameSite" is "None" without "Secure".
```

**Solution:**
- Development: ตั้ง `Secure: false` (HTTP allowed)
- Production: ตั้ง `Secure: true` (HTTPS only)

```go
Secure: os.Getenv("NODE_ENV") == "production",
```

---

## 📊 API Response Formats

### Login Success
```json
{
  "status": "success",
  "status_code": 200,
  "message": "Login successful",
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "sub": "admin01",
      "role": "ADMIN",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
}
```

### Login Error (Invalid Credentials)
```json
{
  "status": "error",
  "status_code": 400,
  "message": "invalid credentials",
  "result": null
}
```

### Auth Me (Authenticated)
```json
{
  "status": "success",
  "status_code": 200,
  "message": "User retrieved successfully",
  "result": {
    "authenticated": true,
    "user": {
      "sub": "admin01",
      "role": "ADMIN",
      "firstName": "Admin",
      "lastName": "User"
    }
  }
}
```

### Auth Me (Not Authenticated)
```json
{
  "status": "success",
  "status_code": 200,
  "message": "User not authenticated",
  "result": {
    "authenticated": false
  }
}
```

---

## 🔐 Security Notes

1. **HTTPOnly Cookie**: Cookie `pf_auth` เป็น HTTPOnly = JavaScript ไม่สามารถอ่านได้ (ป้องกัน XSS)
2. **SameSite**: ตั้งเป็น `None` เพื่อให้ทำงานกับ cross-origin requests
3. **Secure Flag**: ใช้ใน production (HTTPS only)
4. **JWT Expiry**: Token หมดอายุ 7 วัน
5. **Cookie MaxAge**: Cookie หมดอายุ 7 วัน (สอดคล้องกับ JWT)

---

## 📝 Next Steps

### Phase 1: Testing ✅
- [x] แก้ไข AuthProvider เชื่อม Golang Backend
- [x] แก้ไข Login Page รองรับ response structure
- [x] ทดสอบ Login flow
- [x] ทดสอบ Cookie setup
- [x] ทดสอบ Protected routes

### Phase 2: Other Auth Flows
- [ ] Implement Logout button/functionality
- [ ] Add token refresh logic (optional)
- [ ] Add "Remember Me" feature (optional)
- [ ] Add password reset flow

### Phase 3: Error Handling
- [ ] Handle network timeouts
- [ ] Handle expired tokens
- [ ] Better error messages
- [ ] Retry logic

---

## 📚 Related Documentation

- `docs/login_use_case.md` - Use Case 0S specification
- `docs/API_DOCUMENTATION.md` - API reference
- `docs/LOGIN_IMPLEMENTATION.md` - Implementation guide
- `docs/LOGIN_FLOW_SUMMARY.md` - Flow summary

---

**Status**: ✅ Golang Backend Integration Complete  
**Last Updated**: October 31, 2025  
**Version**: 2.0 (Golang Backend)
