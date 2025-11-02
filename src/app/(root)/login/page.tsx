'use client';

import React from 'react';
import { defaultPathForRole } from '@/lib/roleRedirect';
import { useAlertPopUp } from '@/components/pop-up/AlertPopUpUI';
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function LoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const { setAlert } = useAlertPopUp();

  const validateFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (!validateFields()) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.status === 'OK') {
        const user = data.result?.user;
        if (!user || !user.role) {
          setErrors({ form: 'Invalid response from server' });
          return;
        }

        if (!user.isActive) {
          setAlert({
            open: true,
            msg: `This account has been suspended.`,
            severity: 'error',
          });
          setLoading(false);
          return;
        }

        const targetPath = defaultPathForRole(user.role);

        setAlert({
          open: true,
          msg: `Signed in successfully ✅ Welcome, ${user.firstName || user.first_name || username}!`,
          severity: 'success',
        });

        setTimeout(() => {
          window.location.href = targetPath;
        }, 1200);
      } else {
        handleLoginError(data.message || 'Login failed');
      }
    } catch {
      setErrors({ form: 'Failed to connect to the server' });
    } finally {
      setLoading(false);
    }
  }

  const handleLoginError = (message: string) => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('invalid credentials') || lowerMsg.includes('incorrect')) {
      setErrors({ form: 'Username or password is incorrect' });
    } else if (lowerMsg.includes('suspended') || lowerMsg.includes('inactive')) {
      setErrors({ form: 'This account has been suspended.' });
    } else {
      setErrors({ form: message });
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
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
            <Box textAlign="center" mb={1}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Sign in
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access your Private Fitness dashboard
              </Typography>
            </Box>

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