'use client';

import * as React from 'react';
import {
  Container, Stack, Typography, Paper, Button, TextField,
  Alert, CircularProgress, InputAdornment, IconButton, Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useRouter } from 'next/navigation';
import { useAlertPopUp } from '@/components/pop-up/AlertPopUpUI';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Validation Regex
const USERNAME_RE = /^[A-Za-z][A-Za-z0-9]{3,29}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Type definition for order data (supports both Duration and Session)
type PendingOrder = {
  productId: number;
  productName: string;
  productType: 'DURATION' | 'SESSION';
  basePrice: number;
  discountAmount: number;
  discountPercent: number;
  pricePaid: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  healthInfo: string;
  address: string;
  companyName: string;
  companyPosition: string;
  maritalStatus: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  marketingSource: string;
  salesUsername: string; // ✅ เพิ่ม salesUsername
  source: string;
  timestamp: string;
  
  // Duration-specific
  durationDays?: number;
  
  // Session-specific
  sessionAmount?: number;
  schedules?: Array<{
    startTime: string;
    endTime: string;
    dayOfWeek: string;
  }>;
  trainerUsername?: string;
  trainerName?: string;
};

export default function CreateAccountPage() {
  const router = useRouter();
  const { setAlert } = useAlertPopUp();

  const [orderData, setOrderData] = React.useState<PendingOrder | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Form fields
  const [username, setUsername] = React.useState(''); // ไม่ auto-suggest
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Validation errors
  const [usernameError, setUsernameError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState('');

  // Check duplicate username (debounced)
  const [checkingUsername, setCheckingUsername] = React.useState(false);

  // Load order data
  React.useEffect(() => {
    const paymentVerified = sessionStorage.getItem('paymentVerified');
    const stored = sessionStorage.getItem('pendingOrder');

    if (paymentVerified !== 'true') {
      setError('Payment verification not found');
      setLoading(false);
      return;
    }

    if (!stored) {
      setError('Order data not found');
      setLoading(false);
      return;
    }

    try {
      const data = JSON.parse(stored) as PendingOrder;
      setOrderData(data);
      
      // ✅ ลบ auto-suggest username (ให้ลูกค้ากรอกเอง)
      // เดิม: setUsername(suggestedUsername);
      
      setLoading(false);
    } catch (err) {
      setError('Invalid order data');
      setLoading(false);
    }
  }, []);

  // Validate username format
  React.useEffect(() => {
    if (!username) {
      setUsernameError('');
      return;
    }
    
    if (!USERNAME_RE.test(username)) {
      setUsernameError('Username must start with a letter and be 4-30 characters long (A-Z, a-z, 0-9 only)');
      return;
    }
    
    setUsernameError('');
    
    // Check duplicate (debounced)
    const timer = setTimeout(() => {
      checkUsernameDuplicate(username);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username]);

  // Validate password format
  React.useEffect(() => {
    if (!password) {
      setPasswordError('');
      return;
    }
    
    if (!PASSWORD_RE.test(password)) {
      setPasswordError('At least 8 characters with A-Z, a-z, numbers, and special characters (@$!%*?&)');
      return;
    }
    
    setPasswordError('');
  }, [password]);

  // Validate confirm password
  React.useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError('');
      return;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    
    setConfirmPasswordError('');
  }, [password, confirmPassword]);

  // Check username duplicate
  async function checkUsernameDuplicate(usernameToCheck: string) {
    if (!USERNAME_RE.test(usernameToCheck)) return;
    
    setCheckingUsername(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/check-username?username=${usernameToCheck}`);
      const data = await response.json();

      console.log('Username check response:', data);
      if (data.status === 'OK' && data.result) {
        if (data.result.exists) {
          setUsernameError('This username is already in use');
        }
      }
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      setCheckingUsername(false);
    }
  }

  // Create customer account
  async function handleCreateAccount() {
    if (!orderData) return;
    
    // Validate all fields
    if (!username || usernameError) {
      setError('Please enter a valid username');
      return;
    }
    
    if (!password || passwordError) {
      setError('Please enter a valid password');
      return;
    }
    
    if (!confirmPassword || confirmPasswordError) {
      setError('Please confirm password');
      return;
    }
    
    setCreating(true);
    setError(null);

    try {
      // Base payload - ใช้ field names ตาม API_DOCUMENTATION.md (ถูกต้อง 100%)
      const basePayload = {
        username: username,
        password: password,
        confirmPassword: confirmPassword,
        firstName: orderData.firstName,
        lastName: orderData.lastName,
        gender: orderData.gender.toUpperCase(),
        dateOfBirth: orderData.dateOfBirth,
        phoneNumber: orderData.phone, 
        gmail: orderData.email, 
        healthInfo: orderData.healthInfo, 
        address: orderData.address,
        companyName: orderData.companyName,
        companyPosition: orderData.companyPosition, 
        maritalStatus: orderData.maritalStatus.toUpperCase(),
        emergencyContactName: orderData.emergencyContactName,
        emergencyContactRelationship: orderData.emergencyContactRelationship,
        emergencyContactPhone: orderData.emergencyContactPhone,
        marketingSource: orderData.marketingSource, 
        productId: orderData.productId,
        salesUsername: orderData.salesUsername,
        pricePaid: orderData.pricePaid,
        discountAmount: orderData.discountAmount,
      };

      let endpoint = '';
      let payload: any = { ...basePayload };

      // เลือก endpoint ตาม productType
      if (orderData.productType === 'DURATION') {
        endpoint = `${API_BASE_URL}/api/customers/durations/register`;
        // Duration-specific fields (ตาม API_DOCUMENTATION.md)
        payload.startDate = new Date().toISOString().split('T')[0];
        payload.durationDays = orderData.durationDays || 0;
      } else if (orderData.productType === 'SESSION') {
        endpoint = `${API_BASE_URL}/api/customers/sessions/register`;
        payload.trainerUsername = orderData.trainerUsername || '';
        payload.totalSessions = orderData.sessionAmount || 0; 
        payload.sessionSchedules = (orderData.schedules || []).map(s => {
          const [hours, minutes] = s.startTime.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          
          return {
            dayOfWeek: s.dayOfWeek,
            startTime: startDate.toISOString()
          };
        });
      } else {
        throw new Error('Invalid product type');
      }

      // 🐛 DEBUG: Log payload before sending
      console.log('📤 Sending payload to backend:', {
        endpoint,
        payload: JSON.stringify(payload, null, 2)
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === 'success' && result.result) {
        // Clear session data
        sessionStorage.removeItem('pendingOrder');
        sessionStorage.removeItem('paymentVerified');
        
        // ✅ แสดง Alert ตาม Use Case: "Customer: [Name] Register Successfully"
        const customerName = `${orderData.firstName} ${orderData.lastName}`;
        setAlert({
          open: true,
          msg: `✅ Customer: ${customerName} Register Successfully! (Username: ${username})`,
          severity: 'success'
        });
        
        // Redirect to products page (Sales role) หลังจาก 1.5 วินาที
        setTimeout(() => {
          router.push('/sales/products');
        }, 1500);
      } else {
        throw new Error(result.message || 'Unable to create account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating account');
    } finally {
      setCreating(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Stack spacing={2} sx={{ px: 2, py: 4 }} alignItems="center">
          <CircularProgress />
          <Typography>Loading data...</Typography>
        </Stack>
      </Container>
    );
  }

  // Error state (no payment verification or no order data)
  if (error && !orderData) {
    return (
      <Container maxWidth="sm" sx={{ px: 0 }}>
        <Stack spacing={2} sx={{ px: 2, py: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Button variant="outlined" onClick={() => router.push('/sales/products')}>
            Back to Products
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0 }}>
      <Stack spacing={2} sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          Create Account
        </Typography>

        {/* Customer Info Summary */}
        {orderData && (
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={700}>Customer Information</Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">Full Name:</Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="caption" fontWeight={600}>
                    {orderData.firstName} {orderData.lastName}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">Email:</Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="caption" fontWeight={600}>{orderData.email}</Typography>
                </Grid>
                
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">Phone:</Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="caption" fontWeight={600}>{orderData.phone}</Typography>
                </Grid>
              </Grid>
            </Stack>
          </Paper>
        )}

        <Divider />

        {/* Account Form */}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
              Login Information
            </Typography>

            {error && orderData && (
              <Alert severity="error">{error}</Alert>
            )}

            {/* Username */}
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={Boolean(usernameError)}
              helperText={usernameError || 'Username must start with a letter and be 4-30 characters long (A-Z, a-z, 0-9 only)'}
              fullWidth
              required
              disabled={creating}
              onBlur={(e) => checkUsernameDuplicate(e.target.value)}
              placeholder="Enter username"
              InputProps={{
                endAdornment: checkingUsername && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Password */}
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(passwordError)}
              helperText={passwordError || 'At least 8 characters with A-Z, a-z, numbers, and special characters (@$!%*?&)'}
              fullWidth
              required
              disabled={creating}
              placeholder="Enter password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Confirm Password */}
            <TextField
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(confirmPasswordError)}
              helperText={confirmPasswordError || 'Enter password again to confirm'}
              fullWidth
              required
              disabled={creating}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
              This information will be used for customer login. Please save and inform the customer.
            </Alert>
          </Stack>
        </Paper>

        {/* Action Buttons */}
        <Stack spacing={1.5}>
          <Button
            variant="contained"
            onClick={handleCreateAccount}
            disabled={
              creating ||
              !username ||
              !password ||
              !confirmPassword ||
              Boolean(usernameError) ||
              Boolean(passwordError) ||
              Boolean(confirmPasswordError)
            }
            sx={{
              py: 1.5,
              bgcolor: '#00C853',
              color: '#000',
              fontWeight: 700,
              '&:hover': { bgcolor: '#00B84D' },
            }}
          >
            {creating ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: '#000' }} />
                Creating account...
              </>
            ) : (
              'Submit'
            )}
          </Button>

          <Button
            variant="outlined"
            onClick={() => router.back()}
            disabled={creating}
            size="small"
          >
            Go Back
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}