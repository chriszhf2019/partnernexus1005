import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/auth-service';
import type { AuthUser, UserRole } from '../services/auth-service';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  role: UserRole;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 10,
  channel_director: 8, marketing_director: 8, sales_director: 8,
  channel_manager: 6, marketing_manager: 6, sales_manager: 6,
  partner_admin: 4, partner_sales: 2, partner_engineer: 1,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>('partner_sales');

  useEffect(() => {
    const unsubscribe = authService.onAuthChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      authService.getUserRole(user.uid).then(setRole).catch(() => setRole('partner_sales'));
    } else {
      setRole('partner_sales');
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const authUser = await authService.login(email, password);
    setUser(authUser);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (requiredRole: UserRole) => ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole],
    [role],
  );

  // useMemo: prevent value object recreation on every render
  const value = useMemo<AuthContextType>(() => ({
    user, loading, login, logout, role, hasPermission,
  }), [user, loading, login, logout, role, hasPermission]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};