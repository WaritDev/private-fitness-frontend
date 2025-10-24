import type { UserRole } from '@/types/users';

export function defaultPathForRole(role: UserRole) {
  switch (role) {
    case 'ADMIN':
      return '/admin/user-management';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'TRAINER':
      return '/trainer/calendar-management';
    case 'SALES':
      return '/registration';
    case 'CUSTOMER':
      return '/customer/calendar';
    default:
      return '/';
  }
}