# 🧪 Payment Slip Verification - Test Guide (Stateless)

> **API Endpoint:** `POST /api/payments/verify-slip`  
> **Use Case:** ตรวจสอบสลิปการโอนเงินผ่าน Slip2Go API แบบ realtime (ไม่เก็บข้อมูล)  
> **Created:** October 31, 2025  
> **Updated:** October 31, 2025 - Simplified to stateless verification

---

## 📋 Test Overview

This test guide covers testing scenarios for the **stateless** Payment Slip Verification API:
- ✅ Successful verification flows (Mock mode + Real mode)
- ⚠️ Validation errors (missing file, invalid payload)
- 🔍 Slip2Go verification failures (amount/receiver mismatch)
- 🎛️ Mock mode toggle testing

**Note:** This API does NOT store data in database - it only calls Slip2Go API and returns results immediately.

---

## 🔧 Setup Instructions

### 1. Environment Configuration

**For Development/Testing (Mock Mode):**
```bash
# ใน .env
SLIP2GO_SECRET_KEY=50igZPNwcAd3hZOuw4VwVCj2fGPD_dT8ZZvpNviBwQU=
MOCK_SLIP2GO=true  # เปิดโหมด Mock (ไม่เรียก API จริง)
```

**For Production Testing (Real API):**
```bash
# ใน .env
SLIP2GO_SECRET_KEY=<your_real_api_key>
MOCK_SLIP2GO=false  # ปิดโหมด Mock (เรียก API จริง)
```

### 2. Prepare Test Data

**Required Data:**
- ✅ มีบัญชีธนาคารปลายทาง (account name, number, type)
- ✅ มีไฟล์รูปสลิปสำหรับทดสอบ (JPEG/PNG)
- ✅ ทราบจำนวนเงินที่ต้องการตรวจสอบ

---

## ✅ Test 1: Success - Mock Mode (ทดสอบพื้นฐาน)

**Purpose:** ทดสอบการทำงานพื้นฐานของ API ด้วย Mock mode (ไม่เรียก Slip2Go จริง)

**Prerequisites:**
- `MOCK_SLIP2GO=true` ใน .env

**Request:**
```bash
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@test-slip.jpg" \
  -F 'payload={
    "amount": 2599.50,
    "accountName": "Private Fitness - Main Account",
    "accountNumber": "123-4-56789-0",
    "accountType": "01004"
  }'
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Payment verified successfully.",
  "data": {
    "slipId": "MOCK_SLIP_12345",
    "verified": true
  }
}
```

**✅ Pass Criteria:**
- Response status = 200
- Response body มี status = "success"
- data.verified = true
- data.slipId มีค่า (MOCK_SLIP_*)

---

## ✅ Test 2: Success - Real API Mode (Production-like)

**Purpose:** ทดสอบการเรียก Slip2Go API จริง (ใช้เฉพาะเมื่อต้องการทดสอบ Production flow)

**Prerequisites:**
- `MOCK_SLIP2GO=false` ใน .env
- มี `SLIP2GO_SECRET_KEY` ที่ถูกต้อง
- มีไฟล์สลิปจริงที่ valid

**Request:**
```bash
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@real-slip.jpg" \
  -F 'payload={
    "amount": 3500.00,
    "accountName": "Private Fitness - Main Account",
    "accountNumber": "123-4-56789-0",
    "accountType": "01004",
    "paymentDate": "2025-10-31"
  }'
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Payment verified successfully.",
  "data": {
    "slipId": "SLIP_ABC123XYZ",
    "verified": true
  }
}
```

**✅ Pass Criteria:**
- Response status = 200
- data.verified = true
- slip_id มาจาก Slip2Go API (ไม่ใช่ MOCK_SLIP_*)

---

## ⚠️ Test 3: API Behavior - Stateless Verification

**Purpose:** ยืนยันว่า API เป็น stateless (ไม่เก็บข้อมูล)

**Note:** API นี้ไม่มี duplicate detection เพราะไม่เก็บข้อมูลใน database  
การยิง request ซ้ำจะได้ผลลัพธ์จาก Slip2Go API ใหม่ทุกครั้ง

