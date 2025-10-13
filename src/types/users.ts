type UserRole = "ADMIN" | "SALES" | "TRAINER" | "CUSTOMER" | "MANAGER" | "GUEST";

type DbUser = {
  Username: string;
  Password: string;
  Role: 'CUSTOMER'|'TRAINER'|'SALES'|'MANAGER'|'ADMIN';
  First_Name: string;
  Last_Name: string;
  Gmail: string | null;
  Is_Active: number | boolean;
};

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileUrl?: string;
}

type AuthUser = { sub: string; role: UserRole; name?: string; email?: string };

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  hasAnyRole: (...roles: UserRole[]) => boolean;
};


export type { DbUser, User, UserRole, AuthContextValue, AuthUser };