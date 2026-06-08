import { describe, it, expect, vi, beforeEach } from 'vitest';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      updateUser: vi.fn(),
    },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Add a mock user to localStorage so hasValidSupabaseConfig returns false path
    // Actually the module evaluates hasValidSupabaseConfig at import time via the mock
    import.meta.env.VITE_USE_MOCK_AUTH = 'true';
  });

  describe('login (mock mode)', () => {
    it('logs in with valid mock email and any password', async () => {
      const { authService } = await import('../../services/auth-service');
      const user = await authService.login('admin@partnernxus.com', 'any_password');
      expect(user).toBeDefined();
      expect(user.email).toBe('admin@partnernxus.com');
      expect(user.displayName).toBe('系统管理员');
    });

    it('rejects unknown email', async () => {
      const { authService } = await import('../../services/auth-service');
      await expect(authService.login('unknown@test.com', 'password'))
        .rejects.toThrow('Invalid login credentials');
    });
  });

  describe('getUserRole', () => {
    it('returns partner_sales for unknown user', async () => {
      const { authService } = await import('../../services/auth-service');
      const role = await authService.getUserRole('unknown-uid');
      expect(role).toBe('partner_sales');
    });

    it('returns role stored in localStorage', async () => {
      const { authService } = await import('../../services/auth-service');
      localStorageMock.setItem('role_mock_admin', 'admin');
      const role = await authService.getUserRole('mock_admin');
      expect(role).toBe('admin');
    });
  });

  describe('setUserRole', () => {
    it('persists role to localStorage', async () => {
      const { authService } = await import('../../services/auth-service');
      await authService.setUserRole('test-uid', 'channel_manager');
      expect(localStorageMock.getItem('role_test-uid')).toBe('channel_manager');
    });
  });

  describe('ROLE_LABELS', () => {
    it('has labels for all roles', async () => {
      const { ROLE_LABELS, isInternalRole, isExternalRole } = await import('../../services/auth-service');
      expect(Object.keys(ROLE_LABELS).length).toBeGreaterThan(0);
      expect(isInternalRole('admin')).toBe(true);
      expect(isInternalRole('partner_sales')).toBe(false);
      expect(isExternalRole('partner_sales')).toBe(true);
      expect(isExternalRole('admin')).toBe(false);
    });
  });
});
