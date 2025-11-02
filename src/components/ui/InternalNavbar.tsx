'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { useAlertPopUp } from '@/components/pop-up/AlertPopUpUI';
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

type Role = 'ADMIN' | 'MANAGER' | 'TRAINER' | 'CUSTOMER' | 'SALES' | undefined;
type NavItem = { href: string; label: string; tab?: boolean };

const PRIMARY = { main: '#38E07A', dark: '#2fbb65' } as const;

function roleTabs(role: Role): NavItem[] {
  if (role === 'ADMIN') {
    return [
      { href: '/admin/user-management', label: 'Staff Accounts', tab: true },
      { href: '/admin/customer-management', label: 'Customer Accounts', tab: true },
      { href: '/admin/packages-duration', label: 'Customer Duration Packages', tab: true },
      { href: '/admin/courses-sessions', label: 'Customer Session Courses', tab: true },
      { href: '/admin/products-management', label: 'Products', tab: true },
      { href: '/admin/customer-log', label: 'Customer Log', tab: true },
      { href: '/admin/payments-management', label: 'Payment Accounts', tab: true },
    ];
  }
  if (role === 'MANAGER') return [{ href: '/manager/dashboard', label: 'Dashboard', tab: true }];
  if (role === 'TRAINER') return [{ href: '/trainer/working-hours', label: 'Working Hours', tab: true },
    { href: '/trainer/day-off', label: 'Day Off', tab: true }, { href: '/trainer/my-calendar', label: 'My Calendar', tab: true }
  ];
  if (role === 'CUSTOMER') {
    return [
      { href: '/customer/calendar', label: 'Calendar', tab: true },
      { href: '/customer/member', label: 'Member', tab: true },
      { href: '/customer/package', label: 'Package', tab: true },
    ];
  }
  if (role === 'SALES') return [{ href: '/sales/products', label: 'Packages', tab: true }];
  return [{ href: '/', label: 'Home', tab: true }];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function InternalNavbar(): React.JSX.Element {
  const { user } = useAuth();
  const { setAlert } = useAlertPopUp();
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

  // scrollable labels container & underline bar
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const navRef = React.useRef<HTMLDivElement | null>(null);
  const [bar, setBar] = React.useState({ left: 0, width: 0, visible: false });

  const recalcBar = React.useCallback(() => {
    const container = scrollRef.current;
    const nav = navRef.current;
    if (!container || !nav) return;

    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[data-tab="true"]'));
    if (!links.length) {
      setBar((b) => ({ ...b, visible: false }));
      return;
    }

    const idx = Math.max(0, links.findIndex((a) => isActive(a.getAttribute('href') || '')));
    const el = links[idx] || links[0];

    // position relative to the scroll container (accounts for horizontal scroll)
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const left = eRect.left - cRect.left + container.scrollLeft;

    setBar({ left, width: eRect.width, visible: true });
  }, [isActive]);

  React.useEffect(() => {
    recalcBar();
  }, [pathname, tabs, recalcBar]);

  React.useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => recalcBar();
    container.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(() => recalcBar());
    ro.observe(container);
    return () => {
      container.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [recalcBar]);

  const [open, setOpen] = React.useState(false);

  const onLogout = async (): Promise<void> => {
    try {
      // Call logout API
      let res = await fetch(`${API_BASE_URL}/api/auth/logout`, { 
        method: 'POST', 
        credentials: 'include' 
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/api/auth/logout`, { 
          method: 'GET', 
          credentials: 'include' 
        });
      }
      
      // Show success message
      setAlert({
        open: true,
        msg: '✅ Logged out successfully',
        severity: 'success',
      });
      
      // Wait 4 seconds before redirecting
      setTimeout(() => {
        router.replace('/login');
      }, 4000);
    } catch (error) {
      // Even if API call fails, show message and redirect
      setAlert({
        open: true,
        msg: "✅ Logged out successfully",
        severity: "success",
      });

      setTimeout(() => {
        router.replace("/login");
      }, 4000);
    }
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
              <IconButton aria-label="menu" onClick={() => setOpen(true)} edge="start" sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            {/* LEFT: locked logo */}
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
                flexShrink: 0, // lock
              }}
            >
              <Image src="/gym.png" alt="Private Fitness" width={28} height={28} />
              <Typography variant="h6" sx={{ fontWeight: 400, letterSpacing: '0.3px' }}>
                Private Fitness
              </Typography>
            </Box>

            {/* CENTER: scrollable labels only (desktop) */}
            {isDesktop && (
              <Box
                ref={scrollRef}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  whiteSpace: 'nowrap',
                  // subtle edge fade to hint scroll
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
                  maskImage:
                    'linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)',
                  position: 'relative',
                }}
              >
                <Box
                  ref={navRef}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                    height: 48,
                    px: 1,
                    position: 'relative',
                  }}
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
                          flexShrink: 0,
                        }}
                        onFocus={recalcBar}
                        onMouseEnter={recalcBar}
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
                        transition: 'transform .2s ease, width .2s ease',
                        pointerEvents: 'none',
                        borderRadius: 1,
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}

            {/* RIGHT: locked profile + logout/login */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
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
                  Logout
                </Button>
              ) : (
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  size="small"
                  sx={{ backgroundColor: PRIMARY.main, '&:hover': { backgroundColor: PRIMARY.dark } }}
                >
                  Login
                </Button>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer remains unchanged */}
      <Drawer open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 300 } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src="/profile-icon.png" alt="profile avatar" sx={{ width: 40, height: 40 }} />
          <Box>
            <Typography fontWeight={600}>{user?.firstName ?? 'Guest'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {role ?? 'GUEST'}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List sx={{ py: 0 }}>
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
        <Divider sx={{ my: 1 }} />
        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button component={Link} href={profileHref} variant="outlined" fullWidth onClick={() => setOpen(false)}>
              Profile
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
                Logout
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
                Login
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}