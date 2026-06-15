import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const RunMigration = () => {
  const [state, setState] = useState('准备执行...');
  const [logs, setLogs] = useState<string[]>([]);

  const add = (m: string) => setLogs(p => [...p, m]);

  useEffect(() => {
    (async () => {
      setState('创建表...');
      add('正在创建 partner_activity_logs 表...');
      const { error: e1 } = await supabase.rpc('exec_sql', {
        query: `CREATE TABLE IF NOT EXISTS partner_activity_logs (id BIGSERIAL PRIMARY KEY, partner_id UUID REFERENCES partners(id) ON DELETE CASCADE, activity_type VARCHAR(50) NOT NULL, weight_score INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());`
      });
      if (e1) add('  ' + e1.message);
      else add('  OK');

      add('正在创建 market_benchmarks 表...');
      const { error: e2 } = await supabase.rpc('exec_sql', {
        query: `CREATE TABLE IF NOT EXISTS market_benchmarks (id SERIAL PRIMARY KEY, region VARCHAR(100) NOT NULL, industry VARCHAR(100), target_revenue BIGINT DEFAULT 0, required_partners INTEGER DEFAULT 0, UNIQUE(region, industry));`
      });
      if (e2) add('  RPC不可用: ' + e2.message.slice(0, 60) + ', 尝试直接INSERT...');
      else add('  OK');

      add('插入基准数据...');
      const { error: e3 } = await supabase.from('market_benchmarks').upsert([
        { region: '华东', industry: '金融', target_revenue: 100000000, required_partners: 10 },
        { region: '华东', industry: '医疗', target_revenue: 70000000, required_partners: 8 },
        { region: '华东', industry: '制造', target_revenue: 50000000, required_partners: 6 },
        { region: '华东', industry: '政务', target_revenue: 40000000, required_partners: 5 },
        { region: '华北', industry: '金融', target_revenue: 80000000, required_partners: 8 },
        { region: '华北', industry: '政务', target_revenue: 60000000, required_partners: 6 },
        { region: '华北', industry: '医疗', target_revenue: 40000000, required_partners: 5 },
        { region: '华南', industry: '金融', target_revenue: 60000000, required_partners: 6 },
        { region: '华南', industry: '政务', target_revenue: 50000000, required_partners: 5 },
        { region: '华南', industry: '医疗', target_revenue: 40000000, required_partners: 5 },
        { region: '西部', industry: '政务', target_revenue: 30000000, required_partners: 4 },
        { region: '西部', industry: '能源', target_revenue: 25000000, required_partners: 3 },
        { region: '华中', industry: '医疗', target_revenue: 20000000, required_partners: 3 },
        { region: '华中', industry: '政务', target_revenue: 15000000, required_partners: 2 },
      ], { onConflict: 'region,industry' });
      if (e3) add('  失败: ' + e3.message);
      else add('  14条数据插入成功');

      add('插入活动日志...');
      const { data: partners } = await supabase.from('partners').select('id, status, tier, win_rate');
      if (partners) {
        let count = 0;
        for (const p of partners) {
          if (p.status === 'Cooperating') {
            const acts = [{ partner_id: p.id, activity_type: 'LOGIN', weight_score: 1 }];
            if (['Platinum', 'Gold', 'Silver'].includes(p.tier)) acts.push({ partner_id: p.id, activity_type: 'LEAD_SUBMIT', weight_score: 10 });
            if ((p.win_rate || 0) > 50) acts.push({ partner_id: p.id, activity_type: 'DEAL_WIN', weight_score: 20 });
            if (['Platinum', 'Diamond', 'Gold'].includes(p.tier)) acts.push({ partner_id: p.id, activity_type: 'MDF_CLAIM', weight_score: 15 });
            acts.push({ partner_id: p.id, activity_type: 'TRAINING', weight_score: 5 });
            const { error } = await supabase.from('partner_activity_logs').insert(acts);
            if (!error) count += acts.length;
          }
        }
        add('  ' + count + '条写入');
      }

      setState('完成');
      add('迁移完成，请刷新页面查看效果');
    })();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">数据库迁移</h1>
      <p className="text-sm mb-4">状态: {state}</p>
      <pre className="bg-neutral-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-96 leading-relaxed">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </pre>
    </div>
  );
};
