'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Stack,
  IconButton,
  Button,
  Avatar,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Typography,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

type Role =
  | 'ADMIN'
  | 'MANAGER'
  | 'TRAINER'
  | 'CUSTOMER'
  | 'SALES'
  | undefined;

type NavItem = { href: string; label: string; tab?: boolean };

const PRIMARY = { main: '#38E07A', dark: '#2fbb65' } as const;

function roleTabs(role: Role): NavItem[] {
  if (role === 'ADMIN') {
    return [
      { href: '/admin/user-management', label: 'จัดการผู้ใช้', tab: true },
      { href: '/admin/customer-management', label: 'จัดการลูกค้า', tab: true },
      { href: '/admin/packages-duration', label: 'แพ็กเกจ Duration', tab: true },
      { href: '/admin/courses-sessions', label: 'คอร์ส Sessions', tab: true },
      { href: '/admin/products-management', label: 'Products', tab: true },
      { href: '/admin/payments-management', label: 'Payment', tab: true },
      { href: '/admin/customer-log', label: 'Customer Log', tab: true },
    ];
  }
  if (role === 'MANAGER') return [{ href: '/manager/dashboard', label: 'แดชบอร์ด', tab: true }];
  if (role === 'TRAINER')
    return [{ href: '/trainer/calendar-management', label: 'จัดการปฏิทิน', tab: true }];
  if (role === 'CUSTOMER') {
    return [
      { href: '/', label: 'หน้าแรก', tab: true },
      { href: '/customer/calendar', label: 'ปฏิทิน', tab: true },
      { href: '/customer/member', label: 'สมาชิกของฉัน', tab: true },
    ];
  }
  if (role === 'SALES') {
    return [
      { href: '/', label: 'หน้าแรก', tab: true },
      { href: '/products', label: 'คอร์ส', tab: true },
    ];
  }
  // ยังไม่ล็อกอิน
  return [
    { href: '/', label: 'หน้าแรก', tab: true },
    { href: '/courses', label: 'คอร์ส', tab: true },
    { href: '/plans', label: 'แพ็กเกจ', tab: true },
  ];
}

export default function InternalNavbar(): React.JSX.Element {
  const { user } = useAuth();
  const role = user?.role as Role;
  const pathname = usePathname();
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width:900px)');

  const profileHref = user ? `/profile/${encodeURIComponent(user.sub)}` : '/login';
  const tabs = React.useMemo(() => roleTabs(role), [role]);

  const isActive = React.useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/';
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const navRef = React.useRef<HTMLDivElement | null>(null);
  const [bar, setBar] = React.useState({ left: 0, width: 0, visible: false });

  const recalcBar = React.useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[data-tab="true"]'));
    if (!links.length) return setBar((b) => ({ ...b, visible: false }));

    const idx = Math.max(0, links.findIndex((a) => isActive(a.getAttribute('href') || '')));
    const el = links[idx] || links[0];
    const navRect = nav.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setBar({ left: rect.left - navRect.left, width: rect.width, visible: true });
  }, [isActive]);

  React.useEffect(() => {
    recalcBar();
  }, [pathname, tabs, recalcBar]);

  React.useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(() => recalcBar());
    ro.observe(nav);
    return () => ro.disconnect();
  }, [recalcBar]);

  const [open, setOpen] = React.useState(false);

  const onLogout = async (): Promise<void> => {
    try {
      let res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!res.ok) res = await fetch('/api/auth/logout', { method: 'GET', credentials: 'include' });
    } catch {}
    router.replace('/login');
  };

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
              <Box
                ref={navRef}
                sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2, height: 48 }}
              >
                {tabs.map((t) => {
                  const active = isActive(t.href);
                  return (
                    <Box
                      key={t.href}
                      component={Link}
                      href={t.href}
                      data-tab={t.tab ? 'true' : 'false'}
                      sx={{
                        position: 'relative',
                        color: active ? PRIMARY.dark : 'text.primary',
                        opacity: active ? 1 : 0.82,
                        textDecoration: 'none',
                        fontWeight: 300,
                        px: 1,
                        py: 1,
                        borderBottom: '2px solid transparent',
                        transition: 'color .15s ease, opacity .15s ease',
                        '&:hover': { opacity: 1, color: PRIMARY.dark },
                        whiteSpace: 'nowrap',
                        '&::after': { display: 'none !important' },
                      }}
                    >
                      {t.label}
                    </Box>
                  );
                })}

                {bar.visible && (
                  <Box
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      height: 2,
                      width: bar.width,
                      transform: `translateX(${bar.left}px)`,
                      backgroundColor: PRIMARY.main,
                      transition: 'transform .22s ease, width .22s ease',
                      pointerEvents: 'none',
                      borderRadius: 1,
                    }}
                  />
                )}
              </Box>
)}

            <Box sx={{ flexGrow: 1 }} />

            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton component={Link} href={profileHref} aria-label="โปรไฟล์" sx={{ p: 0.5 }}>
                <Avatar
                  src="/profile-icon.png"
                  alt="profile"
                  sx={{ width: 36, height: 36, border: (t) => `2px solid ${t.palette.divider}` }}
                />
              </IconButton>
              {user ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onLogout}
                  startIcon={<LogoutIcon />}
                  sx={{
                    borderColor: 'text.secondary',
                    color: 'text.primary',
                    '&:hover': { borderColor: PRIMARY.dark, color: PRIMARY.dark, backgroundColor: 'transparent' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  ออกจากระบบ
                </Button>
              ) : (
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  size="small"
                  sx={{ backgroundColor: PRIMARY.main, '&:hover': { backgroundColor: PRIMARY.dark } }}
                >
                  เข้าสู่ระบบ
                </Button>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 300 } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src="/profile-icon.png" alt="profile" sx={{ width: 40, height: 40 }} />
          <Box>
            <Typography fontWeight={600}>{user?.name ?? 'ผู้เยี่ยมชม'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {role ?? 'GUEST'}
            </Typography>
          </Box>
        </Box>
        <Divider />

        <List sx={{ py: 0 }}>
          {tabs.map((t) => {
            const active = isActive(t.href);
            return (
              <ListItemButton
                key={t.href}
                component={Link}
                href={t.href}
                onClick={() => setOpen(false)}
                selected={active}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(56,224,122,0.12)',
                    '& .MuiListItemText-primary': { color: PRIMARY.dark, fontWeight: 500 },
                  },
                }}
              >
                <ListItemText primary={t.label} primaryTypographyProps={{ fontWeight: active ? 500 : 300 }} />
                <ChevronRightIcon sx={{ opacity: 0.6 }} />
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ my: 1 }} />
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button component={Link} href={profileHref} variant="outlined" fullWidth onClick={() => setOpen(false)}>
              โปรไฟล์
            </Button>
            {user ? (
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                startIcon={<LogoutIcon />}
                sx={{ backgroundColor: PRIMARY.main, color: '#0e2016', '&:hover': { backgroundColor: PRIMARY.dark } }}
              >
                ออกจากระบบ
              </Button>
            ) : (
              <Button
                component={Link}
                href="/login"
                variant="contained"
                fullWidth
                onClick={() => setOpen(false)}
                sx={{ backgroundColor: PRIMARY.main, color: '#0e2016', '&:hover': { backgroundColor: PRIMARY.dark } }}
              >
                เข้าสู่ระบบ
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}