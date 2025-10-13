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

type Step1State = {
  firstName: string;
  lastName: string;
  gender: '' | 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // YYYY-MM-DD
  phone: string;
  email: string;
};

type Step2State = {
  username: string;
  password: string;
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
    username: '',
    password: '',
  });

  const [errors1, setErrors1] = React.useState<Partial<Record<keyof Step1State, string>>>({});
  const [errors2, setErrors2] = React.useState<Partial<Record<keyof Step2State, string>>>({});

  // clear error ของ field ทันทีเมื่อพิมพ์
  function setS1Field<K extends keyof Step1State>(key: K, value: Step1State[K]) {
    setS1((p) => ({ ...p, [key]: value }));
    setErrors1((e) => ({ ...e, [key]: undefined }));
  }
  function setS2Field<K extends keyof Step2State>(key: K, value: Step2State[K]) {
    setS2((p) => ({ ...p, [key]: value }));
    setErrors2((e) => ({ ...e, [key]: undefined }));
  }

  function validateStep1(): boolean {
    const e: Partial<Record<keyof Step1State, string>> = {};
    if (!s1.firstName.trim()) e.firstName = 'Required';
    if (!s1.lastName.trim()) e.lastName = 'Required';
    if (!s1.phone.trim()) e.phone = 'Required';
    if (s1.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email)) e.email = 'Invalid email';
    setErrors1(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Partial<Record<keyof Step2State, string>> = {};
    if (!s2.username.trim()) e.username = 'Required';
    else if (s2.username.length < 3) e.username = 'At least 3 characters';
    if (!s2.password) e.password = 'Required';
    else if (s2.password.length < 6) e.password = 'At least 6 characters';
    setErrors2(e);
    return Object.keys(e).length === 0;
  }

  function onNext() {
    if (activeStep === 0 && !validateStep1()) return;
    setActiveStep((s) => s + 1);
  }

  function onBack() {
    setActiveStep((s) => Math.max(0, s - 1));
  }

  async function onSubmit() {
    if (!validateStep2()) return;
    try {
      setSubmitting(true);
      const payload = {
        username: s2.username.trim(),
        password: s2.password,
        firstName: s1.firstName.trim(),
        lastName: s1.lastName.trim(),
        gender: s1.gender || null,
        dateOfBirth: s1.dateOfBirth || null,
        phone: s1.phone.trim(),
        email: s1.email.trim() || null,
      };

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to register');
      }

      setSnack({ open: true, message: 'Registration success', color: 'success' });
      setActiveStep(0);
      setS1({ firstName: '', lastName: '', gender: '', dateOfBirth: '', phone: '', email: '' });
      setS2({ username: '', password: '' });
      setErrors1({});
      setErrors2({});
    } catch (err: any) {
      setSnack({ open: true, message: err.message || 'Registration failed', color: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        Customer Registration
      </Typography>

      <Paper sx={{ p: { xs: 2, md: 3 } }} elevation={2}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {['Customer Info', 'Account Credentials'].map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box component="form" noValidate>
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
                      selected ? (
                        String(selected)
                      ) : (
                        <span style={{ color: 'rgba(0,0,0,0.6)' }}>Select gender</span>
                      ),
                  }}
                  sx={{
                    minHeight: 56,
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      py: 1.5,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Not specified</em>
                  </MenuItem>
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

            <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={onNext}>
                Next
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box component="form" noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Username"
                  value={s2.username}
                  onChange={(e) => setS2Field('username', e.target.value)}
                  error={!!errors2.username}
                  helperText={errors2.username}
                  fullWidth
                  required
                  autoFocus
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Password"
                  type="password"
                  value={s2.password}
                  onChange={(e) => setS2Field('password', e.target.value)}
                  error={!!errors2.password}
                  helperText={errors2.password}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={onBack}>
                Back
              </Button>
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