# 🔐 Login Flow - Visual Guide

> **Quick Reference**: Visual diagrams for Login Flow  
> **Date**: October 30, 2025

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USE CASE 0S: เข้าสู่ระบบ                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│   STEP 1-2   │          │   STEP 3-5   │          │   STEP 6-8   │
│              │          │              │          │              │
│  Navigation  │   ──>    │  Validation  │   ──>    │   Backend    │
│              │          │              │          │              │
└──────────────┘          └──────────────┘          └──────────────┘
                                                            │
                                                            │
                                                            ▼
                          ┌──────────────┐          ┌──────────────┐
                          │  STEP 9-10   │          │              │
                          │              │   <──    │   Success    │
                          │   Redirect   │          │              │
                          │              │          └──────────────┘
                          └──────────────┘
```

---

## 🔄 Detailed Flow

```
USER                    FRONTEND                    BACKEND                 DATABASE
 │                         │                           │                        │
 │  1. Click "Sign In"     │                           │                        │
 ├────────────────────────>│                           │                        │
 │                         │                           │                        │
 │  2. Show Login Page     │                           │                        │
 │<────────────────────────┤                           │                        │
 │                         │                           │                        │
 │  3. Enter Credentials   │                           │                        │
 ├────────────────────────>│                           │                        │
 │                         │                           │                        │
 │                         │  4. Validate Fields       │                        │
 │                         │  (Username, Password)     │                        │
 │                         │                           │                        │
 │                         │  5. If invalid:           │                        │
 │  Show Error (Red)       │     Show Error            │                        │
 │<────────────────────────┤                           │                        │
 │                         │                           │                        │
 │                         │  If valid:                │                        │
 │                         │  6. POST /api/auth/login  │                        │
 │                         ├──────────────────────────>│                        │
 │                         │                           │                        │
 │                         │                           │  Q0S.1: Verify User   │
 │                         │                           ├───────────────────────>│
 │                         │                           │                        │
 │                         │                           │  Return User Data      │
 │                         │                           │<───────────────────────┤
 │                         │                           │                        │
 │                         │                           │  7. Check Is_Active    │
 │                         │                           │                        │
 │                         │                           │  If Active:            │
 │                         │                           │  Q0S.2: Update Time    │
 │                         │                           ├───────────────────────>│
 │                         │                           │                        │
 │                         │                           │  8. Generate JWT       │
 │                         │                           │     Set Cookie         │
 │                         │                           │                        │
 │                         │  Success Response         │                        │
 │                         │<──────────────────────────┤                        │
 │                         │                           │                        │
 │                         │  9. Redirect to           │                        │
 │                         │     Role Landing Page     │                        │
 │                         │                           │                        │
 │  10. Show Success       │                           │                        │
 │      Snackbar           │                           │                        │
 │<────────────────────────┤                           │                        │
 │                         │                           │                        │
 │  Redirected ✅          │                           │                        │
 │<────────────────────────┤                           │                        │
 │                         │                           │                        │
```

---

## ❌ Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR SCENARIOS                              │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────┐
│   User Input       │
│   Submit Form      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Empty Fields?     │◄──────── Step 4: Model Validation
└─────────┬──────────┘
          │
      YES │ NO
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌───────┐   ┌────────────────────┐
│ Show  │   │  Call Backend API  │◄──── Step 6: Database Validation
│ Error │   └─────────┬──────────┘
│ (Red) │             │
└───────┘             │
                      ▼
              ┌───────────────────┐
              │  Response Status  │
              └─────────┬─────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌───────┐      ┌────────┐     ┌──────────┐
    │ 200   │      │  400   │     │   403    │
    │  OK   │      │  Bad   │     │ Forbidden│
    └───┬───┘      │Request │     └────┬─────┘
        │          └────┬───┘           │
        │               │               │
        ▼               ▼               ▼
    ┌───────┐      ┌──────────┐   ┌──────────┐
    │Success│      │"Username │   │"Account  │
    │Message│      │or Pass   │   │Suspended"│
    │       │      │Incorrect"│   │          │
    └───┬───┘      └────┬─────┘   └────┬─────┘
        │               │               │
        ▼               └───────┬───────┘
    ┌───────┐                  │
    │Redirect│                 ▼
    └───────┘          ┌──────────────┐
                       │ Stay on Page │
                       │ Show Error   │
                       └──────────────┘
```

