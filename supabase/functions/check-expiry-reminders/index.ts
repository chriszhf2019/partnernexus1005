import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Deal {
  id: string;
  title: string;
  created_date: string;
  stage: string;
  status: string;
  expires_in_days: number;
}

Deno.serve(async (_req: Request) => {
  try {
    const now = new Date();

    // 1. 查询即将到期的商机 (有效期剩余 <= 7 天)
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .not('stage', 'in', '("ClosedWon","ClosedLost")')
      .lte('expires_in_days', 7)
      .gt('expires_in_days', -999);

    if (!deals || deals.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expiring deals found', dealsChecked: 0, renewed: 0, remindersCreated: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    let renewed = 0;
    let remindersCreated = 0;

    for (const deal of deals as Deal[]) {
      // 2. 检查最近跟进记录
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const { data: recentActivities } = await supabase
        .from('deal_activities')
        .select('id')
        .eq('deal_id', deal.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(1);

      if (recentActivities && recentActivities.length > 0) {
        // 有近期跟进，自动续期30天
        const newExpiryDays = (deal.expires_in_days || 0) + 30;
        await supabase
          .from('deals')
          .update({ expires_in_days: newExpiryDays })
          .eq('id', deal.id);

        await supabase.from('deal_activities').insert({
          deal_id: deal.id,
          type: 'update',
          content: `系统自动续期：检测到近期跟进记录，有效期延长30天（剩余 ${newExpiryDays} 天）`,
          actor: '系统',
        });

        renewed++;
      } else {
        // 无跟进记录，发送提醒
        await supabase.from('deal_activities').insert({
          deal_id: deal.id,
          type: 'update',
          content: `系统自动提醒：商机有效期剩余 ${deal.expires_in_days || 0} 天，请尽快提交跟进记录或申请延期`,
          actor: '系统',
        });

        remindersCreated++;
      }
    }

    // 3. 同时，检查保护规则中的提前通知配置
    const { data: rules } = await supabase
      .from('protection_rules')
      .select('*')
      .eq('enabled', true)
      .eq('expire_action', 'notify_only');

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        const cutoffDate = new Date(now.getTime() - rule.protection_days * 24 * 60 * 60 * 1000);
        const notifyDate = new Date(cutoffDate.getTime() - rule.notify_before_days * 24 * 60 * 60 * 1000);

        const { data: expiringDeals } = await supabase
          .from('deals')
          .select('*')
          .not('stage', 'in', '("ClosedWon","ClosedLost")')
          .lte('created_date', cutoffDate.toISOString())
          .gte('created_date', notifyDate.toISOString());

        if (expiringDeals) {
          for (const d of expiringDeals) {
            const daysLeft = Math.max(0, Math.ceil(
              (new Date(d.created_date).getTime() + rule.protection_days * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000)
            ));

            await supabase.from('rule_execution_logs').insert({
              rule_id: rule.id,
              deal_id: d.id,
              action: 'warned',
              details: `到期提醒：商机 "${d.title}" 还有 ${daysLeft} 天到期`,
              executed_at: now.toISOString(),
            });

            remindersCreated++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Expiry check completed',
        dealsChecked: deals.length,
        renewed,
        remindersCreated,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