**Request (ยิงซ้ำ 2 ครั้ง):**
```bash
# ครั้งที่ 1
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@test-slip.jpg" \
  -F 'payload={
    "amount": 2599.50,
    "accountName": "Private Fitness",
    "accountNumber": "123-4-56789-0",
    "accountType": "01004"
  }'

# ครั้งที่ 2 (ข้อมูลเดียวกัน)
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@test-slip.jpg" \
  -F 'payload={
    "amount": 2599.50,
    "accountName": "Private Fitness",
    "accountNumber": "123-4-56789-0",
    "accountType": "01004"
  }'
```

**Expected Behavior:**
- ✅ ทั้ง 2 ครั้งได้ response เหมือนกัน (verified: true หรือ false)
- ✅ ไม่มี error เกี่ยวกับ "duplicate"
- ✅ ไม่มีการบันทึกข้อมูลใน database

---

## ⚠️ Test 4: Validation Error - Missing File

**Purpose:** ทดสอบการ validate ไฟล์รูปสลิป

**Request:**
```bash
# ไม่ส่งไฟล์
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F 'payload={
    "amount": 2599.50,
    "accountName": "Private Fitness",
    "accountNumber": "123-4-56789-0",
    "accountType": "01004"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Missing slip image file"
}
```

**✅ Pass Criteria:**
- Response status = 400
- Message: "Missing slip image file"

---

## ⚠️ Test 5: Validation Error - Missing Payload

**Purpose:** ทดสอบการ validate payload JSON

**Request:**
```bash
# ไม่ส่ง payload
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@test-slip.jpg"
```

**Expected Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Missing payload data"
}
```

**✅ Pass Criteria:**
- Response status = 400
- Message: "Missing payload data"

---

## ⚠️ Test 6: Validation Error - Invalid Payload Format

**Purpose:** ทดสอบการ parse JSON payload

**Request:**
```bash
# ส่ง payload ที่ไม่ใช่ JSON
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@test-slip.jpg" \
  -F "payload=not-a-json-string"
```

**Expected Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Invalid payload format"
}
```

**✅ Pass Criteria:**
- Response status = 400
- Message: "Invalid payload format"

---

## ⚠️ Test 7: Validation Error - Missing Required Fields

**Purpose:** ทดสอบการ validate required fields ใน payload

**Request:**
```bash
# ไม่ส่ง username
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@test-slip.jpg" \
  -F 'payload={
    "productId": 11,
    "amount": 2599.50,
    "accountName": "Private Fitness",
    "accountNumber": "123-4-56789-0",
    "accountType": "01004"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "validation failed: username is required"
}
```

**✅ Pass Criteria:**
- Response status = 400
- Message กล่าวถึง required field ที่หายไป

---

## 🔍 Test 8: Slip2Go Failure - Amount Mismatch (Real API Only)

**Purpose:** ทดสอบกรณี Slip2Go ตรวจสอบแล้วพบว่าจำนวนเงินไม่ตรง

**Prerequisites:**
- `MOCK_SLIP2GO=false`
- ใช้สลิปจริงที่มีจำนวนเงินไม่ตรงกับ payload

**Request:**
```bash
# ส่ง amount ที่ไม่ตรงกับสลิป
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@real-slip-with-3000.jpg" \
  -F 'payload={
    "amount": 9999.99,
    "accountName": "Private Fitness",
    "accountNumber": "123-4-56789-0",
    "accountType": "01004"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Payment slip verification failed. Please check slip details and try again.",
  "data": {
    "slipId": "SLIP_DEF456",
    "verified": false
  }
}
```

**✅ Pass Criteria:**
- Response status = 400
- data.verified = false
- data.slipId มีค่า

---

## 🔍 Test 9: Slip2Go Failure - Receiver Mismatch (Real API Only)

**Purpose:** ทดสอบกรณีบัญชีปลายทางไม่ตรง

**Request:**
```bash
# ส่ง accountNumber ที่ไม่ตรงกับสลิป
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@real-slip.jpg" \
  -F 'payload={
    "amount": 3500.00,
    "accountName": "Wrong Account Name",
    "accountNumber": "999-9-99999-9",
    "accountType": "01004"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Payment slip verification failed. Please check slip details and try again.",
  "data": {
    "slipId": "SLIP_GHI789",
    "verified": false
  }
}
```

