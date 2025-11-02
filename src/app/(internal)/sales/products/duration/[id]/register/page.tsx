'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Paper, Stepper, Step, StepLabel, Button, TextField,
  Typography, MenuItem, Alert,
  Grid,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthProvider';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ==================== HELPER REGEX & FUNCTIONS ====================
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

// Step 1: Discount Offer (Use Case 2S - Sales Offer)
type Step1 = {
  discountPercent: string; // 0-7%
};

// Step 2: Customer Info (Use Case 3S - รวมข้อมูลทั้งหมดในหน้าเดียว)
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

// ==================== MAIN COMPONENT ====================

export default function DurationRegisterPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id ?? NaN);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // ✅ ดึงข้อมูล current user

  // Stepper state
  const [activeStep, setActiveStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [validating, setValidating] = React.useState(false);

  // Product info from backend
  const [productName, setProductName] = React.useState<string>('');
  const [basePrice, setBasePrice] = React.useState<number>(0);
  const [durationDays, setDurationDays] = React.useState<number | null>(null);

  // Step states (2 Steps only: Discount + Customer Info)
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

  // Calculated pricing (from Step 1)
  const [pricePaid, setPricePaid] = React.useState<number>(0);
  const [discountAmount, setDiscountAmount] = React.useState<number>(0);

  // Error states (2 Steps only)
  const [errors1, setErrors1] = React.useState<Partial<Record<keyof Step1, string>>>({});
  const [errors2, setErrors2] = React.useState<Partial<Record<keyof Step2, string>>>({});

  // Snackbar
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; color: 'success' | 'error' }>({
    open: false,
    message: '',
    color: 'success',
  });

  // Validation status for phone and email
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
          const price = data.listPrice / 100 || 0;
          setBasePrice(price);
          setDurationDays(data.durationDays || null);
          // Initialize pricing
          setPricePaid(price);
          setDiscountAmount(0);
        }
      } catch (err) {
        console.error('Error loading product:', err);
        if (!cancelled) {
          setSnack({ open: true, message: 'Failed to load product data', color: 'error' });
        }
      }
    }
    if (Number.isFinite(productId)) load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // ==================== STEP 1: DISCOUNT OFFER (Use Case 2S) ====================

  // Apply discount calculation (Q2S.1 - Sales Offer 0-7%)
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
      e.discountPercent = 'Discount must be between 0-7%';
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

  // ==================== DUPLICATE CHECKING FUNCTIONS ====================
  
  // Check phone duplicate (shared function for onBlur and onNext)
  async function checkPhoneDuplicate(phone: string): Promise<boolean> {
    if (!phone || !PHONE_RE.test(phone)) return true; // ถ้า format ไม่ถูกต้อง ให้ผ่าน (จะมี validation อื่นจัดการ)
    
    setCheckingPhone(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/check-phone?phone=${phone}`, {
        credentials: 'include',
      });
      const data = await res.json();
      console.log('Phone check response:', data);
      
      if (data.status === 'OK' && data.result?.exists) {
        setErrors2((e) => ({ ...e, phone: 'This phone number is already in use' }));
        return false; // พบข้อมูลซ้ำ
      }
      return true; // ไม่ซ้ำ
    } catch (err) {
      console.error('Error checking phone:', err);
      // ❌ เปลี่ยนจาก return true → return false เพื่อป้องกัน API error
      setErrors2((e) => ({ ...e, phone: 'Unable to validate phone. Please try again.' }));
      return false;
    } finally {
      setCheckingPhone(false);
    }
  }

  // Check email duplicate (shared function for onBlur and onNext)
  async function checkEmailDuplicate(email: string): Promise<boolean> {
    if (!email || !EMAIL_RE.test(email.toLowerCase())) return true;
    
    setCheckingEmail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/check-gmail?gmail=${encodeURIComponent(email)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      console.log('Email check response:', data);
      
      if (data.status === 'OK' && data.result?.exists) {
        setErrors2((e) => ({ ...e, email: 'This email is already in use' }));
        return false; // พบข้อมูลซ้ำ
      }
      return true; // ไม่ซ้ำ
    } catch (err) {
      console.error('Error checking email:', err);
      // ❌ เปลี่ยนจาก return true → return false เพื่อป้องกัน API error
      setErrors2((e) => ({ ...e, email: 'Unable to validate email. Please try again.' }));
      return false;
    } finally {
      setCheckingEmail(false);
    }
  }

  // Check both phone and email duplicates before moving to next step
  async function checkDuplicateBeforeNext(): Promise<boolean> {
    setValidating(true);
    
    try {
      // เช็กทั้ง phone และ email แบบ parallel
      const [phoneOk, emailOk] = await Promise.all([
        checkPhoneDuplicate(s2.phone),
        checkEmailDuplicate(s2.email),
      ]);

      // ถ้ามีอย่างใดอย่างหนึ่งซ้ำ ให้ return false
      return phoneOk && emailOk;
    } catch (err) {
      console.error('Error in checkDuplicateBeforeNext:', err);
      // ❌ เปลี่ยนจาก return true → return false เพื่อไม่ให้ผ่านไป payment ถ้า API error
      setSnack({ open: true, message: 'Unable to validate. Please try again.', color: 'error' });
      return false;
    } finally {
      setValidating(false);
    }
  }

  async function validateStep2(): Promise<boolean> {
    const e: Partial<Record<keyof Step2, string>> = {};

    // Required fields validation - ALL FIELDS ARE REQUIRED
    if (!s2.firstName.trim()) e.firstName = 'Please enter first name';
    if (!s2.lastName.trim()) e.lastName = 'Please enter last name';
    if (!s2.gender) e.gender = 'Please select gender';
    if (!s2.dateOfBirth) e.dateOfBirth = 'Please select date of birth';
    if (!s2.phone.trim()) e.phone = 'Please enter phone number';
    if (!s2.email.trim()) e.email = 'Please enter email';
    if (!s2.healthInfo.trim()) e.healthInfo = 'Please enter health information';
    if (!s2.address.trim()) e.address = 'Please enter address';
    if (!s2.companyName.trim()) e.companyName = 'Please enter company name';
    if (!s2.companyPosition.trim()) e.companyPosition = 'Please enter position';
    if (!s2.maritalStatus) e.maritalStatus = 'Please select marital status';
    if (!s2.marketingSource.trim()) e.marketingSource = 'Please enter marketing source';
    if (!s2.emergencyContactName.trim()) e.emergencyContactName = 'Please enter emergency contact name';
    if (!s2.emergencyContactRelationship.trim())
      e.emergencyContactRelationship = 'Please enter relationship';
    if (!s2.emergencyContactPhone.trim()) e.emergencyContactPhone = 'Please enter emergency contact phone';

    // Format validation (RE)
    if (s2.phone && !PHONE_RE.test(s2.phone)) {
      e.phone = 'Phone number must be 10 digits';
    }
    if (s2.email && !EMAIL_RE.test(s2.email.toLowerCase())) {
      e.email = 'Invalid email format';
    }
    if (s2.emergencyContactPhone && !PHONE_RE.test(s2.emergencyContactPhone)) {
      e.emergencyContactPhone = 'Phone number must be 10 digits';
    }

    // Date of birth validation (>= 14 years old AND valid date)
    if (s2.dateOfBirth) {
      const dob = new Date(s2.dateOfBirth);
      const now = new Date();
      
      // Validate date range: 1900-01-01 to today
      if (isNaN(dob.getTime()) || dob > now || dob.getFullYear() < 1900) {
        e.dateOfBirth = 'Please enter a valid birth date';
      } else {
        const age = calculateAge(s2.dateOfBirth);
        if (age < 14) {
          e.dateOfBirth = 'Age must be at least 14 years old';
        }
      }
    }

    setErrors2(e);
    if (Object.keys(e).length > 0) {
      return false;
    }

    // ✅ ตรวจ duplicate เฉพาะหลังจาก format validation ผ่านแล้ว
    return await checkDuplicateBeforeNext();
  }

  // ==================== NAVIGATION (2 Steps Only) ====================

  async function onNext() {
    if (activeStep === 0) {
      // Step 1: Discount Offer → ไป Step 2
      if (validateStep1()) setActiveStep(1);
    } 
    else if (activeStep === 1) {
      // Step 2: Customer Info → Redirect to Payment
      // ✅ validateStep2 จะตรวจ duplicate ในตัวแล้ว ไม่ต้องเรียกซ้ำ
      const valid = await validateStep2();
      if (!valid) return;

      // ✅ ผ่านทั้งหมดแล้ว → Redirect ไปหน้า Payment (Use Case 6C)
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
      productType: 'DURATION',
      durationDays: durationDays || 0,
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
      
      // Sales info
      salesUsername: user?.sub || 'unknown', // ✅ ดึงจาก current logged-in user
      
      // Meta info
      source: 'sales-registration', // เพื่อแยกว่ามาจาก Sales Flow
      timestamp: new Date().toISOString(),
    };

    // เก็บข้อมูลลง sessionStorage (จะหายเมื่อปิด tab)
    // ใช้ key เดียวกับ Session เพื่อความง่ายในการ maintain
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));

    // Redirect ไปหน้า Payment โดยตรง (Sales Flow: Register → Payment → Create Account)
    router.push(`/customer/package/${productId}/payment`);
  }

  // ==================== RENDER ====================

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Register Duration Package: {productName}
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 } }} elevation={2}>
        {/* Stepper - 2 Steps Only (Sales Flow: 3S) */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {['Discount Offer', 'Customer Info'].map((label) => (
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
              Discount Offer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Maximum 7% discount for customer incentive
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Discount (%)"
                  type="number"
                  value={s1.discountPercent}
                  onChange={(e) => applyDiscountPercent(e.target.value)}
                  error={!!errors1.discountPercent}
                  helperText={errors1.discountPercent || 'Enter discount 0-7%'}
                  fullWidth
                  inputProps={{ min: 0, max: 7, step: 0.1 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2">Regular Price: {money(basePrice)}</Typography>
                  <Typography variant="body2">Discount: {money(discountAmount)}</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    Price After Discount: {money(pricePaid)}
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
              Customer Information
            </Typography>

            <Grid container spacing={2}>
              {/* Basic Info */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First Name"
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
                  label="Last Name"
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
                  label="Gender"
                  value={s2.gender}
                  onChange={(e) => setS2Field('gender', e.target.value as Step2['gender'])}
                  error={!!errors2.gender}
                  helperText={errors2.gender}
                  fullWidth
                  required
                >
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={s2.dateOfBirth}
                  onChange={(e) => setS2Field('dateOfBirth', e.target.value)}
                  error={!!errors2.dateOfBirth}
                  helperText={errors2.dateOfBirth || 'Age must be at least 14 years old'}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone"
                  value={s2.phone}
                  onChange={(e) => setS2Field('phone', e.target.value)}
                  onBlur={(e) => checkPhoneDuplicate(e.target.value)}
                  error={!!errors2.phone}
                  helperText={
                    checkingPhone 
                      ? '🔍 Checking...' 
                      : errors2.phone || '10 digits'
                  }
                  fullWidth
                  required
                  disabled={checkingPhone}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={s2.email}
                  onChange={(e) => setS2Field('email', e.target.value)}
                  onBlur={(e) => checkEmailDuplicate(e.target.value)}
                  error={!!errors2.email}
                  helperText={
                    checkingEmail 
                      ? '🔍 Checking...' 
                      : errors2.email
                  }
                  fullWidth
                  required
                  disabled={checkingEmail}
                />
              </Grid>

              {/* Additional Info */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                  Additional Information *
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Health Info"
                  value={s2.healthInfo}
                  onChange={(e) => setS2Field('healthInfo', e.target.value)}
                  error={!!errors2.healthInfo}
                  helperText={errors2.healthInfo}
                  fullWidth
                  required
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Address"
                  value={s2.address}
                  onChange={(e) => setS2Field('address', e.target.value)}
                  error={!!errors2.address}
                  helperText={errors2.address}
                  fullWidth
                  required
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Company Name"
                  value={s2.companyName}
                  onChange={(e) => setS2Field('companyName', e.target.value)}
                  error={!!errors2.companyName}
                  helperText={errors2.companyName}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Position"
                  value={s2.companyPosition}
                  onChange={(e) => setS2Field('companyPosition', e.target.value)}
                  error={!!errors2.companyPosition}
                  helperText={errors2.companyPosition}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Marital Status"
                  value={s2.maritalStatus}
                  onChange={(e) => setS2Field('maritalStatus', e.target.value as Step2['maritalStatus'])}
                  error={!!errors2.maritalStatus}
                  helperText={errors2.maritalStatus}
                  fullWidth
                  required
                >
                  <MenuItem value="SINGLE">Single</MenuItem>
                  <MenuItem value="MARRIED">Married</MenuItem>
                  <MenuItem value="DIVORCED">Divorced</MenuItem>
                  <MenuItem value="WIDOWED">Widowed</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Marketing Source"
                  value={s2.marketingSource}
                  onChange={(e) => setS2Field('marketingSource', e.target.value)}
                  error={!!errors2.marketingSource}
                  helperText={errors2.marketingSource}
                  fullWidth
                  required
                />
              </Grid>

              {/* Emergency Contact */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                  Emergency Contact *
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Contact Name"
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
                  label="Relationship"
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
                  label="Contact Phone"
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
              <Button 
                variant="contained" 
                onClick={onNext} 
                disabled={validating || checkingPhone || checkingEmail}
              >
                {validating || checkingPhone || checkingEmail ? 'Validating data...' : 'Go to Payment'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}