---

## 🎯 Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                    LoginPage Component                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  State Management                                       │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • username: string                                     │    │
│  │  • password: string                                     │    │
│  │  • showPw: boolean                                      │    │
│  │  • loading: boolean                                     │    │
│  │  • errors: Record<string, string>                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Methods                                                │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  validateFields()      ◄────── Step 4-5               │    │
│  │  handleLogin()         ◄────── Step 3, 6-10           │    │
│  │  handleLoginError()    ◄────── Step 6-7               │    │
│  │  handleUsernameChange()                                │    │
│  │  handlePasswordChange()                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  External Dependencies                                  │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │  • useRouter() ────────> Navigation                    │    │
│  │  • useSnack() ─────────> Success Message (Step 10)     │    │
│  │  • defaultPathForRole()> Role Mapping (Step 9)         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Data Flow

```
                    INPUT
                      │
                      ▼
        ┌─────────────────────────┐
        │   TextField Component   │
        │   ┌─────────────────┐   │
        │   │   Username      │   │
        │   └─────────────────┘   │
        │   ┌─────────────────┐   │
        │   │   Password      │   │
        │   └─────────────────┘   │
        └───────────┬─────────────┘
                    │
                    ▼
        ┌─────────────────────────┐
        │   validateFields()      │
        │                         │
        │   if (!username.trim()) │
        │     → Error             │
        │   if (!password.trim()) │
        │     → Error             │
        └───────────┬─────────────┘
                    │
                    ▼
        ┌─────────────────────────┐
        │   handleLogin()         │
        │                         │
        │   fetch(API_BASE_URL +  │
        │     '/api/auth/login')  │
        └───────────┬─────────────┘
                    │
                    ▼
        ┌─────────────────────────┐
        │   Backend Response      │
        │                         │
        │   {                     │
        │     status: "success",  │
        │     result: {           │
        │       token: "...",     │
        │       user: {...}       │
        │     }                   │
        │   }                     │
        └───────────┬─────────────┘
                    │
                    ▼
        ┌─────────────────────────┐
        │   Success Handler       │
        │                         │
        │   1. setSnack() ───────>│ Snackbar
        │   2. router.replace()──>│ New Page
        └─────────────────────────┘
```

---

## 🔐 Backend API Contract

```
REQUEST
┌───────────────────────────────────────────┐
│ POST http://localhost:8000/api/auth/login │
├───────────────────────────────────────────┤
│ Headers:                                  │
│   Content-Type: application/json          │
│                                           │
│ Body:                                     │
│   {                                       │
│     "username": "sales1",                 │
│     "password": "Password123!"            │
│   }                                       │
│                                           │
│ Options:                                  │
│   credentials: 'include'                  │
└───────────────────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   BACKEND     │
            │   PROCESSING  │
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   SUCCESS    │        │    ERROR     │
└──────┬───────┘        └──────┬───────┘
       │                       │
       ▼                       ▼

RESPONSE (200 OK)          RESPONSE (400/403)
┌─────────────────────┐    ┌─────────────────────┐
│ {                   │    │ {                   │
│   "status":         │    │   "status":         │
│     "success",      │    │     "error",        │
│   "message":        │    │   "message":        │
│     "Login          │    │     "invalid        │
│      successful",   │    │      credentials",  │
│   "result": {       │    │   "result": null    │
│     "token": "...", │    │ }                   │
│     "user": {       │    └─────────────────────┘
│       "username":   │
│         "sales1",   │
│       "role":       │
│         "SALES",    │
│       "firstName":  │
│         "Sara",     │
│       ...           │
│     }               │
│   }                 │
│ }                   │
└─────────────────────┘

Cookie Set:
┌─────────────────────┐
│ pf_auth=eyJhbG...  │
│ HttpOnly=true       │
│ SameSite=Lax        │
│ MaxAge=604800       │
└─────────────────────┘
```

---

## 🎨 UI States

