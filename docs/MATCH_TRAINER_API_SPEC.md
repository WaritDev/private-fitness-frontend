# 🎯 Match Trainer API Specification (Use Case 4S)

> **สำหรับ Backend Developer (Golang)**  
> **Frontend Ready**: `/sales/products/session/[id]/regis`  
> **Date**: October 31, 2025

---

## 📋 Overview

Frontend ได้พัฒนาหน้า Session Registration เสร็จแล้ว ซึ่งมี 3 Steps:
1. **Step 1**: Discount Offer (0-7%)
2. **Step 2**: Customer Info (ข้อมูลลูกค้าครบถ้วน)
3. **Step 3**: Trainer Matching (เลือกวันเวลา และจับคู่ Trainer อัตโนมัติ)

**ปัญหา**: ตอนนี้ Step 3 ใช้ **Mock Data** สำหรับการจับคู่ Trainer  
**ต้องการ**: Backend API เพื่อจับคู่ Trainer อัตโนมัติตาม Business Logic ใน Use Case 4S

---

## 🔧 API Endpoint Required

### **POST /api/trainers/match**

**Description**: จับคู่เทรนเนอร์ที่เหมาะสมที่สุดตามเวลาว่างและจำนวนนัดหมาย

**Business Logic** (ตาม Use Case 4S):
1. **Q4S.1**: หา Trainer ที่ว่างในวันและเวลาที่กำหนดจาก `training_availabilities`
2. **Q4S.2**: นับจำนวนนัดหมายของแต่ละ Trainer ในวันนั้นจาก `training_schedules`
3. **Q4S.3**: ตรวจสอบว่านัดหมายที่เลือกไม่ซ้อนกับนัดหมายเดิมของ Trainer
4. **Ranking**: เลือก Trainer ที่มีนัดหมายน้อยที่สุด และมีเวลาว่างตรงกับลูกค้ามากที่สุด
5. **ถ้าไม่พบ Trainer**: Return error "No Trainer Available"

---

## 📥 Request Format

**Endpoint:** `POST /api/trainers/match`

**Request Body:**
```json
{
  "schedules": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "10:00",
      "endTime": "12:00"
    },
    {
      "dayOfWeek": "WEDNESDAY",
      "startTime": "14:00",
      "endTime": "16:00"
    }
  ]
}
```

**Field Descriptions:**
- `schedules` (array, required): รายการนัดหมายที่ลูกค้าต้องการ
  - `dayOfWeek` (string): วันในสัปดาห์ (`"MONDAY"`, `"TUESDAY"`, etc.)
  - `startTime` (string): เวลาเริ่มต้น (format: `"HH:mm"`)
  - `endTime` (string): เวลาสิ้นสุด (format: `"HH:mm"`) - จะเป็น startTime + 2 ชม. เสมอ

---

## 📤 Response Format

### Success Response (200 OK)

```json
{
  "status": "success",
  "status_code": 200,
  "message": "Trainer matched successfully",
  "result": {
    "trainerUsername": "trainer1",
    "trainerName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "matchedSchedules": 2
  }
}
```

**Field Descriptions:**
- `trainerUsername`: Username ของ Trainer ที่จับคู่ได้
- `trainerName`: ชื่อเต็มของ Trainer (firstName + lastName)
- `firstName`: ชื่อจริง
- `lastName`: นามสกุล
- `matchedSchedules`: จำนวนนัดหมายที่จับคู่ได้

---

### Error Response - No Trainer Available (400 Bad Request)

```json
{
  "status": "error",
  "status_code": 400,
  "message": "No Trainer Available",
  "result": null
}
```

**เมื่อไหร่ที่จะ return error นี้:**
- ไม่มี Trainer คนใดว่างในเวลาที่ลูกค้าต้องการ
- Trainer ที่ว่างมีนัดหมายซ้อนกับช่วงเวลาที่ลูกค้าเลือก

---

### Error Response - Invalid Request (400 Bad Request)

```json
{
  "status": "error",
  "status_code": 400,
  "message": "schedules is required and must not be empty",
  "result": null
}
```

---

## 🔍 SQL Queries (ตาม Use Case 4S)

### Query Q4S.1: หา Trainer ที่ว่างในวันและเวลาที่กำหนด

```sql
SELECT 
  u.username,
  u.first_name,
  u.last_name,
  u.created_at
FROM users u
JOIN training_availabilities ta 
  ON ta.trainer_username = u.username
WHERE 
  u.role = 'TRAINER'
  AND u.is_active = TRUE
  AND ta.day_of_week = ?
  AND TIME(?) >= ta.start_time
  AND TIME(?) <= ta.end_time
ORDER BY u.created_at ASC;
```

