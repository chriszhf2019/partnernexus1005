import { Resend } from 'npm:resend@4';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') || '');

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, name, role, tempPassword, inviteUrl } = await req.json();

    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Email and name are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const roleLabels: Record<string, string> = {
      admin: '系统管理员', channel_manager: '渠道经理', sales_manager: '销售经理',
      partner_admin: '合作伙伴管理员', partner_sales: '合作伙伴销售', partner_tech: '合作伙伴技术',
    };

    const { data, error } = await resend.emails.send({
      from: 'PartnerNexus <noreply@partner.velolabs.top>',
      to: [email],
      subject: `🎉 欢迎加入 PartnerNexus — ${name} 的账户已创建`,
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px;background:#f8fafc">
          <div style="background:#fff;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <h1 style="color:#00288e;font-size:24px;margin:0 0 8px">🎉 欢迎加入 PartnerNexus</h1>
            <p style="color:#475569;font-size:16px;line-height:1.6">
              您好 <strong>${name}</strong>，<br/>
              您的 PartnerNexus 账户已由管理员创建完成。
            </p>

            <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin:24px 0">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0">
                <span style="color:#64748b">账户</span><strong style="color:#0f172a">${email}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0">
                <span style="color:#64748b">角色</span><strong style="color:#0f172a">${roleLabels[role] || role}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0">
                <span style="color:#64748b">临时密码</span><strong style="color:#0f172a;font-family:monospace">${tempPassword}</strong>
              </div>
            </div>

            <a href="${inviteUrl || 'https://partner.velolabs.top/login'}" style="display:inline-block;background:#00288e;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600;margin:16px 0">
              前往登录 →
            </a>

            <p style="color:#94a3b8;font-size:13px;margin-top:24px">
              首次登录后请立即修改密码。如有疑问，请联系系统管理员。<br/>
              此邮件由系统自动发送，请勿回复。
            </p>
          </div>
        </div>
      `,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: data?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
