# 🛍️ Products Page - Golang Backend Integration

> **Status**: ✅ Integrated with Golang Backend  
> **Date**: October 31, 2025  
> **Page**: `/sales/products`

---

## 📝 Overview

แก้ไขหน้า Products (`/sales/products`) ให้ดึงข้อมูลจาก Golang Backend แทน Next.js API Routes

---

## 🔄 Changes Made

### 1. **Updated API Endpoints**

#### Before (Next.js API):
```typescript
// Sessions
const res = await fetch('/api/sessions');

// Durations
const res = await fetch('/api/durations');
```

#### After (Golang Backend):
```typescript
// Sessions
const res = await fetch('http://localhost:8000/api/products/sessions', {
  credentials: 'include',
});

// Durations
const res = await fetch('http://localhost:8000/api/products/durations', {
  credentials: 'include',
});
```

---

### 2. **Response Format Mapping**

#### Golang API Response:
```json
{
  "status": "success",
  "status_code": 200,
  "message": "Session products retrieved successfully",
  "result": [
    {
      "id": 10,
      "name": "Yoga Sessions - 5 Pack",
      "type": "SESSION",
      "category": "ECONOMIC",
      "listPrice": 1500.00,
      "durationDays": null,
      "sessionAmount": 5,
      "isActive": true,
      "paymentAccountId": 1,
      "createdAt": "2025-09-01T00:00:00Z",
      "updatedAt": "2025-10-30T00:00:00Z"
    }
  ]
}
```

#### Frontend Mapping:
```typescript
const products: Product[] = data.result.map((item: any) => ({
  productId: item.id,              // id → productId
  name: item.name,                 // same
  productType: item.type,          // type → productType
  productCategory: item.category,  // category → productCategory
  listPrice: item.listPrice,       // same
  price: item.listPrice,           // duplicate for compatibility
  sessionAmount: item.sessionAmount, // same
  durationDays: item.durationDays,   // same
  isActive: item.isActive,         // same
  createdAt: item.createdAt,       // same
  updatedAt: item.updatedAt,       // same
}));
```

---

### 3. **Added Loading & Error States**

```typescript
const [loading, setLoading] = React.useState(true);
const [error, setError] = React.useState<string | null>(null);

// Loading State
if (loading) {
  return (
    <div className="container py-6">
      <div className="text-center">กำลังโหลดข้อมูล...</div>
    </div>
  );
}

// Error State
if (error) {
  return (
    <div className="container py-6">
      <div className="text-center text-red-500">{error}</div>
    </div>
  );
}
```

---

### 4. **Empty State Handling**

```typescript
{sessions.length === 0 ? (
  <div className="text-gray-500">ไม่มีแพ็กเกจ Session</div>
) : (
  // Display session cards
)}

{durations.length === 0 ? (
  <div className="text-gray-500">ไม่มีแพ็กเกจ Duration</div>
) : (
  // Display duration cards
)}
```

---

## 🗂️ Files Modified

### 1. `/src/app/(internal)/sales/products/page.tsx`

**Changes:**
- ✅ เปลี่ยน API endpoint จาก `/api/sessions` → `http://localhost:8000/api/products/sessions`
- ✅ เปลี่ยน API endpoint จาก `/api/durations` → `http://localhost:8000/api/products/durations`
- ✅ เพิ่ม `credentials: 'include'` เพื่อส่ง Cookie
- ✅ แก้ response mapping รองรับ Golang format (`data.result`)
- ✅ เพิ่ม loading state
- ✅ เพิ่ม error handling
- ✅ เพิ่ม empty state messages

---

## 📊 API Specifications

### API 1: Get Session Products

**Endpoint:** `GET /api/products/sessions`

**Response:**
```json
{
  "status": "success",
  "status_code": 200,
  "message": "Session products retrieved successfully",
  "result": [
    {
      "id": 10,
      "name": "Yoga Sessions - 5 Pack",
      "type": "SESSION",
      "category": "ECONOMIC",
      "listPrice": 1500.00,
      "sessionAmount": 5,
      "isActive": true
    }
  ]
}
```

---

### API 2: Get Duration Products

**Endpoint:** `GET /api/products/durations`

**Response:**
```json
{
  "status": "success",
  "status_code": 200,
  "message": "Duration products retrieved successfully",
  "result": [
    {
      "id": 1,
      "name": "Monthly Gym Access - Basic",
      "type": "DURATION",
      "category": "ECONOMIC",
      "listPrice": 1200.00,
      "durationDays": 30,
      "isActive": true
    }
  ]
}
```

