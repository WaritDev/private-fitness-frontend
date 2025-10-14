'use client';

import React from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField,
  MenuItem,
  Button,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

type Step1State = {
  firstName: string;
  lastName: string;
  gender: '' | 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  phone: string;
  email: string;
};

type Step2State = {
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

type Step3State = {
  username: string;
  password: string;
  confirmPassword: string;
};

export default function RegistrationPage() {
  const [activeStep, setActiveStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; color: 'success' | 'error' }>({
    open: false,
    message: '',
    color: 'success',
  });

  const [s1, setS1] = React.useState<Step1State>({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    email: '',
  });
  const [s2, setS2] = React.useState<Step2State>({
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
  const [s3, setS3] = React.useState<Step3State>({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [errors1, setErrors1] = React.useState<Partial<Record<keyof Step1State, string>>>({});
  const [errors2, setErrors2] = React.useState<Partial<Record<keyof Step2State, string>>>({});
  const [errors3, setErrors3] = React.useState<Partial<Record<keyof Step3State, string>>>({});

  function setS1Field<K extends keyof Step1State>(key: K, value: Step1State[K]) {
    setS1((p) => ({ ...p, [key]: value }));
    setErrors1((e) => {
      const n = { ...e };
      if (value) delete n[key];
      if (key === 'email' && value) {
        n.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? undefined : 'Invalid email';
        if (!n.email) delete n.email;
      }
      return n;
    });
  }

  function setS2Field<K extends keyof Step2State>(key: K, value: Step2State[K]) {
    setS2((p) => ({ ...p, [key]: value }));
    setErrors2((e) => {
      const n = { ...e };
      if (value) delete n[key];
      return n;
    });
  }

  function setS3Field<K extends keyof Step3State>(key: K, value: Step3State[K]) {
    setS3((p) => ({ ...p, [key]: value }));
    setErrors3((e) => {
      const n = { ...e };
      if (key === 'username') {
        n.username = value
          ? USERNAME_RE.test(value)
            ? undefined
            : 'Invalid format'
          : 'Required';
        if (!n.username) delete n.username;
      }
      if (key === 'password') {
        n.password = value
          ? PASSWORD_RE.test(value)
            ? undefined
            : 'Weak password'
          : 'Required';
        if (s3.confirmPassword) {
            n.confirmPassword =
              value === s3.confirmPassword ? undefined : 'Password does not match';
        }
        if (!n.password) delete n.password;
        if (!n.confirmPassword) delete n.confirmPassword;
      }
      if (key === 'confirmPassword') {
        n.confirmPassword = value
          ? value === (key === 'password' ? value : s3.password)
            ? undefined
            : 'Password does not match'
          : 'Required';
        if (!n.confirmPassword) delete n.confirmPassword;
      }
      return n;
    });
  }

  function validateStep1() {
    const e: Partial<Record<keyof Step1State, string>> = {};
    if (!s1.firstName.trim()) e.firstName = 'Required';
    if (!s1.lastName.trim()) e.lastName = 'Required';
    if (!s1.phone.trim()) e.phone = 'Required';
    if (s1.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email)) e.email = 'Invalid email';
    setErrors1(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Partial<Record<keyof Step2State, string>> = {};
    // กำหนดให้ emergency contact จำเป็น 3 ช่อง
    if (!s2.emergencyContactName.trim()) e.emergencyContactName = 'Required';
    if (!s2.emergencyContactRelationship.trim()) e.emergencyContactRelationship = 'Required';
    if (!s2.emergencyContactPhone.trim()) e.emergencyContactPhone = 'Required';
    setErrors2(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e: Partial<Record<keyof Step3State, string>> = {};
    if (!s3.username.trim()) e.username = 'Required';
    else if (!USERNAME_RE.test(s3.username)) e.username = 'Invalid format';
    if (!s3.password) e.password = 'Required';
    else if (!PASSWORD_RE.test(s3.password)) e.password = 'Weak password';
    if (!s3.confirmPassword) e.confirmPassword = 'Required';
    else if (s3.password !== s3.confirmPassword) e.confirmPassword = 'Password does not match';
    setErrors3(e);
    return Object.keys(e).length === 0;
  }

  function onNext() {
    if (activeStep === 0 && !validateStep1()) return;
    if (activeStep === 1 && !validateStep2()) return;
    setActiveStep((s) => s + 1);
  }

  function onBack() {
    setActiveStep((s) => Math.max(0, s - 1));
  }

  async function onSubmit() {
    if (!validateStep3()) return;
    try {
      setSubmitting(true);
      const payload = {
        username: s3.username.trim(),
        password: s3.password,
        firstName: s1.firstName.trim(),
        lastName: s1.lastName.trim(),
        gender: s1.gender || null,
        dateOfBirth: s1.dateOfBirth || null,
        phone: s1.phone.trim(),
        email: s1.email.trim() || null,
        marketingSource: s2.marketingSource || null,
        emergencyContactPhone: s2.emergencyContactPhone || null,
        emergencyContactRelationship: s2.emergencyContactRelationship || null,
        emergencyContactName: s2.emergencyContactName || null,
        maritalStatus: s2.maritalStatus || null,
        companyPosition: s2.companyPosition || null,
        companyName: s2.companyName || null,
        address: s2.address || null,
        healthInfo: s2.healthInfo || null,
      };

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 409) {
          setErrors3((e) => ({ ...e, username: 'Username already taken' }));
        }
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to register');
      }

      setSnack({ open: true, message: 'Registration success', color: 'success' });
      setActiveStep(0);
      setS1({ firstName: '', lastName: '', gender: '', dateOfBirth: '', phone: '', email: '' });
      setS2({
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
      setS3({ username: '', password: '', confirmPassword: '' });
      setErrors1({});
      setErrors2({});
      setErrors3({});
    } catch (err: any) {
      setSnack({ open: true, message: err.message || 'Registration failed', color: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Customer Registration
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 } }} elevation={2}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {['Customer Info', 'Additional Info', 'Account Credentials'].map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First Name"
                  value={s1.firstName}
                  onChange={(e) => setS1Field('firstName', e.target.value)}
                  error={!!errors1.firstName}
                  helperText={errors1.firstName}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last Name"
                  value={s1.lastName}
                  onChange={(e) => setS1Field('lastName', e.target.value)}
                  error={!!errors1.lastName}
                  helperText={errors1.lastName}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Gender"
                  value={s1.gender}
                  onChange={(e) => setS1Field('gender', e.target.value as Step1State['gender'])}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) =>
                      selected ? String(selected) : <span style={{ color: 'rgba(0,0,0,0.6)' }}>Select gender</span>,
                  }}
                >
                  <MenuItem value=""><em>Not specified</em></MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={s1.dateOfBirth}
                  onChange={(e) => setS1Field('dateOfBirth', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone Number"
                  value={s1.phone}
                  onChange={(e) => setS1Field('phone', e.target.value)}
                  error={!!errors1.phone}
                  helperText={errors1.phone}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={s1.email}
                  onChange={(e) => setS1Field('email', e.target.value)}
                  error={!!errors1.email}
                  helperText={errors1.email}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={onNext}>Next</Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Grid container spacing={2}>
              {/* Emergency Contact */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
                  Emergency Contact (Required)
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Contact Name"
                  value={s2.emergencyContactName}
                  onChange={(e) => setS2Field('emergencyContactName', e.target.value)}
                  error={!!errors2.emergencyContactName}
                  helperText={errors2.emergencyContactName}
                  fullWidth required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Relationship"
                  value={s2.emergencyContactRelationship}
                  onChange={(e) => setS2Field('emergencyContactRelationship', e.target.value)}
                  error={!!errors2.emergencyContactRelationship}
                  helperText={errors2.emergencyContactRelationship}
                  fullWidth required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Contact Phone"
                  value={s2.emergencyContactPhone}
                  onChange={(e) => setS2Field('emergencyContactPhone', e.target.value)}
                  error={!!errors2.emergencyContactPhone}
                  helperText={errors2.emergencyContactPhone}
                  fullWidth required
                />
              </Grid>

              {/* Personal */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                  Personal Details
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Marital Status"
                  value={s2.maritalStatus}
                  onChange={(e) => setS2Field('maritalStatus', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Marketing Source"
                  value={s2.marketingSource}
                  onChange={(e) => setS2Field('marketingSource', e.target.value)}
                  fullWidth
                />
              </Grid>

              {/* Company */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                  Company & Address
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Company Name"
                  value={s2.companyName}
                  onChange={(e) => setS2Field('companyName', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Company Position"
                  value={s2.companyPosition}
                  onChange={(e) => setS2Field('companyPosition', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="Address"
                  value={s2.address}
                  onChange={(e) => setS2Field('address', e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>

              {/* Health */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                  Health Info
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Health Information"
                  value={s2.healthInfo}
                  onChange={(e) => setS2Field('healthInfo', e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={onBack}>Back</Button>
              <Button variant="contained" onClick={onNext}>Next</Button>
            </Box>
          </Box>
        )}
        {activeStep === 2 && (
          <Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Username"
                  value={s3.username}
                  onChange={(e) => setS3Field('username', e.target.value)}
                  error={!!errors3.username}
                  helperText={errors3.username || '4-30 chars, start with letter'}
                  fullWidth required autoFocus
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Password"
                  type="password"
                  value={s3.password}
                  onChange={(e) => setS3Field('password', e.target.value)}
                  error={!!errors3.password}
                  helperText={errors3.password || 'Min 8 with a-z, A-Z, 0-9 & special char'}
                  fullWidth required
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Confirm Password"
                  type="password"
                  value={s3.confirmPassword}
                  onChange={(e) => setS3Field('confirmPassword', e.target.value)}
                  error={!!errors3.confirmPassword}
                  helperText={errors3.confirmPassword}
                  fullWidth required
                />
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

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.color} onClose={() => setSnack((p) => ({ ...p, open: false }))} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}