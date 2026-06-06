import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProtectionRule {
  id: string;
  name: string;
  protection_days: number;
  require_recent_activity: boolean;
  recent_activity_days: number;
  expire_action: 'notify_only' | 'auto_release';
  notify_before_days: number;
  enabled: boolean;
}

interface Deal {
  id: string;
  title: string;
  created_date: string;
  stage: string;
  status: string;
  is_stagnant: boolean;
  days_in_current_stage: number;
}

Deno.serve(async (_req: Request) => {
  try {
    // 1. 获取所有启用的规则
    const { data: rules } = await supabase
      .from('protection_rules')
      .select('*')
      .eq('enabled', true);

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: 'No enabled rules found', rulesChecked: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let rulesChecked = 0;
    let dealsReleased = 0;
    let notificationsCreated = 0;

    const now = new Date();

    for (const rule of rules as ProtectionRule[]) {
      rulesChecked++;

      // 2. 查找超过保护期或异常停滞的商机
      const cutoffDate = new Date(now.getTime() - rule.protection_days * 24 * 60 * 60 * 1000);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      let query = supabase
        .from('deals')
        .select('*')
        .not('stage', 'in', '("ClosedWon","ClosedLost")')
        .lte('created_date', cutoffDateStr);

      const { data: deals } = await query;

      if (!deals || deals.length === 0) continue;

      for (const deal of deals as Deal[]) {
        // 3. 检查是否需要近期跟进记录
        if (rule.require_recent_activity) {
          const activityCutoff = new Date(now.getTime() - rule.recent_activity_days * 24 * 60 * 60 * 1000);
          const { data: recentActivities } = await supabase
            .from('deal_activities')
            .select('id')
            .eq('deal_id', deal.id)
            .gte('created_at', activityCutoff.toISOString())
            .limit(1);

          if (recentActivities && recentActivities.length > 0) {
            // 有近期跟进记录，跳过
            continue;
          }
        }

        // 4. 提前通知
        const daysUntilExpiry = Math.ceil(
          (new Date(deal.created_date).getTime() + rule.protection_days * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysUntilExpiry <= rule.notify_before_days && daysUntilExpiry > 0) {
          // 发送通知
          await supabase.from('rule_execution_logs').insert({
            rule_id: rule.id,
            deal_id: deal.id,
            action: 'warned',
            details: `商机 "${deal.title}" 保护期剩余 ${daysUntilExpiry} 天`,
            executed_at: now.toISOString(),
          });

          // 在 activities 中添加系统提醒
          await supabase.from('deal_activities').insert({
            deal_id: deal.id,
            type: 'update',
            content: `系统自动提醒：商机保护期剩余 ${daysUntilExpiry} 天，请尽快提交跟进记录或申请延期`,
            actor: '系统',
          });

          notificationsCreated++;
          continue;
        }

        // 5. 到期处理
        if (rule.expire_action === 'auto_release') {
          // 自动释放到公海
          const { error } = await supabase
            .from('deals')
            .update({
              status: '公海',
              stage: 'Registered',
              updated_at: now.toISOString(),
            })
            .eq('id', deal.id);

          if (!error) {
            await supabase.from('rule_execution_logs').insert({
              rule_id: rule.id,
              deal_id: deal.id,
              action: 'released',
              details: `商机 "${deal.title}" 保护期到期，已自动释放到公海`,
              executed_at: now.toISOString(),
            });

            await supabase.from('deal_activities').insert({
              deal_id: deal.id,
              type: 'update',
              content: '系统自动操作：商机保护期已到期，已释放到公海',
              actor: '系统',
            });

            dealsReleased++;
          }
        } else {
          // 仅通知
          await supabase.from('rule_execution_logs').insert({
            rule_id: rule.id,
            deal_id: deal.id,
            action: 'notified',
            details: `商机 "${deal.title}" 保护期已到期，需要处理`,
            executed_at: now.toISOString(),
          });

          notificationsCreated++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Protection rules check completed',
        rulesChecked,
        dealsReleased,
        notificationsCreated,
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
