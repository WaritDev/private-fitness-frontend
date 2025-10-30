'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { defaultPathForRole } from '@/lib/roleRedirect';
import { useSnack } from '@/components/snack/SnackProvider';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const PRIMARY = { main: '#38E07A', dark: '#2fbb65' } as const;

// Backend API Base URL
const API_BASE_URL = 'http://localhost:8000';

export default function LoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  
  const router = useRouter();
  const { setSnack } = useSnack();

  /**
   * ตรวจสอบค่าว่างของ Username และ Password
   */
  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username ห้ามค่าว่าง
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }

    // Password ห้ามค่าว่าง
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * จัดการการเข้าสู่ระบบ
   */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});

    // Step 4: ตรวจสอบ Model Validation
    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      // เรียก Backend API (ตรวจสอบ Username & Password)
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // รับ cookie จาก backend
      });

      const data = await response.json();

      // Golang Backend ใช้ status: "OK"
      if (response.ok && data.status === 'OK') {
        // Login สำเร็จ - Backend อัปเดต Updated_At แล้ว
        const user = data.result?.user;
        
        if (!user || !user.role) {
          console.error('User data not found in response:', data);
          setErrors({ form: 'Invalid response from server' });
          return;
        }

        // Step 9: Redirect ไปยัง Landing Page ตาม Role
        const targetPath = defaultPathForRole(user.role);
        console.log('Redirecting to:', targetPath);

        // แสดง Pop-up ข้อความสำเร็จ
        setSnack({
          open: true,
          msg: `เข้าสู่ระบบสำเร็จ ✅ ยินดีต้อนรับ คุณ ${user.firstName || user.first_name || username}!`,
          severity: 'success',
        });

        // Redirect ทันที (Snackbar จะแสดงในหน้าใหม่)
        setTimeout(() => {
          window.location.href = targetPath;
        }, 1500);

      } else {
        // Step 6-7: Database Validation Failed
        console.error('Login failed:', data);
        handleLoginError(data.message || 'Login failed');
      }

    } catch (error) {
      console.error('Login error:', error);
      setErrors({ form: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์' });
    } finally {
      setLoading(false);
    }
  }

  /**
   * จัดการ Error Message ตาม Use Case
   * - Username or Password is Incorrect (Step 6)
   * - This account has been suspended (Step 7)
   */
  const handleLoginError = (message: string) => {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('invalid credentials') || lowerMsg.includes('incorrect')) {
      // Step 6: Username หรือ Password ไม่ถูกต้อง
      setErrors({ form: 'Username or Password is Incorrect' });
    } else if (lowerMsg.includes('suspended') || lowerMsg.includes('inactive')) {
      // Step 7: บัญชีถูกระงับ
      setErrors({ form: 'This account has been suspended.' });
    } else {
      // Error อื่นๆ
      setErrors({ form: message });
    }
  };

  /**
   * Clear error when user starts typing
   */
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: '' }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        px: 2,
        py: 4,
      }}
    >
      {/* Background Image */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/hero-1.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
          opacity: 0.5,
          zIndex: 0,
        }}
      />

      {/* Login Form */}
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,1)',
          zIndex: 1,
        }}
      >
        <form onSubmit={handleLogin} noValidate>
          <Stack spacing={3}>
            {/* Header */}
            <Box textAlign="center" mb={1}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                เข้าสู่ระบบ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ลงชื่อเข้าใช้งานเพื่อจัดการข้อมูล Private Fitness
              </Typography>
            </Box>

            {/* Form-level Error Message */}
            {errors.form && (
              <Typography 
                variant="body2" 
                color="error" 
                sx={{ 
                  textAlign: 'center',
                  p: 1.5,
                  backgroundColor: 'error.lighter',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'error.main',
                }}
              >
                {errors.form}
              </Typography>
            )}

            {/* Username Field */}
            <TextField
              label="Username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
              fullWidth
              required
              autoFocus
              variant="outlined"
            />

            {/* Password Field */}
            <TextField
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              fullWidth
              required
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPw((prev) => !prev)}
                      edge="end"
                    >
                      {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
              sx={{
                mt: 1,
                py: 1.2,
                fontWeight: 500,
                fontSize: '1rem',
                backgroundColor: PRIMARY.main,
                '&:hover': { backgroundColor: PRIMARY.dark },
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            <Divider />

            <Typography variant="caption" color="text.secondary" textAlign="center">
              © {new Date().getFullYear()} Private Fitness
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}