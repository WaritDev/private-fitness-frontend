'use client';

import React from 'react';
import {
  Box, Paper, Stepper, Step, StepLabel, TextField, Button, Typography, Snackbar, Alert, MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useParams } from 'next/navigation';

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Step types
type Step1 = {
  firstName: string;
  lastName: string;
  gender: '' | 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  phone: string;
  email: string;
};
type Step2 = {
  marketingSource: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  emergencyContactName: string;
  maritalStatus: string;
  companyPosition: string;
  companyName: string;
  address: string;
  healthInfo: string;
};
type Step3 = {
  pricePaid: string;
  discountAmount: string;
  trainerUsername: string;
};
type Step4 = {
  username: string;
  password: string;
  confirmPassword: string;
};

export default function SessionRegisterPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id ?? NaN);

  const [activeStep, setActiveStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; color: 'success' | 'error' }>({
    open: false, message: '', color: 'success',
  });

  // state
  const [s1, setS1] = React.useState<Step1>({
    firstName: '', lastName: '', gender: '', dateOfBirth: '', phone: '', email: '',
  });
  const [s2, setS2] = React.useState<Step2>({
    marketingSource: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    emergencyContactName: '',
    maritalStatus: '',
    companyPosition: '',
    companyName: '',
    address: '',
    healthInfo: '',
  });
  const [s3, setS3] = React.useState<Step3>({ pricePaid: '', discountAmount: '', trainerUsername: '' });
  const [s4, setS4] = React.useState<Step4>({ username: '', password: '', confirmPassword: '' });

  // errors
  const [errors1, setErrors1] = React.useState<Partial<Record<keyof Step1, string>>>({});
  const [errors2, setErrors2] = React.useState<Partial<Record<keyof Step2, string>>>({});
  const [errors3, setErrors3] = React.useState<Partial<Record<keyof Step3, string>>>({});
  const [errors4, setErrors4] = React.useState<Partial<Record<keyof Step4, string>>>({});

  const [trainers, setTrainers] = React.useState<{ username: string; name: string }[]>([]);

  // โหลดรายชื่อเทรนเนอร์
  React.useEffect(() => {
    fetch('/api/trainers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setTrainers(Array.isArray(j?.items) ? j.items : []))
      .catch(() => setTrainers([]));
  }, []);

  // setters
  function setS1Field<K extends keyof Step1>(k: K, v: Step1[K]) {
    setS1((p) => ({ ...p, [k]: v }));
    setErrors1((e) => {
      const n = { ...e };
      if (v) delete (n as any)[k];
      if (k === 'email' && v) {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
        n.email = ok ? undefined : 'Invalid email';
        if (!n.email) delete n.email;
      }
      return n;
    });
  }
  function setS2Field<K extends keyof Step2>(k: K, v: Step2[K]) {
    setS2((p) => ({ ...p, [k]: v }));
    setErrors2((e) => {
      const n = { ...e };
      if (v) delete (n as any)[k];
      return n;
    });
  }
  function setS3Field<K extends keyof Step3>(k: K, v: Step3[K]) {
    setS3((p) => ({ ...p, [k]: v }));
    setErrors3((e) => {
      const n = { ...e };
      if (v) delete (n as any)[k];
      return n;
    });
  }
  function setS4Field<K extends keyof Step4>(k: K, v: Step4[K]) {
    setS4((p) => ({ ...p, [k]: v }));
    setErrors4((e) => {
      const n = { ...e };
      if (k === 'username') {
        n.username = v ? (USERNAME_RE.test(String(v)) ? undefined : 'Invalid') : 'Required';
        if (!n.username) delete n.username;
      }
      if (k === 'password') {
        n.password = v ? (PASSWORD_RE.test(String(v)) ? undefined : 'Weak password') : 'Required';
        if (s4.confirmPassword) n.confirmPassword = String(v) === s4.confirmPassword ? undefined : 'Password does not match';
        if (!n.password) delete n.password;
        if (!n.confirmPassword) delete n.confirmPassword;
      }
      if (k === 'confirmPassword') {
        n.confirmPassword = v ? (String(v) === s4.password ? undefined : 'Password does not match') : 'Required';
        if (!n.confirmPassword) delete n.confirmPassword;
      }
      return n;
    });
  }

  // validate
  function validateStep1() {
    const e: Partial<Record<keyof Step1, string>> = {};
    if (!s1.firstName.trim()) e.firstName = 'Required';
    if (!s1.lastName.trim()) e.lastName = 'Required';
    if (!s1.phone.trim()) e.phone = 'Required';
    if (s1.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email)) e.email = 'Invalid email';
    setErrors1(e); return Object.keys(e).length === 0;
  }
  function validateStep2() {
    const e: Partial<Record<keyof Step2, string>> = {};
    if (!s2.emergencyContactName.trim()) e.emergencyContactName = 'Required';
    if (!s2.emergencyContactRelationship.trim()) e.emergencyContactRelationship = 'Required';
    if (!s2.emergencyContactPhone.trim()) e.emergencyContactPhone = 'Required';
    setErrors2(e); return Object.keys(e).length === 0;
  }
  function validateStep3() {
    const e: Partial<Record<keyof Step3, string>> = {};
    if (!s3.pricePaid.trim() || Number.isNaN(Number(s3.pricePaid))) e.pricePaid = 'Required';
    if (s3.discountAmount && Number.isNaN(Number(s3.discountAmount))) e.discountAmount = 'Invalid';
    if (!s3.trainerUsername.trim()) e.trainerUsername = 'Required';
    setErrors3(e); return Object.keys(e).length === 0;
  }
  function validateStep4() {
    const e: Partial<Record<keyof Step4, string>> = {};
    if (!s4.username.trim()) e.username = 'Required';
    else if (!USERNAME_RE.test(s4.username)) e.username = 'Invalid';
    if (!s4.password) e.password = 'Required';
    else if (!PASSWORD_RE.test(s4.password)) e.password = 'Weak password';
    if (!s4.confirmPassword) e.confirmPassword = 'Required';
    else if (s4.password !== s4.confirmPassword) e.confirmPassword = 'Password does not match';
    setErrors4(e); return Object.keys(e).length === 0;
  }

  function onNext() {
    if (activeStep === 0 && !validateStep1()) return;
    if (activeStep === 1 && !validateStep2()) return;
    if (activeStep === 2 && !validateStep3()) return;
    setActiveStep((s) => s + 1);
  }
  function onBack() {
    setActiveStep((s) => Math.max(0, s - 1));
  }

  async function onSubmit() {
    if (!validateStep4()) return;
    if (!Number.isFinite(productId)) {
      setSnack({ open: true, message: 'Invalid product', color: 'error' }); return;
    }
    try {
      setSubmitting(true);
      // 1) signup (บันทึก Customer Info + Additional Info ลง DB)
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // step 1
          firstName: s1.firstName.trim(),
          lastName: s1.lastName.trim(),
          gender: s1.gender || null,
          dateOfBirth: s1.dateOfBirth || null,
          phone: s1.phone.trim(),
          email: s1.email?.trim() || null,
          // step 2
          marketingSource: s2.marketingSource || null,
          emergencyContactPhone: s2.emergencyContactPhone || null,
          emergencyContactRelationship: s2.emergencyContactRelationship || null,
          emergencyContactName: s2.emergencyContactName || null,
          maritalStatus: s2.maritalStatus || null,
          companyPosition: s2.companyPosition || null,
          companyName: s2.companyName || null,
          address: s2.address || null,
          healthInfo: s2.healthInfo || null,
          // credentials
          username: s4.username.trim(),
          password: s4.password,
        }),
      });
      if (!signupRes.ok) {
        if (signupRes.status === 409) setErrors4((e) => ({ ...e, username: 'Username already taken' }));
        const j = await signupRes.json().catch(() => ({}));
        throw new Error(j.error || 'Signup failed');
      }

      // 2) purchase session (Step 3)
      const purchaseRes = await fetch('/api/sessions/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerUsername: s4.username.trim(),
          pricePaid: Number(s3.pricePaid),
          discountAmount: Number(s3.discountAmount || 0),
          trainerUsername: s3.trainerUsername,
        }),
      });
      if (!purchaseRes.ok) {
        const j = await purchaseRes.json().catch(() => ({}));
        throw new Error(j.error || 'Purchase failed');
      }

      setSnack({ open: true, message: 'Registration success', color: 'success' });
      setActiveStep(0);
    } catch (err: any) {
      setSnack({ open: true, message: err.message || 'Failed', color: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Register Session Product</Typography>
      <Paper sx={{ p: { xs: 2, md: 3 } }} elevation={2}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {['Customer Info', 'Additional Info', 'Session Details', 'Account Credentials'].map((l) => (
            <Step key={l}><StepLabel>{l}</StepLabel></Step>
          ))}
        </Stepper>

        {/* Step 1 */}
        {activeStep === 0 && (
          <Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="First Name" value={s1.firstName} onChange={(e) => setS1Field('firstName', e.target.value)}
                  error={!!errors1.firstName} helperText={errors1.firstName} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Last Name" value={s1.lastName} onChange={(e) => setS1Field('lastName', e.target.value)}
                  error={!!errors1.lastName} helperText={errors1.lastName} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Gender" value={s1.gender}
                  onChange={(e) => setS1Field('gender', e.target.value as Step1['gender'])} fullWidth
                  SelectProps={{ displayEmpty: true, renderValue: (v) => v ? String(v) : <span style={{ color: 'rgba(0,0,0,0.6)' }}>Select gender</span> }}>
                  <MenuItem value=""><em>Not specified</em></MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Date of Birth" type="date" value={s1.dateOfBirth || ''} onChange={(e) => setS1Field('dateOfBirth', e.target.value)}
                  fullWidth InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Phone Number" value={s1.phone} onChange={(e) => setS1Field('phone', e.target.value)}
                  error={!!errors1.phone} helperText={errors1.phone} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Email" type="email" value={s1.email || ''} onChange={(e) => setS1Field('email', e.target.value)}
                  error={!!errors1.email} helperText={errors1.email} fullWidth />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={onNext}>Next</Button>
            </Box>
          </Box>
        )}

        {/* Step 2 */}
        {activeStep === 1 && (
          <Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
                  Emergency Contact (Required)
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Contact Name" value={s2.emergencyContactName}
                  onChange={(e) => setS2Field('emergencyContactName', e.target.value)}
                  error={!!errors2.emergencyContactName} helperText={errors2.emergencyContactName} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Relationship" value={s2.emergencyContactRelationship}
                  onChange={(e) => setS2Field('emergencyContactRelationship', e.target.value)}
                  error={!!errors2.emergencyContactRelationship} helperText={errors2.emergencyContactRelationship} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Contact Phone" value={s2.emergencyContactPhone}
                  onChange={(e) => setS2Field('emergencyContactPhone', e.target.value)}
                  error={!!errors2.emergencyContactPhone} helperText={errors2.emergencyContactPhone} fullWidth required />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                  Personal Details
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Marital Status" value={s2.maritalStatus}
                  onChange={(e) => setS2Field('maritalStatus', e.target.value)} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Marketing Source" value={s2.marketingSource}
                  onChange={(e) => setS2Field('marketingSource', e.target.value)} fullWidth />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                  Company & Address
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Company Name" value={s2.companyName}
                  onChange={(e) => setS2Field('companyName', e.target.value)} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Company Position" value={s2.companyPosition}
                  onChange={(e) => setS2Field('companyPosition', e.target.value)} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Address" value={s2.address}
                  onChange={(e) => setS2Field('address', e.target.value)} fullWidth multiline minRows={2} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                  Health Info
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Health Information" value={s2.healthInfo}
                  onChange={(e) => setS2Field('healthInfo', e.target.value)} fullWidth multiline minRows={3} />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={onBack}>Back</Button>
              <Button variant="contained" onClick={onNext}>Next</Button>
            </Box>
          </Box>
        )}

        {/* Step 3 */}
        {activeStep === 2 && (
          <Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Price Paid" value={s3.pricePaid} onChange={(e) => setS3Field('pricePaid', e.target.value)}
                  error={!!errors3.pricePaid} helperText={errors3.pricePaid} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Discount Amount" value={s3.discountAmount} onChange={(e) => setS3Field('discountAmount', e.target.value)}
                  error={!!errors3.discountAmount} helperText={errors3.discountAmount} fullWidth />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField select label="Trainer" value={s3.trainerUsername}
                  onChange={(e) => setS3Field('trainerUsername', e.target.value)} fullWidth required
                  SelectProps={{ displayEmpty: true, renderValue: (v) => v ? String(v) : <span style={{ color: 'rgba(0,0,0,0.6)' }}>Select trainer</span> }}>
                  <MenuItem value=""><em>Select trainer</em></MenuItem>
                  {trainers.map((t) => (
                    <MenuItem key={t.username} value={t.username}>{t.name ?? t.username}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={onBack}>Back</Button>
              <Button variant="contained" onClick={onNext}>Next</Button>
            </Box>
          </Box>
        )}

        {/* Step 4 */}
        {activeStep === 3 && (
          <Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField label="Username" value={s4.username} onChange={(e) => setS4Field('username', e.target.value)}
                  error={!!errors4.username} helperText={errors4.username || '4-30 chars, start with letter'} fullWidth required autoFocus />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Password" type="password" value={s4.password} onChange={(e) => setS4Field('password', e.target.value)}
                  error={!!errors4.password} helperText={errors4.password || 'Min 8 with a-z, A-Z, 0-9 & special char'} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Confirm Password" type="password" value={s4.confirmPassword} onChange={(e) => setS4Field('confirmPassword', e.target.value)}
                  error={!!errors4.confirmPassword} helperText={errors4.confirmPassword} fullWidth required />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={onBack}>Back</Button>
              <Button variant="contained" onClick={onSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((p) => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.color} onClose={() => setSnack((p) => ({ ...p, open: false }))} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}