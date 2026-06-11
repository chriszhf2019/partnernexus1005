const FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL || 'https://ezkbjufluczpxdixplxu.supabase.co/functions/v1/send-invite';
const RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY || '';

export interface InviteEmail {
  email: string;
  name: string;
  role: string;
  tempPassword: string;
  inviteUrl?: string;
}

export async function sendInviteEmail(invite: InviteEmail): Promise<{ success: boolean; error?: string }> {
  // Try Supabase Edge Function first
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invite),
    });
    const data = await res.json();
    if (res.ok) return { success: true };
  } catch { /* fallback to direct Resend API */ }

  if (!RESEND_KEY) {
    return { success: false, error: 'Resend API key not configured (set VITE_RESEND_API_KEY)' };
  }

  // Fallback: Resend API directly
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'PartnerNexus <noreply@partner.velolabs.top>',
        to: [invite.email],
        subject: `🎉 欢迎加入 PartnerNexus — ${invite.name} 的账户已创建`,
        html: `<div style="max-width:600px;margin:0 auto;font-family:sans-serif;padding:24px;background:#f8fafc"><div style="background:#fff;border-radius:16px;padding:32px"><h1 style="color:#00288e">🎉 欢迎加入 PartnerNexus</h1><p>您好 <strong>${invite.name}</strong>，您的 PartnerNexus 账户已由管理员创建完成。</p><div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0"><p>账户: <strong>${invite.email}</strong></p><p>临时密码: <strong>${invite.tempPassword}</strong></p></div><a href="${invite.inviteUrl || 'https://partner.velolabs.top/login'}" style="display:inline-block;background:#00288e;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600">前往登录 →</a><p style="color:#94a3b8;font-size:13px;margin-top:24px">首次登录后请立即修改密码。</p></div></div>`,
      }),
    });
    if (res.ok) return { success: true };
    const err = await res.json();
    throw new Error((err as any).message || '发送失败');
  } catch (error: any) {
    console.error('[EmailService] Failed:', error.message);
    return { success: false, error: error.message };
  }
}

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
