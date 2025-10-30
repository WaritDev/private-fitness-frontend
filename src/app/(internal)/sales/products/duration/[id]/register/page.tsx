'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Paper, Stepper, Step, StepLabel, Button, TextField,
  Typography, MenuItem, Alert,
  Grid,
} from '@mui/material';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Regex Validation (from Data Dictionary)
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
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

// Helper: Calculate age from date of birth
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

// Step 1: Discount Offer (Use Case 2S)
type Step1 = {
  discountPercent: string; // 0-7%
};

// Step 2: Customer Info (Use Case 3S) - รวม Customer Info + Additional Info
type Step2 = {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
  dateOfBirth: string; // YYYY-MM-DD
  phone: string; // 10 digits
  email: string; // valid email format
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

// Step 3: Duration Details (Price confirmation)
type Step3 = {
  pricePaid: string;
  discountAmount: string;
};

// Step 4: Account Credentials
type Step4 = {
  username: string;
  password: string;
  confirmPassword: string;
};

// ==================== MAIN COMPONENT ====================

export default function DurationRegisterPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id ?? NaN);
  const router = useRouter();

  // Stepper state
  const [activeStep, setActiveStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  // Product info from backend
  const [productName, setProductName] = React.useState<string>('');
  const [basePrice, setBasePrice] = React.useState<number>(0);
  const [durationDays, setDurationDays] = React.useState<number | null>(null);

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
  const [s3, setS3] = React.useState<Step3>({ pricePaid: '0', discountAmount: '0' });
  const [s4, setS4] = React.useState<Step4>({ username: '', password: '', confirmPassword: '' });

  // Error states
  const [errors1, setErrors1] = React.useState<Partial<Record<keyof Step1, string>>>({});
  const [errors2, setErrors2] = React.useState<Partial<Record<keyof Step2, string>>>({});
  const [errors3, setErrors3] = React.useState<Partial<Record<keyof Step3, string>>>({});
  const [errors4, setErrors4] = React.useState<Partial<Record<keyof Step4, string>>>({});

  // Snackbar
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; color: 'success' | 'error' }>({
    open: false,
    message: '',
    color: 'success',
  });

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

        if (data.status === 'success' && data.result) {
          setProductName(data.result.name || '');
          setBasePrice(data.result.listPrice || 0);
          setDurationDays(data.result.durationDays || null);
          // Initialize Step 3 with base price
          setS3({
            pricePaid: String(data.result.listPrice || 0),
            discountAmount: '0',
          });
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

  // ==================== STEP 1: DISCOUNT OFFER (Use Case 2S) ====================

  // Apply discount calculation (Q2S.1)
  function applyDiscountPercent(percent: string) {
    const pct = Math.max(0, Math.min(7, Number(percent) || 0));
    setS1({ discountPercent: String(pct) });

    const discountAmt = Math.round(basePrice * (pct / 100));
    const paid = basePrice - discountAmt;

    setS3({
      pricePaid: String(paid),
      discountAmount: String(discountAmt),
    });
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

  // ==================== STEP 2: CUSTOMER INFO (Use Case 3S) ====================

  function setS2Field<K extends keyof Step2>(k: K, v: Step2[K]) {
    setS2((p) => ({ ...p, [k]: v }));
    // Clear error for this field
    setErrors2((e) => {
      const newE = { ...e };
      delete newE[k];
      return newE;
    });
  }

  async function validateStep2(): Promise<boolean> {
    const e: Partial<Record<keyof Step2, string>> = {};

    // Required fields validation
    if (!s2.firstName.trim()) e.firstName = 'กรุณากรอกชื่อ';
    if (!s2.lastName.trim()) e.lastName = 'กรุณากรอกนามสกุล';
    if (!s2.gender) e.gender = 'กรุณาเลือกเพศ';
    if (!s2.dateOfBirth) e.dateOfBirth = 'กรุณาเลือกวันเกิด';
    if (!s2.phone.trim()) e.phone = 'กรุณากรอกเบอร์โทร';
    if (!s2.email.trim()) e.email = 'กรุณากรอกอีเมล';
    if (!s2.emergencyContactName.trim()) e.emergencyContactName = 'กรุณากรอกชื่อผู้ติดต่อฉุกเฉิน';
    if (!s2.emergencyContactRelationship.trim())
      e.emergencyContactRelationship = 'กรุณากรอกความสัมพันธ์';
    if (!s2.emergencyContactPhone.trim()) e.emergencyContactPhone = 'กรุณากรอกเบอร์โทรผู้ติดต่อฉุกเฉิน';

    // Format validation (RE)
    if (s2.phone && !PHONE_RE.test(s2.phone)) {
      e.phone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก';
    }
    if (s2.email && !EMAIL_RE.test(s2.email.toLowerCase())) {
      e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (s2.emergencyContactPhone && !PHONE_RE.test(s2.emergencyContactPhone)) {
      e.emergencyContactPhone = 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก';
    }

    // Date of birth validation (>= 14 years old)
    if (s2.dateOfBirth) {
      const age = calculateAge(s2.dateOfBirth);
      if (age < 14) {
        e.dateOfBirth = 'อายุต้องไม่ต่ำกว่า 14 ปี';
      }
    }

    // Check duplicate phone (Q3S.1)
    if (s2.phone && PHONE_RE.test(s2.phone)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/check-phone?phone=${s2.phone}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.status === 'success' && data.result?.exists) {
          e.phone = 'เบอร์โทรนี้ถูกใช้งานแล้ว';
        }
      } catch (err) {
        console.error('Error checking phone:', err);
      }
    }

    // Check duplicate email (Q3S.2)
    if (s2.email && EMAIL_RE.test(s2.email.toLowerCase())) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/check-gmail?gmail=${encodeURIComponent(s2.email)}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.status === 'success' && data.result?.exists) {
          e.email = 'อีเมลนี้ถูกใช้งานแล้ว';
        }
      } catch (err) {
        console.error('Error checking email:', err);
      }
    }

    setErrors2(e);
    return Object.keys(e).length === 0;
  }

  // ==================== STEP 3: DURATION DETAILS ====================

  function setS3Field<K extends keyof Step3>(k: K, v: Step3[K]) {
    setS3((p) => ({ ...p, [k]: v }));
    setErrors3((e) => {
      const newE = { ...e };
      delete newE[k];
      return newE;
    });
  }

  function validateStep3(): boolean {
    const e: Partial<Record<keyof Step3, string>> = {};
    const paid = Number(s3.pricePaid);
    if (isNaN(paid) || paid < 0) {
      e.pricePaid = 'ราคาไม่ถูกต้อง';
    }
    setErrors3(e);
    return Object.keys(e).length === 0;
  }

  // ==================== STEP 4: ACCOUNT CREDENTIALS ====================

  function setS4Field<K extends keyof Step4>(k: K, v: Step4[K]) {
    setS4((p) => ({ ...p, [k]: v }));
    setErrors4((e) => {
      const newE = { ...e };
      delete newE[k];
      return newE;
    });
  }

  function validateStep4(): boolean {
    const e: Partial<Record<keyof Step4, string>> = {};

    if (!s4.username.trim()) {
      e.username = 'กรุณากรอก Username';
    } else if (!USERNAME_RE.test(s4.username)) {
      e.username = 'Username ต้องขึ้นต้นด้วยตัวอักษร และมี 4-30 ตัวอักษร (a-z, A-Z, 0-9)';
    }

    if (!s4.password) {
      e.password = 'กรุณากรอกรหัสผ่าน';
    } else if (!PASSWORD_RE.test(s4.password)) {
      e.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วย a-z, A-Z, 0-9, และอักขระพิเศษ';
    }

    if (!s4.confirmPassword) {
      e.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (s4.password !== s4.confirmPassword) {
      e.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    setErrors4(e);
    return Object.keys(e).length === 0;
  }

  // ==================== NAVIGATION ====================

  async function onNext() {
    if (activeStep === 0) {
      if (validateStep1()) setActiveStep(1);
    } else if (activeStep === 1) {
      const valid = await validateStep2();
      if (valid) setActiveStep(2);
    } else if (activeStep === 2) {
      if (validateStep3()) setActiveStep(3);
    }
  }

  function onBack() {
    setActiveStep((prev) => Math.max(0, prev - 1));
  }

  // ==================== SUBMIT ====================

  async function onSubmit() {
    if (!validateStep4()) return;

    setSubmitting(true);
    try {
      const payload = {
        // Account credentials
        username: s4.username,
        password: s4.password,
        confirmPassword: s4.confirmPassword,
        // Customer info
        firstName: s2.firstName,
        lastName: s2.lastName,
        gender: s2.gender,
        dateOfBirth: s2.dateOfBirth,
        phone: s2.phone,
        gmail: s2.email,
        healthInfo: s2.healthInfo,
        address: s2.address,
        companyName: s2.companyName,
        companyPosition: s2.companyPosition,
        maritalStatus: s2.maritalStatus,
        emergencyContactName: s2.emergencyContactName,
        emergencyContactRelationship: s2.emergencyContactRelationship,
        emergencyContactPhone: s2.emergencyContactPhone,
        marketingSource: s2.marketingSource,
        // Product & pricing
        productId: productId,
        pricePaid: Number(s3.pricePaid),
        discountAmount: Number(s3.discountAmount),
        // Sales username (get from auth context or session)
        salesUsername: 'sales1', // TODO: Get from actual logged-in user
        startDate: new Date().toISOString().split('T')[0], // Today
        durationDays: durationDays || 30,
      };

      const response = await fetch(`${API_BASE_URL}/api/customers/durations/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setSnack({ open: true, message: 'ลงทะเบียนสำเร็จ!', color: 'success' });
        // Redirect to order summary page
        setTimeout(() => {
          router.push('/customer/package/order-summary');
        }, 1500);
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Error submitting registration:', err);
      setSnack({ open: true, message: err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน', color: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  // ==================== RENDER ====================

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        ลงทะเบียนแพ็กเกจ Duration: {productName}
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 } }} elevation={2}>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {['Discount Offer', 'Customer Info', 'Duration Details', 'Account Credentials'].map((label) => (
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
                  <Typography variant="body2">ส่วนลด: {money(Number(s3.discountAmount))}</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    ราคาหลังหักส่วนลด: {money(Number(s3.pricePaid))}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={onNext}>
                Next
              </Button>
            </Box>
          </Box>
        )}

        {/* ==================== STEP 2: CUSTOMER INFO (Use Case 3S) ==================== */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              ข้อมูลลูกค้า (Customer Information)
            </Typography>

            <Grid container spacing={2}>
              {/* Basic Info */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ชื่อ (First Name)"
                  value={s2.firstName}
                  onChange={(e) => setS2Field('firstName', e.target.value)}
                  error={!!errors2.firstName}
                  helperText={errors2.firstName}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="นามสกุล (Last Name)"
                  value={s2.lastName}
                  onChange={(e) => setS2Field('lastName', e.target.value)}
                  error={!!errors2.lastName}
                  helperText={errors2.lastName}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="เพศ (Gender)"
                  value={s2.gender}
                  onChange={(e) => setS2Field('gender', e.target.value as Step2['gender'])}
                  error={!!errors2.gender}
                  helperText={errors2.gender}
                  fullWidth
                  required
                >
                  <MenuItem value="MALE">ชาย (Male)</MenuItem>
                  <MenuItem value="FEMALE">หญิง (Female)</MenuItem>
                  <MenuItem value="OTHER">อื่นๆ (Other)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="วันเกิด (Date of Birth)"
                  type="date"
                  value={s2.dateOfBirth}
                  onChange={(e) => setS2Field('dateOfBirth', e.target.value)}
                  error={!!errors2.dateOfBirth}
                  helperText={errors2.dateOfBirth || 'อายุต้องไม่ต่ำกว่า 14 ปี'}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="เบอร์โทร (Phone)"
                  value={s2.phone}
                  onChange={(e) => setS2Field('phone', e.target.value)}
                  error={!!errors2.phone}
                  helperText={errors2.phone || 'ตัวเลข 10 หลัก'}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="อีเมล (Email)"
                  type="email"
                  value={s2.email}
                  onChange={(e) => setS2Field('email', e.target.value)}
                  error={!!errors2.email}
                  helperText={errors2.email}
                  fullWidth
                  required
                />
              </Grid>

              {/* Additional Info */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                  ข้อมูลเพิ่มเติม
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="ข้อมูลสุขภาพ (Health Info)"
                  value={s2.healthInfo}
                  onChange={(e) => setS2Field('healthInfo', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="ที่อยู่ (Address)"
                  value={s2.address}
                  onChange={(e) => setS2Field('address', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="บริษัท (Company Name)"
                  value={s2.companyName}
                  onChange={(e) => setS2Field('companyName', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ตำแหน่ง (Position)"
                  value={s2.companyPosition}
                  onChange={(e) => setS2Field('companyPosition', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="สถานะสมรส (Marital Status)"
                  value={s2.maritalStatus}
                  onChange={(e) => setS2Field('maritalStatus', e.target.value as Step2['maritalStatus'])}
                  fullWidth
                >
                  <MenuItem value="SINGLE">โสด (Single)</MenuItem>
                  <MenuItem value="MARRIED">สมรส (Married)</MenuItem>
                  <MenuItem value="DIVORCED">หย่า (Divorced)</MenuItem>
                  <MenuItem value="WIDOWED">หม้าย (Widowed)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="แหล่งที่รู้จัก (Marketing Source)"
                  value={s2.marketingSource}
                  onChange={(e) => setS2Field('marketingSource', e.target.value)}
                  fullWidth
                />
              </Grid>

              {/* Emergency Contact */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                  ผู้ติดต่อฉุกเฉิน (Emergency Contact) *
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="ชื่อผู้ติดต่อ"
                  value={s2.emergencyContactName}
                  onChange={(e) => setS2Field('emergencyContactName', e.target.value)}
                  error={!!errors2.emergencyContactName}
                  helperText={errors2.emergencyContactName}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="ความสัมพันธ์"
                  value={s2.emergencyContactRelationship}
                  onChange={(e) => setS2Field('emergencyContactRelationship', e.target.value)}
                  error={!!errors2.emergencyContactRelationship}
                  helperText={errors2.emergencyContactRelationship}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="เบอร์โทรผู้ติดต่อ"
                  value={s2.emergencyContactPhone}
                  onChange={(e) => setS2Field('emergencyContactPhone', e.target.value)}
                  error={!!errors2.emergencyContactPhone}
                  helperText={errors2.emergencyContactPhone}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={onBack}>Back</Button>
              <Button variant="contained" onClick={onNext}>
                Next
              </Button>
            </Box>
          </Box>
        )}

        {/* ==================== STEP 3: DURATION DETAILS ==================== */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              รายละเอียดแพ็กเกจ (Duration Details)
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body1">แพ็กเกจ: {productName}</Typography>
                  <Typography variant="body1">ระยะเวลา: {durationDays} วัน</Typography>
                  <Typography variant="body1">ราคาปกติ: {money(basePrice)}</Typography>
                  <Typography variant="body1">ส่วนลด: {money(Number(s3.discountAmount))}</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary" sx={{ mt: 1 }}>
                    ราคาที่ต้องชำระ: {money(Number(s3.pricePaid))}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={onBack}>Back</Button>
              <Button variant="contained" onClick={onNext}>
                Next
              </Button>
            </Box>
          </Box>
        )}

        {/* ==================== STEP 4: ACCOUNT CREDENTIALS ==================== */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              สร้างบัญชีผู้ใช้ (Account Credentials)
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Username"
                  value={s4.username}
                  onChange={(e) => setS4Field('username', e.target.value)}
                  error={!!errors4.username}
                  helperText={errors4.username || '4-30 ตัวอักษร (a-z, A-Z, 0-9) ขึ้นต้นด้วยตัวอักษร'}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Password"
                  type="password"
                  value={s4.password}
                  onChange={(e) => setS4Field('password', e.target.value)}
                  error={!!errors4.password}
                  helperText={errors4.password || 'อย่างน้อย 8 ตัวอักษร (a-z, A-Z, 0-9, อักขระพิเศษ)'}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Confirm Password"
                  type="password"
                  value={s4.confirmPassword}
                  onChange={(e) => setS4Field('confirmPassword', e.target.value)}
                  error={!!errors4.confirmPassword}
                  helperText={errors4.confirmPassword}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={onBack}>Back</Button>
              <Button variant="contained" onClick={onSubmit} disabled={submitting}>
                {submitting ? 'กำลังบันทึก...' : 'Submit'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}