```
STATE 1: INITIAL
┌─────────────────────────────────┐
│   เข้าสู่ระบบ                    │
├─────────────────────────────────┤
│                                 │
│   ┌───────────────────────┐     │
│   │ Username              │     │
│   └───────────────────────┘     │
│                                 │
│   ┌───────────────────────┐     │
│   │ Password      [👁️]    │     │
│   └───────────────────────┘     │
│                                 │
│   ┌───────────────────────┐     │
│   │     Sign in           │     │
│   └───────────────────────┘     │
└─────────────────────────────────┘


STATE 2: VALIDATION ERROR
┌─────────────────────────────────┐
│   เข้าสู่ระบบ                    │
├─────────────────────────────────┤
│                                 │
│   ┌───────────────────────┐     │
│   │ Username              │🔴   │
│   └───────────────────────┘     │
│   ❌ Username is required        │
│                                 │
│   ┌───────────────────────┐     │
│   │ Password      [👁️]    │🔴   │
│   └───────────────────────┘     │
│   ❌ Password is required        │
│                                 │
│   ┌───────────────────────┐     │
│   │     Sign in           │     │
│   └───────────────────────┘     │
└─────────────────────────────────┘


STATE 3: LOADING
┌─────────────────────────────────┐
│   เข้าสู่ระบบ                    │
├─────────────────────────────────┤
│                                 │
│   ┌───────────────────────┐     │
│   │ sales1                │     │
│   └───────────────────────┘     │
│                                 │
│   ┌───────────────────────┐     │
│   │ ••••••••      [👁️]    │     │
│   └───────────────────────┘     │
│                                 │
│   ┌───────────────────────┐     │
│   │   Signing in… ⏳      │     │  ← Disabled
│   └───────────────────────┘     │
└─────────────────────────────────┘


STATE 4: LOGIN ERROR
┌─────────────────────────────────┐
│   เข้าสู่ระบบ                    │
├─────────────────────────────────┤
│   ┌─────────────────────────┐   │
│   │ ❌ Username or Password │   │
│   │    is Incorrect         │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌───────────────────────┐     │
│   │ sales1                │     │
│   └───────────────────────┘     │
│                                 │
│   ┌───────────────────────┐     │
│   │ ••••••••      [👁️]    │     │
│   └───────────────────────┘     │
│                                 │
│   ┌───────────────────────┐     │
│   │     Sign in           │     │
│   └───────────────────────┘     │
└─────────────────────────────────┘


STATE 5: SUCCESS
┌─────────────────────────────────┐
│   เข้าสู่ระบบ                    │
├─────────────────────────────────┤
│                                 │
│   ┌───────────────────────┐     │
│   │ sales1                │     │
│   └───────────────────────┘     │
│                                 │
│   ┌───────────────────────┐     │
│   │ ••••••••      [👁️]    │     │
│   └───────────────────────┘     │
│                                 │
│   ┌───────────────────────┐     │
│   │     Sign in           │     │
│   └───────────────────────┘     │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  ✅ เข้าสู่ระบบสำเร็จ            │  ← Snackbar
│  ยินดีต้อนรับ คุณ Sara!          │
└─────────────────────────────────┘
        │
        ▼ (500ms delay)
┌─────────────────────────────────┐
│   /sales/products                │  ← Redirected
└─────────────────────────────────┘
```

---

## 📝 Quick Reference

### Validation Rules
```
Username:
  ✓ Required
  ✗ Empty string
  ✗ Whitespace only

Password:
  ✓ Required
  ✗ Empty string
  ✗ Whitespace only
```

### Error Messages
```
Frontend Validation:
  "Username is required"
  "Password is required"

Backend Validation:
  "Username or Password is Incorrect"  (400)
  "This account has been suspended."   (403)
  "เกิดข้อผิดพลาดในการเชื่อมต่อ..."     (Network Error)
```

### Success Flow
```
1. POST /api/auth/login
2. Receive JWT token + user data
3. Show Snackbar: "เข้าสู่ระบบสำเร็จ ✅ ยินดีต้อนรับ คุณ ${firstName}!"
4. Redirect to role landing page
   • ADMIN    → /admin/user-management
   • MANAGER  → /manager/dashboard
   • TRAINER  → /trainer/calendar-management
   • SALES    → /sales/products
   • CUSTOMER → /customer/calendar
```

---

**Document Version**: 1.0  
**Last Updated**: October 30, 2025  
**Purpose**: Visual reference for Login Flow implementation