---

## 🧪 Testing Guide

### Test 1: Sessions Display

1. รัน Golang Backend: `http://localhost:8000`
2. รัน Next.js: `http://localhost:3000`
3. Login เข้าระบบด้วย Sales account
4. เปิดหน้า `/sales/products`
5. ตรวจสอบ:
   - ✅ แสดง "กำลังโหลดข้อมูล..." ขณะ loading
   - ✅ แสดงรายการ Session products ถูกต้อง
   - ✅ แต่ละ card แสดง: ชื่อ, Category, Price, Sessions

### Test 2: Durations Display

1. ตรวจสอบ:
   - ✅ แสดงรายการ Duration products ถูกต้อง
   - ✅ แต่ละ card แสดง: ชื่อ, Category, Price, Days

### Test 3: Empty State

1. ถ้าไม่มี products ใน database
2. ตรวจสอบ:
   - ✅ แสดงข้อความ "ไม่มีแพ็กเกจ Session"
   - ✅ แสดงข้อความ "ไม่มีแพ็กเกจ Duration"

### Test 4: Error Handling

1. ปิด Golang Backend
2. เปิดหน้า `/sales/products`
3. ตรวจสอบ:
   - ✅ แสดง error message สีแดง
   - ✅ Console แสดง error log

### Test 5: Register Links

1. คลิกปุ่ม "Register" ที่ Session Card
2. ตรวจสอบ:
   - ✅ Redirect ไป `/sales/products/session/{productId}/register`

3. คลิกปุ่ม "Register" ที่ Duration Card
4. ตรวจสอบ:
   - ✅ Redirect ไป `/sales/products/duration/{productId}/register`

---

## 🔍 Console Debugging

### Check Network Requests

เปิด DevTools → Network → Filter: "products"

**Expected Requests:**
1. `GET http://localhost:8000/api/products/sessions`
   - Status: 200 OK
   - Response: `{ status: "success", result: [...] }`

2. `GET http://localhost:8000/api/products/durations`
   - Status: 200 OK
   - Response: `{ status: "success", result: [...] }`

### Check Console Logs

```javascript
// Success
console.log('Sessions loaded:', sessions);
console.log('Durations loaded:', durations);

// Error
console.error('Error fetching sessions:', err);
console.error('Error fetching durations:', err);
```

---

## ⚠️ Known Issues

### Issue 1: CORS Error

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/api/products/sessions' 
has been blocked by CORS policy
```

**Solution:** ตรวจสอบ Golang Backend CORS config:
```go
app.Use(cors.New(cors.Config{
    AllowOrigins:     "http://localhost:3000",
    AllowCredentials: true,
}))
```

---

### Issue 2: Empty Array

**Symptoms:** แสดง "ไม่มีแพ็กเกจ"

**Solution:** 
1. ตรวจสอบ database มี products หรือไม่
2. ตรวจสอบ `Is_Active = true`
3. ตรวจสอบ Backend query filter

---

### Issue 3: Card Display Error

**Symptoms:** Card ไม่แสดงข้อมูลบางอย่าง

**Solution:** ตรวจสอบ field mapping:
- `item.id` → `productId`
- `item.type` → `productType`
- `item.category` → `productCategory`
- `item.listPrice` → `price`

---

## 📦 Dependencies

### Component Dependencies

- `SessionCard` → `/src/components/ui/SessionCard.tsx`
- `DurationCard` → `/src/components/ui/DurationCard.tsx`

### Type Dependencies

- `Product` type → `/src/types/product.ts`

---

## 🚀 Next Steps

### Phase 1: Display Products ✅
- [x] Fetch Session products from Golang API
- [x] Fetch Duration products from Golang API
- [x] Map response to Product type
- [x] Display cards with correct data
- [x] Add loading & error states

### Phase 2: Register Flow (Next)
- [ ] Implement `/sales/products/duration/{id}/register`
- [ ] Implement `/sales/products/session/{id}/register`
- [ ] Connect to Golang registration APIs

### Phase 3: Enhancement
- [ ] Add product search/filter
- [ ] Add pagination
- [ ] Add product sorting
- [ ] Add refresh button

---

## 📚 Related Documentation

- `docs/API_DOCUMENTATION.md` - Golang API reference (Section 2: Product APIs)
- `docs/LOGIN_GOLANG_INTEGRATION.md` - Login integration guide
- `src/types/product.ts` - Product type definitions

---

**Status**: ✅ Products Page Integrated  
**Last Updated**: October 31, 2025  
**Version**: 2.0 (Golang Backend)
