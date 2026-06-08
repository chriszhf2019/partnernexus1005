import { supabase } from '../lib/supabase';
import { debug } from '../lib/debug';
import type { User } from '@supabase/supabase-js';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

// 公司内部角色
// admin: 系统管理员, channel_director/manager: 渠道团队, marketing_director/manager: 市场团队, sales_director/manager: 销售团队
// 公司外部角色（渠道商）
// partner_admin: 渠道商管理员, partner_sales: 渠道商销售, partner_engineer: 渠道商工程师
export type UserRole = 'admin' | 'channel_director' | 'channel_manager' | 'marketing_director' | 'marketing_manager' | 'sales_director' | 'sales_manager' | 'partner_admin' | 'partner_sales' | 'partner_engineer';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '系统管理员',
  channel_director: '渠道总监', channel_manager: '渠道经理',
  marketing_director: '市场总监', marketing_manager: '市场经理',
  sales_director: '销售总监', sales_manager: '销售经理',
  partner_admin: '渠道商管理员', partner_sales: '渠道商销售', partner_engineer: '渠道商工程师',
};

// Internal vs external categorization
export const isInternalRole = (role: UserRole): boolean => ['admin','channel_director','channel_manager','marketing_director','marketing_manager','sales_director','sales_manager'].includes(role);
export const isExternalRole = (role: UserRole): boolean => ['partner_admin','partner_sales','partner_engineer'].includes(role);

// Mock users for development/testing
// 开发/测试用 mock 用户（仅 mock 模式下有效，任意密码均可登录）
// 生产环境通过 Supabase Auth 认证，不会读取此列表
const MOCK_USERS: Record<string, { role: UserRole; displayName: string }> = {
  'admin@partnernxus.com': { role: 'admin', displayName: '系统管理员' },
  'channel@partnernxus.com': { role: 'channel_manager', displayName: '渠道经理' },
  'marketing@partnernxus.com': { role: 'marketing_manager', displayName: '市场经理' },
  'partner@partnernxus.com': { role: 'partner_admin', displayName: '渠道商管理员' },
  'sales@partnernxus.com': { role: 'partner_sales', displayName: '渠道商销售' },
  'partner@example.com': { role: 'partner_admin', displayName: '渠道商管理员' },
};

const toAuthUser = (user: User | null): AuthUser | null => {
  if (!user) return null;
  return { uid: user.id, email: user.email, displayName: user.user_metadata?.display_name || null, photoURL: user.user_metadata?.avatar_url || null };
};

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = () => {
  // Check if we have required env variables
  const hasUrl = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://demo.supabase.co';
  const hasKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // For demo purposes, use mock auth unless properly configured
  // In production, set VITE_USE_MOCK_AUTH=false to use real Supabase
  const useMock = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';
  
  return hasUrl && hasKey && !useMock;
};

export const authService = {
  login: async (email: string, password: string): Promise<AuthUser> => {
    // Use mock authentication for development/testing
    if (!hasValidSupabaseConfig()) {
      const mockUser = MOCK_USERS[email.toLowerCase()];
      if (mockUser) {
        // Store role in localStorage
        const uid = `mock_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.setItem(`role_${uid}`, mockUser.role);
        localStorage.setItem(`mock_user`, JSON.stringify({ email, uid, displayName: mockUser.displayName }));
        return { uid, email, displayName: mockUser.displayName, photoURL: null };
      }
      throw new Error('Invalid login credentials');
    }

    // Use real Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed');
    return toAuthUser(data.user)!;
  },
  signup: async (email: string, password: string, displayName?: string): Promise<AuthUser> => {
    if (!hasValidSupabaseConfig()) {
      // Mock signup
      const uid = `mock_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const role: UserRole = 'partner_admin';
      localStorage.setItem(`role_${uid}`, role);
      localStorage.setItem(`mock_user`, JSON.stringify({ email, uid, displayName: displayName || email.split('@')[0] }));
      return { uid, email, displayName: displayName || email.split('@')[0], photoURL: null };
    }

    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName || email.split('@')[0], role: 'partner_admin' } } });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed');
    return toAuthUser(data.user)!;
  },
  logout: async () => {
    localStorage.removeItem('mock_user');
    if (hasValidSupabaseConfig()) {
      await supabase.auth.signOut();
    }
  },
  getCurrentUser: async (): Promise<AuthUser | null> => {
    // Check mock user first
    const mockUserStr = localStorage.getItem('mock_user');
    if (mockUserStr && !hasValidSupabaseConfig()) {
      try {
        const mockUser = JSON.parse(mockUserStr);
        return { uid: mockUser.uid, email: mockUser.email, displayName: mockUser.displayName, photoURL: null };
      } catch {
        return null;
      }
    }

    // Use real Supabase
    const { data } = await supabase.auth.getSession();
    return toAuthUser(data.session?.user || null);
  },
  onAuthChange: (callback: (user: AuthUser | null) => void): (() => void) => {
    // For mock mode, check localStorage
    if (!hasValidSupabaseConfig()) {
      const checkMockUser = () => {
        const mockUserStr = localStorage.getItem('mock_user');
        if (mockUserStr) {
          try {
            const mockUser = JSON.parse(mockUserStr);
            callback({ uid: mockUser.uid, email: mockUser.email, displayName: mockUser.displayName, photoURL: null });
          } catch {
            callback(null);
          }
        } else {
          callback(null);
        }
      };
      
      // Initial check
      setTimeout(checkMockUser, 0);
      
      // Listen for storage changes (for logout from other tabs)
      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'mock_user') {
          checkMockUser();
        }
      };
      window.addEventListener('storage', handleStorage);
      
      return () => window.removeEventListener('storage', handleStorage);
    }

    // Use real Supabase
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(toAuthUser(session?.user || null)));
    return () => data.subscription.unsubscribe();
  },
  getUserRole: async (uid: string): Promise<UserRole> => {
    // Check mock role first
    if (!hasValidSupabaseConfig()) {
      const stored = localStorage.getItem(`role_${uid}`);
      if (stored && Object.keys(ROLE_LABELS).includes(stored)) return stored as UserRole;
      return 'partner_sales';
    }

    // Read from Supabase session user_metadata first (authoritative source)
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.user_metadata?.role) {
        const role = data.session.user.user_metadata.role;
        if (Object.keys(ROLE_LABELS).includes(role)) return role as UserRole;
      }
    } catch (e) { debug.warn('[authService] getUserRole failed:', e); }
    // Fall back to localStorage for backward compatibility
    const stored = localStorage.getItem(`role_${uid}`);
    if (stored && Object.keys(ROLE_LABELS).includes(stored)) return stored as UserRole;
    return 'partner_sales';
  },
  setUserRole: async (uid: string, role: UserRole): Promise<void> => {
    localStorage.setItem(`role_${uid}`, role);
    // Also persist to Supabase user metadata (server-side enforcement)
    if (hasValidSupabaseConfig()) {
      try { await supabase.auth.updateUser({ data: { role } }); } catch (e) { debug.warn('[authService] setUserRole failed:', e); }
    }
  },
};
