'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Stack,
  IconButton,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Typography,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const PRIMARY = { main: '#38E07A', dark: '#2fbb65' } as const;

const tabs = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/courses', label: 'คอร์ส' },
  { href: '/plans', label: 'แพ็กเกจ' },
  { href: '/contact', label: 'ติดต่อเรา' },
];

export default function MainNavbar(): React.JSX.Element {
  const isDesktop = useMediaQuery('(min-width:900px)');
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'saturate(180%) blur(10px)',
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 64, gap: 1 }}>
            {!isDesktop && (
              <IconButton aria-label="เมนู" onClick={() => setOpen(true)} edge="start" sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            <Box
              component={Link}
              href="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mr: 2,
              }}
            >
              <Image src="/gym.png" alt="Private Fitness" width={28} height={28} />
              <Typography variant="h6" sx={{ fontWeight: 400, letterSpacing: '0.3px' }}>
                Private Fitness
              </Typography>
            </Box>

            {isDesktop && (
              <Stack direction="row" spacing={3} alignItems="center" sx={{ flexGrow: 1 }}>
                {tabs.map((t) => (
                  <Button
                    key={t.href}
                    component={Link}
                    href={t.href}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 300,
                      color: 'text.primary',
                      '&:hover': { color: PRIMARY.dark },
                    }}
                  >
                    {t.label}
                  </Button>
                ))}
              </Stack>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="small"
              sx={{
                backgroundColor: PRIMARY.main,
                '&:hover': { backgroundColor: PRIMARY.dark },
              }}
            >
              เข้าสู่ระบบ
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 260 } }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={500}>
            Private Fitness
          </Typography>
        </Box>
        <Divider />
        <List>
          {tabs.map((t) => (
            <ListItemButton
              key={t.href}
              component={Link}
              href={t.href}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary={t.label} />
              <ChevronRightIcon sx={{ opacity: 0.6 }} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Button
            component={Link}
            href="/login"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: PRIMARY.main,
              '&:hover': { backgroundColor: PRIMARY.dark },
            }}
          >
            เข้าสู่ระบบ
          </Button>
        </Box>
      </Drawer>
    </>
  );
}