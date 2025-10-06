type UserRole = "ADMIN" | "SALES" | "TRAINER" | "CUSTOMER" | "MANAGER" | "GUEST";

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


export type { User, UserRole, AuthContextValue, AuthUser };