**Parameters:**
- `?` (1st): `day_of_week` (e.g., `"MONDAY"`)
- `?` (2nd): `startTime` (e.g., `"10:00"`)
- `?` (3rd): `endTime` (e.g., `"12:00"`)

**Note**: ต้อง run query นี้สำหรับ **ทุกนัดหมาย** ใน `schedules` array

---

### Query Q4S.2: นับจำนวนนัดหมายของ Trainer ในวันนั้น

```sql
SELECT COUNT(*) as count
FROM training_schedules
WHERE trainer_username = ?
  AND schedule_type = 'APPOINTMENT'
  AND DATE(start_time) = DATE(?);
```

**Parameters:**
- `?` (1st): `trainer_username` (e.g., `"trainer1"`)
- `?` (2nd): `date` - วันที่ต้องการเช็ค (e.g., `"2025-11-05"`)

**Purpose**: ใช้สำหรับ ranking - Trainer ที่มี count น้อยกว่าจะได้ priority สูงกว่า

---

### Query Q4S.3: ตรวจสอบว่านัดหมายซ้อนกับนัดเดิมของ Trainer หรือไม่

```sql
SELECT COUNT(*) as count
FROM training_schedules
WHERE trainer_username = ?
  AND schedule_type = 'APPOINTMENT'
  AND start_time < ?
  AND end_time > ?;
```

**Parameters:**
- `?` (1st): `trainer_username`
- `?` (2nd): `end_time` ของนัดหมายใหม่ (RFC3339 format)
- `?` (3rd): `start_time` ของนัดหมายใหม่ (RFC3339 format)

**Logic**: ถ้า `count > 0` แสดงว่ามีนัดซ้อน → ต้องข้าม Trainer คนนี้

**Note**: ต้องเช็กสำหรับ **ทุกนัดหมาย** ใน `schedules` array

---

## 🎯 Algorithm Overview

```
1. สำหรับแต่ละ schedule ใน schedules array:
   1.1 Run Q4S.1 เพื่อหา Trainer ที่ว่างในเวลานั้น
   1.2 สร้าง Set ของ Trainer ที่ว่าง

2. หา Intersection (Trainer ที่ว่างทุกนัดหมาย):
   - เริ่มจาก Set แรก
   - ทำ Intersection กับ Set อื่นๆ
   - ได้ Set ของ Trainer ที่ว่างทั้งหมดทุกนัด

3. สำหรับแต่ละ Trainer ใน Intersection Set:
   3.1 Run Q4S.3 เพื่อเช็กว่านัดหมายซ้อนหรือไม่
   3.2 ถ้าซ้อน → ข้าม Trainer คนนี้
   3.3 ถ้าไม่ซ้อน → เพิ่มเข้า Candidate List

4. Ranking Candidates:
   4.1 สำหรับแต่ละ Candidate:
       - Run Q4S.2 เพื่อนับจำนวนนัดหมาย
       - เก็บค่า count ไว้
   4.2 Sort Candidates โดย count น้อย → มาก
   4.3 ถ้า count เท่ากัน → เลือกคนที่สร้าง account ก่อน (created_at ASC)

5. Return Trainer ที่อันดับ 1
   - ถ้าไม่มี Candidate → Return error "No Trainer Available"
```

---

## 💡 Frontend Integration

**File**: `/src/app/(internal)/sales/products/session/[id]/regis/page.tsx`

**Current Code** (Mock):
```typescript
async function handleMatchTrainer() {
  setMatching(true);
  try {
    // TODO: เรียก API สำหรับ Match Trainer
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Mock response
    const mockTrainerUsername = 'trainer1';
    const mockTrainerName = 'John Trainer';
    
    setS3((prev) => ({
      ...prev,
      matchedTrainerUsername: mockTrainerUsername,
      matchedTrainerName: mockTrainerName,
    }));
    
    setSnack({ open: true, message: `✅ จับคู่สำเร็จ!`, color: 'success' });
  } catch (err) {
    setErrors3({ match: 'ไม่พบ Trainer ที่ว่าง' });
    setSnack({ open: true, message: '❌ No Trainer Available', color: 'error' });
  } finally {
    setMatching(false);
  }
}
```