**✅ Pass Criteria:**
- Response status = 400
- data.verified = false

---

## 🎛️ Test 10: Mock Mode Toggle Testing

**Purpose:** ทดสอบการสลับระหว่าง Mock mode และ Real API mode

### Step 1: Test with Mock Mode ON
```bash
# เปิด Mock mode
echo "MOCK_SLIP2GO=true" >> .env

# Restart server
make run

# Test request
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@test-slip.jpg" \
  -F 'payload={"amount":1000.00,"accountName":"Test","accountNumber":"123456","accountType":"01004"}'
```

**Expected:** 
- ✅ verified = true
- ✅ slip_id = "MOCK_SLIP_*"
- ✅ ไม่เรียก Slip2Go API จริง

### Step 2: Test with Mock Mode OFF
```bash
# ปิด Mock mode
echo "MOCK_SLIP2GO=false" >> .env

# Restart server
make run

# Test request (ใช้สลิปจริง)
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@real-valid-slip.jpg" \
  -F 'payload={"amount":3500.00,"accountName":"Private Fitness","accountNumber":"123-4-56789-0","accountType":"01004"}'
```

**Expected:**
- ✅ verified = true (ถ้าสลิปถูกต้อง)
- ✅ slip_id มาจาก Slip2Go API (ไม่ใช่ MOCK_*)
- ✅ เรียก Slip2Go API จริง

---

## 📝 Summary Test Results

| Test # | Scenario | Expected Result | Status |
|--------|----------|-----------------|--------|
| 1 | Success - Mock Mode | 200, verified=true | ⬜ |
| 2 | Success - Real API | 200, verified=true | ⬜ |
| 3 | Stateless Behavior | No duplicate error | ⬜ |
| 4 | Missing File | 400, error message | ⬜ |
| 5 | Missing Payload | 400, error message | ⬜ |
| 6 | Invalid Payload Format | 400, error message | ⬜ |
| 7 | Missing Required Fields | 400, validation error | ⬜ |
| 8 | Amount Mismatch (Real API) | 400, verified=false | ⬜ |
| 9 | Receiver Mismatch (Real API) | 400, verified=false | ⬜ |
| 10 | Mock Toggle | Both modes work | ⬜ |

**Legend:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 🚀 Quick Test Commands

```bash
# 1. Start server
make run

# 2. Test basic verification (Mock mode)
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@test-slip.jpg" \
  -F 'payload={"amount":2599.50,"accountName":"Private Fitness","accountNumber":"123456","accountType":"01004"}'

# 3. Test with different amount (stateless - no duplicate error)
curl -X POST http://localhost:8000/api/payments/verify-slip \
  -F "file=@test-slip.jpg" \
  -F 'payload={"amount":1000.00,"accountName":"Private Fitness","accountNumber":"123456","accountType":"01004"}'
```

---

## 🎯 Notes

1. **Stateless Architecture:**
   - API ไม่เก็บข้อมูลใน database
   - ไม่มี duplicate detection
   - ผลลัพธ์ได้จาก Slip2Go API แบบ realtime
   - Frontend ต้องเก็บประวัติการชำระเองหากต้องการ

2. **Mock Mode Benefits:**
   - ไม่ใช้ Slip2Go API quota (ประหยัด 100 ครั้งทดสอบฟรี)
   - ทดสอบได้เร็วกว่า (ไม่ต้องรอ API response)
   - ไม่ต้องมีไฟล์สลิปจริง

3. **Real API Testing:**
   - ใช้เฉพาะเมื่อต้องการทดสอบ Production flow
   - ต้องมีไฟล์สลิปจริงที่ valid
   - ใช้ API quota 1 ครั้งต่อการทดสอบ

4. **Error Handling:**
   - ทุก error response มี status = "error"
   - Message อธิบายปัญหาชัดเจน
   - ไม่ throw exception ออกมาข้างนอก

---

**Test Completed:** ___/___/___ by _______________
