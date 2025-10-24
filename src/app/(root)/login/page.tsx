'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { defaultPathForRole } from '@/lib/roleRedirect';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const PRIMARY = { main: '#38E07A', dark: '#2fbb65' } as const;

export default function LoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || 'Login failed');
      return;
    }
    const j = await res.json().catch(() => ({}));
    const role = j?.user?.role;
    const to = role ? defaultPathForRole(role) : '/';
    router.replace(to);
  }

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
        <form onSubmit={onSubmit} noValidate>
          <Stack spacing={3}>
            <Box textAlign="center" mb={1}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                เข้าสู่ระบบ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ลงชื่อเข้าใช้งานเพื่อจัดการข้อมูล Private Fitness
              </Typography>
            </Box>

            {err && <Alert severity="error">{err}</Alert>}

            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              autoFocus
              variant="outlined"
            />

            <TextField
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPw((s) => !s)}
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