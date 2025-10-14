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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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
        bgcolor: (t) => t.palette.background.default,
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
        }}
      >
        <form onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Login
              </Typography>
              <Typography variant="body2" color="text.secondary">
                เข้าสู่ระบบเพื่อจัดการข้อมูลของคุณ
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
            />

            <TextField
              label="Password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
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
              color="success"
              size="large"
              disabled={loading}
              sx={{ mt: 0.5 }}
              fullWidth
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}