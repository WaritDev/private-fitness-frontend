type UserRole = "admin" | "sales" | "trainer" | "customer" | "guest";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileUrl?: string;
}


interface AuthContextType {
  user: User | null;
  userRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  checkPermission: (requiredRoles: UserRole[]) => boolean;
}


export type { User, UserRole, AuthContextType };