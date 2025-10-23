import type { UserRole } from '@/types/users';

export function defaultPathForRole(role: UserRole) {
  switch (role) {
    case 'ADMIN':
    case 'MANAGER':
      return '/dashboard';
    case 'TRAINER':
      return '/calendar-management';
    case 'SALES':
      return '/registration';
    case 'CUSTOMER':
      return '/customer/calendar';
    default:
      return '/';
  }
}