**Expected Code** (ใช้ Real API):
```typescript
async function handleMatchTrainer() {
  setMatching(true);
  try {
    const response = await fetch(`${API_BASE_URL}/api/trainers/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        schedules: s3.schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      }),
    });

    const data = await response.json();

    if (data.status === 'success' && data.result) {
      setS3((prev) => ({
        ...prev,
        matchedTrainerUsername: data.result.trainerUsername,
        matchedTrainerName: data.result.trainerName,
      }));

      setSnack({
        open: true,
        message: `✅ จับคู่สำเร็จ! Trainer: ${data.result.trainerName}`,
        color: 'success',
      });
    } else {
      throw new Error(data.message || 'No Trainer Available');
    }
  } catch (err) {
    console.error('Error matching trainer:', err);
    setErrors3({ match: 'ไม่พบ Trainer ที่ว่าง กรุณาเปลี่ยนเวลานัดหมาย' });
    setSnack({
      open: true,
      message: '❌ No Trainer Available',
      color: 'error',
    });
  } finally {
    setMatching(false);
  }
}
```

---

## ✅ Testing Scenarios

### Test Case 1: Success - Trainer พร้อมให้บริการ

**Request:**
```json
{
  "schedules": [
    { "dayOfWeek": "MONDAY", "startTime": "10:00", "endTime": "12:00" },
    { "dayOfWeek": "WEDNESDAY", "startTime": "14:00", "endTime": "16:00" }
  ]
}
```

**Expected Response:**
```json
{
  "status": "success",
  "result": {
    "trainerUsername": "trainer1",
    "trainerName": "John Doe",
    "matchedSchedules": 2
  }
}
```

---

### Test Case 2: Error - ไม่มี Trainer ว่าง

**Request:**
```json
{
  "schedules": [
    { "dayOfWeek": "SUNDAY", "startTime": "22:00", "endTime": "00:00" }
  ]
}
```

**Expected Response:**
```json
{
  "status": "error",
  "status_code": 400,
  "message": "No Trainer Available",
  "result": null
}
```

---

### Test Case 3: Error - นัดหมายซ้อนกับนัดเดิม

**Setup**: 
- trainer1 มีนัดเดิมที่ MONDAY 10:00-11:00

**Request:**
```json
{
  "schedules": [
    { "dayOfWeek": "MONDAY", "startTime": "10:30", "endTime": "12:30" }
  ]
}
```

**Expected Response:**
```json
{
  "status": "error",
  "message": "No Trainer Available"
}
```

---

### Test Case 4: Multiple Trainers - เลือกคนที่นัดหมายน้อยที่สุด

**Setup**:
- trainer1: มี 5 นัดหมายใน MONDAY
- trainer2: มี 2 นัดหมายใน MONDAY
- ทั้งคู่ว่างที่ MONDAY 14:00-16:00

**Request:**
```json
{
  "schedules": [
    { "dayOfWeek": "MONDAY", "startTime": "14:00", "endTime": "16:00" }
  ]
}
```

**Expected Response:**
```json
{
  "status": "success",
  "result": {
    "trainerUsername": "trainer2",
    "trainerName": "Jane Smith"
  }
}
```

---

## 📝 Notes for Backend Developer

1. **Time Format Conversion**:
   - Frontend ส่ง: `"10:00"` (HH:mm)
   - Database ใช้: `TIME` type หรือ `DATETIME` type
   - ต้อง convert format ให้ถูกต้องก่อน query

2. **Date Calculation**:
   - Frontend ไม่ส่ง specific date มา (เพราะเป็นนัดประจำซ้ำทุกสัปดาห์)
   - Backend ต้องใช้ `day_of_week` ใน Q4S.1 และ Q4S.2
   - สำหรับ Q4S.3 อาจต้องสมมติ date เริ่มต้น เช่น next occurrence ของวันนั้น

3. **Performance**:
   - ถ้ามี Trainer เยอะ → อาจต้อง optimize query
   - พิจารณาใช้ `LIMIT` ใน Q4S.1 เพื่อลดจำนวน candidates

4. **Edge Cases**:
   - ลูกค้าเลือกหลายนัดในวันเดียวกัน (เช่น MONDAY 10:00-12:00 และ MONDAY 14:00-16:00)
   - Trainer ทุกคนมีนัดหมายเต็มแล้ว
   - เวลาข้ามวัน (เช่น 23:00-01:00)

5. **Authorization**:
   - API นี้ควรเรียกได้โดย **SALES role เท่านั้น**
   - ต้อง check JWT token

---

## 🚀 Priority

**Priority**: **HIGH** 🔥  
**Reason**: Frontend พร้อมใช้งานแล้ว แต่ใช้ Mock Data อยู่

**Estimate**: 4-6 hours

**Dependencies**:
- Database tables: `users`, `training_availabilities`, `training_schedules`
- Use Case 4S specification

---

## 📧 Contact

หากมีคำถามเพิ่มเติม กรุณาติดต่อ Frontend Team
