'use client';

import * as React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Calendar', href: '/customer/calendar', icon: <EventIcon /> },
  { label: 'Member', href: '/customer/member', icon: <GroupIcon /> },
  { label: 'Package', href: '/customer/package', icon: <ManageAccountsIcon /> },
];

export default function CustomerMobileNav() {
  const pathname = usePathname();
  const value = Math.max(
    0,
    tabs.findIndex(t => pathname?.startsWith(t.href)) // match segment
  );

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        pb: 'env(safe-area-inset-bottom)',
        zIndex: (t) => t.zIndex.appBar,
      }}
    >
      <BottomNavigation showLabels value={value}>
        {tabs.map((t) => (
          <BottomNavigationAction
            key={t.href}
            icon={t.icon}
            label={t.label}
            LinkComponent={Link as any}
            href={t.href}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}