'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@mui/material';

type NavItem = { href: string; label: string; tab?: boolean };

function AdminNavbar() {
  const { user } = useAuth();
  const role = user?.role;
  const router = useRouter();
  const pathname = usePathname();
  const profileHref = user ? `/profile/${encodeURIComponent(user.sub)}` : '/login';

  // เมนูตามสิทธิ์
  const tabs: NavItem[] = React.useMemo(() => {
    if (role === 'ADMIN') {
      return [
        { href: "/user-management", label: "จัดการผู้ใช้", tab: true },
        { href: "/customer-management", label: "จัดการลูกค้า", tab: true },
        { href: "/packages-duration", label: "แพ็กเกจ Duration", tab: true },
        { href: "/courses-sessions", label: "คอร์ส Sessions", tab: true },
        { href: "/products-management", label: "Products", tab: true },
        { href: "/customer-log", label: "Customer Log", tab: true },
      ];
    }
    if (role === 'MANAGER') {
      return [
        { href: '/dashboard', label: 'แดชบอร์ด', tab: true },
      ];
    }
    if (role === 'TRAINER') {
      return [
        { href: '/', label: 'หน้าแรก', tab: true },
        { href: '/calendar-management', label: 'จัดการปฏิทิน', tab: true },
      ];
    }
    if (role === 'CUSTOMER') {
      return [
        { href: '/', label: 'หน้าแรก', tab: true },
        { href: '/calendar', label: 'ปฏิทิน', tab: true },
        { href: '/member', label: 'สมาชิกของฉัน', tab: true },
      ];
    }
    if (role === 'SALES') {
      return [
        { href: '/', label: 'หน้าแรก', tab: true },
        { href: '/products', label: 'คอร์ส', tab: true },
        { href: '/registration', label: 'ลงทะเบียน', tab: true },
      ];
    }
    return [];
  }, [role]);

  // เช็ค active
  const isActive = React.useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/';
      if (href === '/profile') return pathname.startsWith('/profile');
      return pathname.startsWith(href);
    },
    [pathname]
  );

  // Animated underline
  const navRef = React.useRef<HTMLDivElement | null>(null);
  const [bar, setBar] = React.useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  });

  const recalcBar = React.useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a.nav-link[data-tab="true"]'));
    if (!links.length) {
      setBar((b) => ({ ...b, visible: false }));
      return;
    }
    const idx = Math.max(
      0,
      links.findIndex((a) => isActive(a.getAttribute('href') || ''))
    );
    const el = links[idx] || links[0];
    const navRect = nav.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const left = rect.left - navRect.left;
    const width = rect.width;
    setBar({ left, width, visible: true });
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

  // Logout
  const onLogout = async () => {
    try {
      // รองรับทั้ง POST/GET
      let res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!res.ok) res = await fetch('/api/auth/logout', { method: 'GET', credentials: 'include' });
    } catch {}
    router.replace('/login');
  };

  if (!role) return null;

  return (
    <header className="site-header">
      <div className="container topbar">
        <div className="brand">Private Fitness</div>
        <nav
          className="topnav"
          aria-label="main navigation"
          ref={navRef}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}
        >
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`nav-link ${isActive(t.href) ? 'is-active' : ''}`}
              data-tab={t.tab ? 'true' : 'false'}
              style={{
                padding: '8px 10px',
                borderBottom: isActive(t.href) ? '2px solid currentColor' : '2px solid transparent',
                transition: 'color .15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </Link>
          ))}

          {/* Underline slider (ตกแต่งเพิ่มจาก border-bottom ต่อแท็บ) */}
          {bar.visible && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 2,
                width: bar.width,
                transform: `translateX(${bar.left}px)`,
                background: 'currentColor',
                transition: 'transform .2s ease, width .2s ease',
                pointerEvents: 'none',
              }}
            />
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href={profileHref} className="text-gray-600 hover:text-gray-800 font-semibold" aria-label="Profile">
              <Image src="/profile-icon.png" alt="profile icon" width={40} height={40} />
            </Link>
            <Button
              variant='outlined'
              onClick={onLogout}
              style={{ whiteSpace: 'nowrap' }}
            >
              ออกจากระบบ
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default AdminNavbar;