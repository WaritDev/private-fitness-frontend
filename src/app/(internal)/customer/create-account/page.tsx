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
import { useSnack } from '@/components/snack/SnackProvider';

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
  const { setSnack } = useSnack();

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
      setError('ไม่พบการยืนยันการชำระเงิน');
      setLoading(false);
      return;
    }

    if (!stored) {
      setError('ไม่พบข้อมูลคำสั่งซื้อ');
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
      setError('ข้อมูลคำสั่งซื้อไม่ถูกต้อง');
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
      setUsernameError('Username ต้องขึ้นต้นด้วยตัวอักษร และมีความยาว 4–30 ตัว (A-Z, a-z, 0–9 เท่านั้น)');
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
      setPasswordError('อย่างน้อย 8 ตัว มี A-Z, a-z, ตัวเลข และอักขระพิเศษ (@$!%*?&)');
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
      setConfirmPasswordError('รหัสผ่านไม่ตรงกัน');
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
      
      if (data.status === 'success' && data.result) {
        if (data.result.exists) {
          setUsernameError('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
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
      setError('กรุณากรอกชื่อผู้ใช้ที่ถูกต้อง');
      return;
    }
    
    if (!password || passwordError) {
      setError('กรุณากรอกรหัสผ่านที่ถูกต้อง');
      return;
    }
    
    if (!confirmPassword || confirmPasswordError) {
      setError('กรุณายืนยันรหัสผ่าน');
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
        throw new Error('ประเภทสินค้าไม่ถูกต้อง');
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
        
        // ✅ แสดง Snackbar ตาม Use Case: "Customer: [Name] Register Successfully"
        const customerName = `${orderData.firstName} ${orderData.lastName}`;
        setSnack({
          open: true,
          msg: `✅ Customer: ${customerName} Register Successfully! (Username: ${username})`,
          severity: 'success'
        });
        
        // Redirect to products page (Sales role) หลังจาก 1.5 วินาที
        setTimeout(() => {
          router.push('/sales/products');
        }, 1500);
      } else {
        throw new Error(result.message || 'ไม่สามารถสร้างบัญชีได้');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างบัญชี');
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
          <Typography>กำลังโหลดข้อมูล...</Typography>
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
            กลับหน้า Products
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ px: 0 }}>
      <Stack spacing={2} sx={{ px: 2, py: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          สร้างบัญชีผู้ใช้
        </Typography>

        {/* Customer Info Summary */}
        {orderData && (
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={700}>ข้อมูลลูกค้า</Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">ชื่อ-นามสกุล:</Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="caption" fontWeight={600}>
                    {orderData.firstName} {orderData.lastName}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">อีเมล:</Typography>
                </Grid>
                <Grid size={{ xs: 8 }}>
                  <Typography variant="caption" fontWeight={600}>{orderData.email}</Typography>
                </Grid>
                
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">เบอร์โทร:</Typography>
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
              ข้อมูลการเข้าสู่ระบบ
            </Typography>

            {error && orderData && (
              <Alert severity="error">{error}</Alert>
            )}

            {/* Username */}
            <TextField
              label="ชื่อผู้ใช้ (Username)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={Boolean(usernameError)}
              helperText={usernameError || 'Username ต้องขึ้นต้นด้วยตัวอักษร และมีความยาว 4–30 ตัว (A-Z, a-z, 0–9 เท่านั้น)'}
              fullWidth
              required
              disabled={creating}
              placeholder="กรุณากรอกชื่อผู้ใช้"
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
              label="รหัสผ่าน (Password)"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(passwordError)}
              helperText={passwordError || 'อย่างน้อย 8 ตัว มี A-Z, a-z, ตัวเลข และอักขระพิเศษ (@$!%*?&)'}
              fullWidth
              required
              disabled={creating}
              placeholder="กรุณากรอกรหัสผ่าน"
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
              label="ยืนยันรหัสผ่าน (Confirm Password)"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(confirmPasswordError)}
              helperText={confirmPasswordError || 'กรอกรหัสผ่านอีกครั้งเพื่อยืนยัน'}
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
              ข้อมูลนี้จะใช้สำหรับให้ลูกค้าเข้าสู่ระบบ กรุณาบันทึกและแจ้งให้ลูกค้าทราบ
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
                กำลังสร้างบัญชี...
              </>
            ) : (
              '✅ สร้างบัญชีและเสร็จสิ้น'
            )}
          </Button>

          <Button
            variant="outlined"
            onClick={() => router.back()}
            disabled={creating}
            size="small"
          >
            ย้อนกลับ
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}