'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Paper, Stepper, Step, StepLabel, Button, TextField,
  Typography, MenuItem, Alert, Grid, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, FormControl, InputLabel, CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/contexts/AuthProvider';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Regex Validation
const PHONE_RE = /^[0-9]{10}$/;
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

// Helper: Format money (Thai Baht)
function money(n: number) {
  try {
    return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });
  } catch {
    return `${n} THB`;
  }
}

// Helper: Calculate age
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

// ==================== TYPE DEFINITIONS ====================

// Schedule item for Step 3
type ScheduleItem = {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY' | '';
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format (auto-calculated: startTime + 2 hours)
};

// Step 1: Discount Offer
type Step1 = {
  discountPercent: string; // 0-7%
};

// Step 2: Customer Info
type Step2 = {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  dateOfBirth: string;
  phone: string;
  email: string;
  healthInfo: string;
  address: string;
  companyName: string;
  companyPosition: string;
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | '';
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  marketingSource: string;
};

// Step 3: Trainer Matching
type Step3 = {
  schedules: ScheduleItem[];
  matchedTrainerUsername: string;
  matchedTrainerName: string;
};

// ==================== MAIN COMPONENT ====================

export default function SessionRegisterPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id ?? NaN);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // ✅ ดึงข้อมูล current user

  // Stepper state (3 Steps)
  const [activeStep, setActiveStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [validating, setValidating] = React.useState(false);
  const [matching, setMatching] = React.useState(false);

  // Product info
  const [productName, setProductName] = React.useState<string>('');
  const [basePrice, setBasePrice] = React.useState<number>(0);
  const [sessionAmount, setSessionAmount] = React.useState<number | null>(null);

  // Step states
  const [s1, setS1] = React.useState<Step1>({ discountPercent: '0' });
  const [s2, setS2] = React.useState<Step2>({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    healthInfo: '',
    address: '',
    companyName: '',
    companyPosition: '',
    maritalStatus: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    marketingSource: '',
  });
  const [s3, setS3] = React.useState<Step3>({
    schedules: [],
    matchedTrainerUsername: '',
    matchedTrainerName: '',
  });

  // Current schedule being added
  const [currentSchedule, setCurrentSchedule] = React.useState<ScheduleItem>({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
  });

  // Pricing
  const [pricePaid, setPricePaid] = React.useState<number>(0);
  const [discountAmount, setDiscountAmount] = React.useState<number>(0);

  // Error states
  const [errors1, setErrors1] = React.useState<Partial<Record<keyof Step1, string>>>({});
  const [errors2, setErrors2] = React.useState<Partial<Record<keyof Step2, string>>>({});
  const [errors3, setErrors3] = React.useState<{ schedule?: string; match?: string }>({});

  // Snackbar
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; color: 'success' | 'error' }>({
    open: false,
    message: '',
    color: 'success',
  });

  // Validation status
  const [checkingPhone, setCheckingPhone] = React.useState(false);
  const [checkingEmail, setCheckingEmail] = React.useState(false);

  // ==================== LOAD PRODUCT DATA ====================
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        if (cancelled) return;

        if (res.statusText === 'OK' && data) {
          setProductName(data.name || '');
          const price = data.listPrice || 0;
          setBasePrice(price);
          setSessionAmount(data.sessionAmount || null);
          setPricePaid(price);
          setDiscountAmount(0);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        if (!cancelled) {
          setSnack({ open: true, message: 'ไม่สามารถโหลดข้อมูลสินค้าได้', color: 'error' });
        }
      }
    }
    if (Number.isFinite(productId)) load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // ==================== STEP 1: DISCOUNT OFFER ====================
  function applyDiscountPercent(percent: string) {
    const pct = Math.max(0, Math.min(7, Number(percent) || 0));
    setS1({ discountPercent: String(pct) });

    const discountAmt = Math.round(basePrice * (pct / 100));
    const paid = basePrice - discountAmt;

    setPricePaid(paid);
    setDiscountAmount(discountAmt);
  }

  function validateStep1(): boolean {
    const e: Partial<Record<keyof Step1, string>> = {};
    const pct = Number(s1.discountPercent);
    if (isNaN(pct) || pct < 0 || pct > 7) {
      e.discountPercent = 'ส่วนลดต้องอยู่ระหว่าง 0-7%';
    }
    setErrors1(e);
    return Object.keys(e).length === 0;
  }

  // ==================== STEP 2: CUSTOMER INFO ====================
  function setS2Field<K extends keyof Step2>(k: K, v: Step2[K]) {
    setS2((p) => ({ ...p, [k]: v }));
    setErrors2((e) => {
      const newE = { ...e };
      delete newE[k];
      return newE;
    });
  }

  async function checkPhoneDuplicate(phone: string): Promise<boolean> {
    if (!phone || !PHONE_RE.test(phone)) return true;
    setCheckingPhone(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/check-phone?phone=${phone}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.status === 'success' && data.result?.exists) {
        setErrors2((e) => ({ ...e, phone: 'เบอร์โทรนี้ถูกใช้งานแล้ว' }));
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error checking phone:', err);
      return true;
    } finally {
      setCheckingPhone(false);
    }
  }

  async function checkEmailDuplicate(email: string): Promise<boolean> {
    if (!email || !EMAIL_RE.test(email.toLowerCase())) return true;
    setCheckingEmail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/check-gmail?gmail=${encodeURIComponent(email)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.status === 'success' && data.result?.exists) {
        setErrors2((e) => ({ ...e, email: 'อีเมลนี้ถูกใช้งานแล้ว' }));
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error checking email:', err);
      return true;
    } finally {
      setCheckingEmail(false);
    }
  }

  async function checkDuplicateBeforeNext(): Promise<boolean> {
    setValidating(true);
    try {
      const [phoneOk, emailOk] = await Promise.all([
        checkPhoneDuplicate(s2.phone),
        checkEmailDuplicate(s2.email),
      ]);
      return phoneOk && emailOk;
    } catch (err) {
      console.error('Error in checkDuplicateBeforeNext:', err);
      return true;
    } finally {
      setValidating(false);
    }
  }

  async function validateStep2(): Promise<boolean> {
    const e: Partial<Record<keyof Step2, string>> = {};

    // Required fields
    if (!s2.firstName.trim()) e.firstName = 'กรุณากรอกชื่อ';
    if (!s2.lastName.trim()) e.lastName = 'กรุณากรอกนามสกุล';
    if (!s2.gender) e.gender = 'กรุณาเลือกเพศ';
    if (!s2.dateOfBirth) e.dateOfBirth = 'กรุณาเลือกวันเกิด';
    if (!s2.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทร';
    if (!s2.email.trim()) e.email = 'กรุณากรอกอีเมล';
    if (!s2.healthInfo.trim()) e.healthInfo = 'กรุณากรอกข้อมูลสุขภาพ';
    if (!s2.address.trim()) e.address = 'กรุณากรอกที่อยู่';
    if (!s2.companyName.trim()) e.companyName = 'กรุณากรอกชื่อบริษัท';
    if (!s2.companyPosition.trim()) e.companyPosition = 'กรุณากรอกตำแหน่ง';
    if (!s2.maritalStatus) e.maritalStatus = 'กรุณาเลือกสถานะสมรส';
    if (!s2.marketingSource.trim()) e.marketingSource = 'กรุณากรอกแหล่งที่รู้จัก';
    if (!s2.emergencyContactName.trim()) e.emergencyContactName = 'กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน';
    if (!s2.emergencyContactRelationship.trim()) e.emergencyContactRelationship = 'กรุณากรอกความสัมพันธ์';
    if (!s2.emergencyContactPhone.trim()) e.emergencyContactPhone = 'กรุณากรอกเบอร์โทรผู้ติดต่อฉุกเฉิน';

    // Format validation
    if (s2.phone && !PHONE_RE.test(s2.phone)) {
      e.phone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก';
    }
    if (s2.email && !EMAIL_RE.test(s2.email.toLowerCase())) {
      e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (s2.emergencyContactPhone && !PHONE_RE.test(s2.emergencyContactPhone)) {
      e.emergencyContactPhone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก';
    }

    // Age validation (>= 14 years old)
    if (s2.dateOfBirth) {
      const age = calculateAge(s2.dateOfBirth);
      if (age < 14) {
        e.dateOfBirth = 'อายุต้องไม่น้อยกว่า 14 ปี';
      }
    }

    setErrors2(e);
    if (Object.keys(e).length > 0) {
      return false;
    }

    // Check duplicate
    const duplicateOk = await checkDuplicateBeforeNext();
    return duplicateOk;
  }

  // ==================== STEP 3: TRAINER MATCHING ====================

  // Auto-calculate end time (start time + 2 hours)
  function calculateEndTime(startTime: string): string {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 2) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // Add schedule to list
  function handleAddSchedule() {
    setErrors3({});
    
    // Validate current schedule
    if (!currentSchedule.dayOfWeek) {
      setErrors3({ schedule: 'กรุณาเลือกวันในสัปดาห์' });
      return;
    }
    if (!currentSchedule.startTime) {
      setErrors3({ schedule: 'กรุณาเลือกเวลาเริ่มต้น' });
      return;
    }

    // Check duplicate
    const isDuplicate = s3.schedules.some(
      (s) => s.dayOfWeek === currentSchedule.dayOfWeek && s.startTime === currentSchedule.startTime
    );

    if (isDuplicate) {
      setErrors3({ schedule: 'นัดหมายนี้มีอยู่แล้ว' });
      return;
    }

    // Add to list
    const newSchedule: ScheduleItem = {
      ...currentSchedule,
      endTime: calculateEndTime(currentSchedule.startTime),
    };

    setS3((prev) => ({
      ...prev,
      schedules: [...prev.schedules, newSchedule],
    }));

    // Reset form
    setCurrentSchedule({
      dayOfWeek: '',
      startTime: '',
      endTime: '',
    });
  }

  // Remove schedule from list
  function handleRemoveSchedule(index: number) {
    setS3((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  }

  // Match Trainer (Call Backend API)
  async function handleMatchTrainer() {
    setErrors3({});
    
    // Validate schedules
    if (s3.schedules.length === 0) {
      setErrors3({ match: 'กรุณาเพิ่มนัดหมายอย่างน้อย 1 รายการ' });
      return;
    }

    setMatching(true);

    try {
      // ✅ เรียก Backend API สำหรับ Match Trainer
      // API Endpoint: POST /api/trainers/match (ส่งทีละ schedule)
      // Request Body: { dayOfWeek, startTime, endTime }
      // Response: { status: "OK", result: { trainerUsername, trainerName } }
      
      // เรียก API สำหรับ schedule แรก (สมมติว่าทุก schedule ต้องการ trainer คนเดียวกัน)
      const firstSchedule = s3.schedules[0];
      
      // แปลง time format จาก "HH:mm" เป็น ISO 8601 (สมมติวันที่เริ่มต้น)
      const today = new Date();
      const startDateTime = new Date(today);
      const [startHour, startMin] = firstSchedule.startTime.split(':').map(Number);
      startDateTime.setHours(startHour, startMin, 0, 0);
      
      const endDateTime = new Date(today);
      const [endHour, endMin] = firstSchedule.endTime.split(':').map(Number);
      endDateTime.setHours(endHour, endMin, 0, 0);

      const response = await fetch(`${API_BASE_URL}/api/trainers/match`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayOfWeek: firstSchedule.dayOfWeek,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      const data = await response.json();
      console.log('🔍 Match trainer response:', data);

      if (data.status === 'OK' && data.result) {
        const trainer = data.result;
        setS3((prev) => ({
          ...prev,
          matchedTrainerUsername: trainer.trainerUsername,
          matchedTrainerName: trainer.trainerName,
        }));

        setSnack({
          open: true,
          message: `✅ จับคู่สำเร็จ! Trainer: ${trainer.trainerName}`,
          color: 'success',
        });
      } else if (data.status_code === 404) {
        throw new Error('ไม่พบ Trainer ที่ว่างในช่วงเวลานี้');
      } else {
        throw new Error(data.message || 'No trainer found');
      }
    } catch (err) {
      console.error('❌ Error matching trainer:', err);
      const errorMsg = err instanceof Error ? err.message : 'ไม่พบ Trainer ที่ว่าง';
      setErrors3({ match: errorMsg });
      setSnack({
        open: true,
        message: `❌ ${errorMsg}`,
        color: 'error',
      });
    } finally {
      setMatching(false);
    }
  }

  function validateStep3(): boolean {
    setErrors3({});
    
    if (s3.schedules.length === 0) {
      setErrors3({ match: 'กรุณาเพิ่มนัดหมายอย่างน้อย 1 รายการ' });
      return false;
    }

    if (!s3.matchedTrainerUsername) {
      setErrors3({ match: 'กรุณากดปุ่ม "Match Trainer" เพื่อจับคู่เทรนเนอร์' });
      return false;
    }

    return true;
  }

  // ==================== NAVIGATION ====================

  async function onNext() {
    if (activeStep === 0) {
      // Step 1: Discount Offer
      if (!validateStep1()) return;
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Step 2: Customer Info - validate and check duplicates
      const valid = await validateStep2();
      if (!valid) return;
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Step 3: Trainer Matching - validate then redirect to payment
      if (!validateStep3()) return;
      redirectToPayment();
    }
  }

  function onBack() {
    setActiveStep((prev) => Math.max(0, prev - 1));
  }

  // ==================== REDIRECT TO PAYMENT (Use Case 6C) ====================

  function redirectToPayment() {
    // เก็บข้อมูลใน sessionStorage เพื่อส่งไปหน้า Payment
    const orderData = {
      // Product info
      productId: productId,
      productName: productName,
      productType: 'SESSION',
      sessionAmount: sessionAmount || 0,
      basePrice: basePrice,
      discountAmount: discountAmount,
      discountPercent: Number(s1.discountPercent),
      pricePaid: pricePaid,
      
      // Customer info (Use Case 3S)
      firstName: s2.firstName,
      lastName: s2.lastName,
      gender: s2.gender,
      dateOfBirth: s2.dateOfBirth,
      phone: s2.phone,
      email: s2.email,
      healthInfo: s2.healthInfo,
      address: s2.address,
      companyName: s2.companyName,
      companyPosition: s2.companyPosition,
      maritalStatus: s2.maritalStatus,
      emergencyContactName: s2.emergencyContactName,
      emergencyContactRelationship: s2.emergencyContactRelationship,
      emergencyContactPhone: s2.emergencyContactPhone,
      marketingSource: s2.marketingSource,
      
      // Session-specific info (Use Case 4S)
      schedules: s3.schedules,
      trainerUsername: s3.matchedTrainerUsername,
      trainerName: s3.matchedTrainerName,
      
      // Sales info
      salesUsername: user?.sub || 'unknown', // ✅ ดึงจาก current logged-in user
      
      // Meta info
      source: 'sales-registration', // เพื่อแยกว่ามาจาก Sales Flow
      timestamp: new Date().toISOString(),
    };

    // เก็บข้อมูลลง sessionStorage (จะหายเมื่อปิด tab)
    // ใช้ key เดียวกับ Duration เพื่อความง่ายในการ maintain
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));

    // Redirect ไปหน้า Payment โดยตรง (Sales Flow: Register → Payment → Create Account)
    router.push(`/customer/package/${productId}/payment`);
  }

  // ==================== RENDER ====================
  const steps = ['Discount Offer', 'Customer Info', 'Trainer Matching'];

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        ลงทะเบียนแพ็กเกจ Session: {productName}
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 } }} elevation={2}>
        {/* Stepper - 3 Steps (Sales Flow: 4S) */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Snackbar */}
        {snack.open && (
          <Alert severity={snack.color} onClose={() => setSnack({ ...snack, open: false })} sx={{ mb: 2 }}>
            {snack.message}
          </Alert>
        )}

        {/* ==================== STEP 1: DISCOUNT OFFER (Use Case 2S) ==================== */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              เสนอส่วนลด (Discount Offer)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              ส่วนลดสูงสุด 7% สำหรับการจูงใจลูกค้า
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ส่วนลด (%)"
                  type="number"
                  value={s1.discountPercent}
                  onChange={(e) => applyDiscountPercent(e.target.value)}
                  error={!!errors1.discountPercent}
                  helperText={errors1.discountPercent || 'ระบุส่วนลด 0-7%'}
                  fullWidth
                  inputProps={{ min: 0, max: 7, step: 0.1 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2">ราคาปกติ: {money(basePrice)}</Typography>
                  <Typography variant="body2">ส่วนลด: {money(discountAmount)}</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    ราคาหลังหักส่วนลด: {money(pricePaid)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={onNext}>
                ถัดไป (Next)
              </Button>
            </Box>
          </Box>
        )}

        {/* STEP 2: CUSTOMER INFO */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              ข้อมูลลูกค้า
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="ชื่อ"
                  value={s2.firstName}
                  onChange={(e) => setS2Field('firstName', e.target.value)}
                  error={!!errors2.firstName}
                  helperText={errors2.firstName}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="นามสกุล"
                  value={s2.lastName}
                  onChange={(e) => setS2Field('lastName', e.target.value)}
                  error={!!errors2.lastName}
                  helperText={errors2.lastName}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  select
                  label="เพศ"
                  value={s2.gender}
                  onChange={(e) => setS2Field('gender', e.target.value as any)}
                  error={!!errors2.gender}
                  helperText={errors2.gender}
                >
                  <MenuItem value="MALE">ชาย</MenuItem>
                  <MenuItem value="FEMALE">หญิง</MenuItem>
                  <MenuItem value="OTHER">อื่นๆ</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="วันเกิด"
                  value={s2.dateOfBirth}
                  onChange={(e) => setS2Field('dateOfBirth', e.target.value)}
                  error={!!errors2.dateOfBirth}
                  helperText={errors2.dateOfBirth}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="เบอร์โทร"
                  value={s2.phone}
                  onChange={(e) => setS2Field('phone', e.target.value)}
                  onBlur={() => checkPhoneDuplicate(s2.phone)}
                  error={!!errors2.phone}
                  helperText={errors2.phone || (checkingPhone ? 'กำลังตรวจสอบ...' : '')}
                  disabled={checkingPhone}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="อีเมล"
                  value={s2.email}
                  onChange={(e) => setS2Field('email', e.target.value)}
                  onBlur={() => checkEmailDuplicate(s2.email)}
                  error={!!errors2.email}
                  helperText={errors2.email || (checkingEmail ? 'กำลังตรวจสอบ...' : '')}
                  disabled={checkingEmail}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={2}
                  label="ข้อมูลสุขภาพ"
                  value={s2.healthInfo}
                  onChange={(e) => setS2Field('healthInfo', e.target.value)}
                  error={!!errors2.healthInfo}
                  helperText={errors2.healthInfo}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={2}
                  label="ที่อยู่"
                  value={s2.address}
                  onChange={(e) => setS2Field('address', e.target.value)}
                  error={!!errors2.address}
                  helperText={errors2.address}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="ชื่อบริษัท"
                  value={s2.companyName}
                  onChange={(e) => setS2Field('companyName', e.target.value)}
                  error={!!errors2.companyName}
                  helperText={errors2.companyName}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="ตำแหน่ง"
                  value={s2.companyPosition}
                  onChange={(e) => setS2Field('companyPosition', e.target.value)}
                  error={!!errors2.companyPosition}
                  helperText={errors2.companyPosition}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  select
                  label="สถานะสมรส"
                  value={s2.maritalStatus}
                  onChange={(e) => setS2Field('maritalStatus', e.target.value as any)}
                  error={!!errors2.maritalStatus}
                  helperText={errors2.maritalStatus}
                >
                  <MenuItem value="SINGLE">โสด</MenuItem>
                  <MenuItem value="MARRIED">สมรส</MenuItem>
                  <MenuItem value="DIVORCED">หย่าร้าง</MenuItem>
                  <MenuItem value="WIDOWED">หม้าย</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="แหล่งที่รู้จัก"
                  value={s2.marketingSource}
                  onChange={(e) => setS2Field('marketingSource', e.target.value)}
                  error={!!errors2.marketingSource}
                  helperText={errors2.marketingSource}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
                  ผู้ติดต่อฉุกเฉิน
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="ชื่อผู้ติดต่อ"
                  value={s2.emergencyContactName}
                  onChange={(e) => setS2Field('emergencyContactName', e.target.value)}
                  error={!!errors2.emergencyContactName}
                  helperText={errors2.emergencyContactName}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="ความสัมพันธ์"
                  value={s2.emergencyContactRelationship}
                  onChange={(e) => setS2Field('emergencyContactRelationship', e.target.value)}
                  error={!!errors2.emergencyContactRelationship}
                  helperText={errors2.emergencyContactRelationship}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  required
                  label="เบอร์โทรผู้ติดต่อ"
                  value={s2.emergencyContactPhone}
                  onChange={(e) => setS2Field('emergencyContactPhone', e.target.value)}
                  error={!!errors2.emergencyContactPhone}
                  helperText={errors2.emergencyContactPhone}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* STEP 3: TRAINER MATCHING */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              เลือกวันเวลาสะดวก และจับคู่เทรนเนอร์
            </Typography>

            {/* Add Schedule Form */}
            <Paper sx={{ p: 2, mt: 2, bgcolor: '#f9f9f9' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                เพิ่มนัดหมาย (1 Session = 2 ชั่วโมง)
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>วันในสัปดาห์</InputLabel>
                    <Select
                      value={currentSchedule.dayOfWeek}
                      label="วันในสัปดาห์"
                      onChange={(e) =>
                        setCurrentSchedule({
                          ...currentSchedule,
                          dayOfWeek: e.target.value as any,
                        })
                      }
                    >
                      <MenuItem value="MONDAY">จันทร์</MenuItem>
                      <MenuItem value="TUESDAY">อังคาร</MenuItem>
                      <MenuItem value="WEDNESDAY">พุธ</MenuItem>
                      <MenuItem value="THURSDAY">พฤหัสบดี</MenuItem>
                      <MenuItem value="FRIDAY">ศุกร์</MenuItem>
                      <MenuItem value="SATURDAY">เสาร์</MenuItem>
                      <MenuItem value="SUNDAY">อาทิตย์</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="time"
                    label="เวลาเริ่มต้น"
                    value={currentSchedule.startTime}
                    onChange={(e) =>
                      setCurrentSchedule({
                        ...currentSchedule,
                        startTime: e.target.value,
                        endTime: calculateEndTime(e.target.value),
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="เวลาสิ้นสุด (อัตโนมัติ)"
                    value={currentSchedule.endTime}
                    disabled
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddSchedule}
                    fullWidth
                  >
                    เพิ่มนัดหมาย
                  </Button>
                </Grid>
              </Grid>
              {errors3.schedule && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errors3.schedule}
                </Alert>
              )}
            </Paper>

            {/* Schedule List */}
            {s3.schedules.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>วัน</TableCell>
                      <TableCell>เวลาเริ่ม</TableCell>
                      <TableCell>เวลาสิ้นสุด</TableCell>
                      <TableCell align="center">ลบ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {s3.schedules.map((schedule, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {schedule.dayOfWeek === 'MONDAY' && 'จันทร์'}
                          {schedule.dayOfWeek === 'TUESDAY' && 'อังคาร'}
                          {schedule.dayOfWeek === 'WEDNESDAY' && 'พุธ'}
                          {schedule.dayOfWeek === 'THURSDAY' && 'พฤหัสบดี'}
                          {schedule.dayOfWeek === 'FRIDAY' && 'ศุกร์'}
                          {schedule.dayOfWeek === 'SATURDAY' && 'เสาร์'}
                          {schedule.dayOfWeek === 'SUNDAY' && 'อาทิตย์'}
                        </TableCell>
                        <TableCell>{schedule.startTime}</TableCell>
                        <TableCell>{schedule.endTime}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveSchedule(idx)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Match Trainer Button */}
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleMatchTrainer}
                disabled={matching || s3.schedules.length === 0}
                fullWidth
                size="large"
              >
                {matching ? <CircularProgress size={24} /> : 'Match Trainer'}
              </Button>
            </Box>

            {/* Matched Trainer Display */}
            {s3.matchedTrainerUsername && (
              <Paper sx={{ p: 2, mt: 3, bgcolor: '#e8f5e9' }}>
                <Typography variant="h6" color="success.main">
                  ✅ จับคู่สำเร็จ!
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Trainer:</strong> {s3.matchedTrainerName} ({s3.matchedTrainerUsername})
                </Typography>
              </Paper>
            )}

            {/* Error Message */}
            {errors3.match && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors3.match}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2 & 3 Navigation */}
        {activeStep > 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={onBack}>ย้อนกลับ (Back)</Button>
            <Button variant="contained" onClick={onNext} disabled={validating || matching || submitting}>
              {validating || matching ? 'กำลังตรวจสอบข้อมูล...' : activeStep === steps.length - 1 ? 'ไปหน้าชำระเงิน (Next)' : 'ถัดไป (Next)'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}