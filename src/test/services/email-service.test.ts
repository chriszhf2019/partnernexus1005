import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('emailService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('generateTempPassword', () => {
    it('generates password with correct length', async () => {
      const { generateTempPassword } = await import('../../services/email-service');
      const pw = generateTempPassword();
      expect(pw.length).toBe(10);
    });

    it('only uses allowed characters (no I, L, O, 0, 1)', async () => {
      const { generateTempPassword } = await import('../../services/email-service');
      for (let i = 0; i < 20; i++) {
        const pw = generateTempPassword();
        expect(pw).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789]{10}$/);
      }
    });

    it('generates different passwords each call', async () => {
      const { generateTempPassword } = await import('../../services/email-service');
      const pw1 = generateTempPassword();
      const pw2 = generateTempPassword();
      expect(pw1).not.toBe(pw2);
    });
  });

  describe('sendInviteEmail', () => {
    const mockInvite = {
      email: 'partner@test.com',
      name: '测试伙伴',
      role: 'partner_sales',
      tempPassword: 'Abc123Xyz9',
      inviteUrl: 'https://partner.velolabs.top/login',
    };

    it('succeeds via Supabase Edge Function', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as any);

      const { sendInviteEmail } = await import('../../services/email-service');
      const result = await sendInviteEmail(mockInvite);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const callUrl = fetchMock.mock.calls[0][0] as string;
      expect(callUrl).toContain('supabase.co/functions/v1/send-invite');
      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(callBody.email).toBe('partner@test.com');
      expect(callBody.name).toBe('测试伙伴');
    });

    it('falls back to Resend API when Edge Function fails', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch');
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal error' }),
      } as any);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as any);

      vi.resetModules();
      const { sendInviteEmail } = await import('../../services/email-service');
      const result = await sendInviteEmail(mockInvite);
      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const resendUrl = fetchMock.mock.calls[1][0] as string;
      expect(resendUrl).toBe('https://api.resend.com/emails');
      const resendHeaders = fetchMock.mock.calls[1][1].headers as Record<string, string>;
      expect(resendHeaders['Authorization']).toContain('Bearer');
    });

    it('returns error when Resend key is not configured and edge function fails', async () => {
      vi.stubEnv('VITE_RESEND_API_KEY', '');
      vi.resetModules();
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network error'));

      const { sendInviteEmail } = await import('../../services/email-service');
      const result = await sendInviteEmail(mockInvite);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Resend API key not configured (set VITE_RESEND_API_KEY)');
    });
  });
});
