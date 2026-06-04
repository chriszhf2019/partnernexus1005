import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Send, CheckCircle2, XCircle, TrendingUp, RefreshCw, History, DollarSign, PieChart, BarChart3, AlertCircle, CheckCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { SearchableSelect } from '../ui/SearchableSelect';
import { formatCurrency, currencyName } from '../../lib/utils';
import { useConfig } from '../../contexts/ConfigContext';

const QUARTERS = ['Q1','Q2','Q3','Q4'];
const CATEGORIES = ['线下峰会','线下沙龙','Webinar','联合营销','渠道招募','行业大会','培训','其他'];
const EXEC_STATUSES = ['Planning','In Progress','Completed','Cancelled'];
const EXEC_LABELS: Record<string,string> = { Planning: '计划中', 'In Progress': '进行中', Completed: '已完成', Cancelled: '已取消' };
const QCOLORS = ['#2563eb','#059669','#d97706','#7c3aed'];

const normalizeQuarter = (quarter: string): string => {
  const mapping: Record<string, string> = {
    'Q1': 'Q1', 'q1': 'Q1', '第一季度': 'Q1', '1': 'Q1',
    'Q2': 'Q2', 'q2': 'Q2', '第二季度': 'Q2', '2': 'Q2',
    'Q3': 'Q3', 'q3': 'Q3', '第三季度': 'Q3', '3': 'Q3',
    'Q4': 'Q4', 'q4': 'Q4', '第四季度': 'Q4', '4': 'Q4',
  };
  return mapping[quarter] || quarter;
};

const STATUS_LABEL: Record<string, string> = { draft: '草稿', pending: '待批复', approved: '已批复' };
const STATUS_COLOR: Record<string, string> = { draft: 'text-neutral-500', pending: 'text-amber-600', approved: 'text-emerald-600' };
const STATUS_BG: Record<string, string> = { draft: 'bg-neutral-100 dark:bg-neutral-800', pending: 'bg-amber-50 dark:bg-amber-900/20', approved: 'bg-emerald-50 dark:bg-emerald-900/20' };

const PieSVG = ({ data, size = 120, currency = 'CNY' }: { data: number[]; size?: number; currency?: string }) => {
  const total = data.reduce((s, v) => s + v, 0) || 1;
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;
  let angle = -Math.PI / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((v, i) => {
        if (v <= 0) return null;
        const a = (v / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(angle + a), y2 = cy + r * Math.sin(angle + a);
        const large = a > Math.PI ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
        const midAngle = angle + a / 2;
        const lx = cx + r * 0.7 * Math.cos(midAngle), ly = cy + r * 0.7 * Math.sin(midAngle);
        angle += a;
        const pct = Math.round((v / total) * 100);
        return <g key={i}><path d={d} fill={QCOLORS[i]} />{pct >= 10 && <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" className="fill-white text-[9px] font-semibold">{pct}%</text>}</g>;
      })}
      <circle cx={cx} cy={cy} r={r * 0.5} fill="white" className="dark:fill-neutral-900" />
      <text x={cx} y={cy - 4} textAnchor="middle" className="text-[10px] fill-neutral-400">总预算</text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="text-xs font-bold fill-neutral-900 dark:fill-white">{formatCurrency(total, currency as any)}</text>
    </svg>
  );
};

export const MarketingPlanPage = () => {
  const navigate = useNavigate();
  const { config: appConfig } = useConfig();
  const globalCurrency = (appConfig?.currency || 'CNY') as 'CNY' | 'USD';
  const fmtW = (v: number) => formatCurrency(v, globalCurrency);

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [plan, setPlan] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({ annual_budget: 0, q1_budget: 0, q2_budget: 0, q3_budget: 0, q4_budget: 0, status: 'draft', q1_adjust: 0, q2_adjust: 0, q3_adjust: 0, q4_adjust: 0 });
  const [savingConfig, setSavingConfig] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [changeLog, setChangeLog] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [partnerMDF, setPartnerMDF] = useState<Record<string, { allocated: number; used: number; remaining: number }>>({});
  const [showAdjust, setShowAdjust] = useState(false);

  // Available years: from 2024 to current+1
  const availableYears = Array.from({ length: (now.getFullYear() + 1) - 2024 + 1 }, (_, i) => 2024 + i);

  // Load all data for selected year
  const loadData = (year: number) => {
    setDataLoaded(false);
    supabase.from('marketing_budget_config').select('*').eq('id', 'current').single().then(({ data, error }: any) => {
      if (error) console.warn('Failed to load budget config:', error.message);
      if (data) { setConfig(data); setDataLoaded(true); }
    }, () => { setDataLoaded(true); });
    supabase.from('marketing_plan').select('*').eq('year', year).order('quarter').then(({ data }: any) => { if (data?.length) setPlan(data); else setPlan([]); });
    supabase.from('budget_change_log').select('*').eq('config_id', 'current').order('created_at', { ascending: false }).limit(20).then(({ data }: any) => { if (data) setChangeLog(data); });
    supabase.from('marketing_activities').select('*').order('event_date').then(({ data }: any) => { if (data) setActivities(data); });
    supabase.from('partners').select('id, name, tier').order('name').then(({ data }: any) => { if (data) setPartners(data); });
    supabase.from('mdf_allocations').select('*').then(({ data }: any) => {
      if (data) {
        const mdfMap: Record<string, { allocated: number; used: number; remaining: number }> = {};
        data.forEach((a: any) => {
          const pid = a.partner_id;
          if (!pid) return;
          if (!mdfMap[pid]) mdfMap[pid] = { allocated: 0, used: 0, remaining: 0 };
          mdfMap[pid].allocated += Number(a.amount || 0);
          if (a.status === 'used') mdfMap[pid].used += Number(a.amount || 0);
          mdfMap[pid].remaining = mdfMap[pid].allocated - mdfMap[pid].used;
        });
        setPartnerMDF(mdfMap);
      }
    });
  };

  useEffect(() => { loadData(currentYear); }, [currentYear]);

  // Compute actual spend by quarter from activities
  const actualSpendQ = [0, 0, 0, 0];
  activities.forEach((a: any) => {
    const d = a.event_date || a.date || '';
    if (!d) return;
    const m = parseInt(d.split('-')[1] || '0');
    const spend = Number(a.actual_spend || a.actualSpend || 0);
    if (m >= 1 && m <= 3) actualSpendQ[0] += spend;
    else if (m >= 4 && m <= 6) actualSpendQ[1] += spend;
    else if (m >= 7 && m <= 9) actualSpendQ[2] += spend;
    else if (m >= 10 && m <= 12) actualSpendQ[3] += spend;
  });

  const logChange = async (action: string) => {
    await supabase.from('budget_change_log').insert({ config_id: 'current', action, q1_budget: qBudgets[0], q2_budget: qBudgets[1], q3_budget: qBudgets[2], q4_budget: qBudgets[3] });
  };

  const isDraft = config.status === 'draft';
  const isPending = config.status === 'pending';
  const isApproved = config.status === 'approved';
  const isEditable = isDraft;

  const qBudgets: number[] = QUARTERS.map((_, i) => {
    const base = Number(config[`q${i + 1}_budget`] || 0);
    const adj = Number(config[`q${i + 1}_adjust`] || 0);
    return base + adj;
  });
  const annualBudget = qBudgets.reduce((s, v) => s + v, 0);
  const baseAnnual = QUARTERS.reduce((s, _, i) => s + Number(config[`q${i + 1}_budget`] || 0), 0);
  const totalAdjust = QUARTERS.reduce((s, _, i) => s + Number(config[`q${i + 1}_adjust`] || 0), 0);
  const totalActual = actualSpendQ.reduce((s, v) => s + v, 0);

  const saveConfig = async (status?: string) => {
    setSavingConfig(true);
    setErrorMsg('');
    // Safety: refuse to save if budget values haven't loaded from DB
    if (!dataLoaded || annualBudget <= 0) {
      setErrorMsg('数据加载中，请稍后再试');
      setSavingConfig(false);
      return;
    }
    const update: any = {
      annual_budget: baseAnnual,
      q1_budget: qBudgets[0] - Number(config.q1_adjust || 0),
      q2_budget: qBudgets[1] - Number(config.q2_adjust || 0),
      q3_budget: qBudgets[2] - Number(config.q3_adjust || 0),
      q4_budget: qBudgets[3] - Number(config.q4_adjust || 0),
    };
    if (status) update.status = status;
    if (status === 'approved') update.approved_at = new Date().toISOString();
    if (status === 'draft') { update.approved_at = null; update.q1_adjust = 0; update.q2_adjust = 0; update.q3_adjust = 0; update.q4_adjust = 0; }

    const { error } = await supabase.from('marketing_budget_config').upsert({ id: 'current', ...update });
    if (error) {
      setErrorMsg('保存失败: ' + error.message + ' (code: ' + error.code + ')');
      setSavingConfig(false);
      return;
    }
    await logChange(status === 'approved' ? '批复通过' : status === 'pending' ? '提交审批' : status === 'draft' ? '重新批复（恢复编辑）' : '保存');
    setConfig((prev: any) => ({ ...prev, ...update }));
    setSavingConfig(false);
    // Reload change log
    supabase.from('budget_change_log').select('*').eq('config_id', 'current').order('created_at', { ascending: false }).limit(20).then(({ data }: any) => { if (data) setChangeLog(data); });
  };

  const saveAdjustment = async () => {
    setSavingConfig(true);
    setErrorMsg('');
    const newQ1 = Number(config.q1_budget || 0) + Number(config.q1_adjust || 0);
    const newQ2 = Number(config.q2_budget || 0) + Number(config.q2_adjust || 0);
    const newQ3 = Number(config.q3_budget || 0) + Number(config.q3_adjust || 0);
    const newQ4 = Number(config.q4_budget || 0) + Number(config.q4_adjust || 0);
    const { error } = await supabase.from('marketing_budget_config').upsert({
      id: 'current', status: 'approved',
      q1_budget: newQ1, q2_budget: newQ2, q3_budget: newQ3, q4_budget: newQ4,
      q1_adjust: 0, q2_adjust: 0, q3_adjust: 0, q4_adjust: 0,
    });
    if (error) {
      setErrorMsg('调整失败: ' + error.message);
      setSavingConfig(false);
      return;
    }
    setConfig((prev: any) => ({ ...prev, q1_budget: newQ1, q2_budget: newQ2, q3_budget: newQ3, q4_budget: newQ4, q1_adjust: 0, q2_adjust: 0, q3_adjust: 0, q4_adjust: 0 }));
    setShowAdjust(false);
    setSavingConfig(false);
  };

  const totalPlans = plan.length;
  const completedPlans = plan.filter((p: any) => p.execution_status === 'Completed').length;
  const inProgressPlans = plan.filter((p: any) => p.execution_status === 'In Progress').length;
  const totalBudgetRequested = plan.reduce((s: number, p: any) => s + Number(p.total_budget || 0), 0);
  const totalBudgetApproved = plan.reduce((s: number, p: any) => s + Number(p.approved_amount || 0), 0);
  const totalExpectedAttendees = plan.reduce((s: number, p: any) => s + Number(p.expected_attendees || 0), 0);
  const budgetUtilizationRate = annualBudget > 0 ? Math.round((totalActual / annualBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/marketing')} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">年度营销预算规划 · <span className="text-sm font-normal text-neutral-500">{currencyName(globalCurrency)} ({globalCurrency})</span></h1>
              {/* Year selector */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg px-1">
                <button onClick={() => currentYear > 2024 && setCurrentYear(currentYear - 1)} className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <select value={currentYear} onChange={e => setCurrentYear(Number(e.target.value))} className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer px-1">
                  {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <button onClick={() => currentYear < now.getFullYear() + 1 && setCurrentYear(currentYear + 1)} className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-sm text-neutral-500">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BG[config.status] || STATUS_BG['draft']} ${STATUS_COLOR[config.status] || STATUS_COLOR['draft']}`}>{STATUS_LABEL[config.status] || STATUS_LABEL['draft']}</span>
              {isDraft && ' · 可编辑年度和季度预算'}
              {isPending && ' · 等待市场总监批复'}
              {isApproved && ' · 已锁定，可申请调整预算'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!dataLoaded && <span className="text-xs text-neutral-400">加载中...</span>}
          {dataLoaded && isDraft && <><Button variant="secondary" size="sm" onClick={() => saveConfig()} disabled={savingConfig}><Save className="w-4 h-4" />保存</Button><Button variant="brand" size="sm" onClick={() => saveConfig('pending')} disabled={savingConfig}><Send className="w-4 h-4" />提交审批</Button></>}
          {dataLoaded && isPending && <><Button variant="danger" size="sm" onClick={() => saveConfig('draft')}><XCircle className="w-4 h-4" />驳回</Button><Button variant="brand" size="sm" onClick={() => saveConfig('approved')}><CheckCircle2 className="w-4 h-4" />批复通过</Button></>}
          {dataLoaded && isApproved && !showAdjust && <><Button variant="secondary" size="sm" onClick={() => setShowAdjust(true)}><TrendingUp className="w-4 h-4" />调整预算</Button><Button variant="secondary" size="sm" onClick={() => saveConfig('draft')}><RefreshCw className="w-4 h-4" />重新批复</Button></>}
        </div>
      </div>
      {errorMsg && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600">{errorMsg}</div>}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: '年度总预算', value: fmtW(annualBudget), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: '预算执行率', value: budgetUtilizationRate + '%', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: '活动计划', value: totalPlans + ' 项', icon: PieChart, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: '进行中', value: inProgressPlans + ' 项', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: '已完成', value: completedPlans + ' 项', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: '预计参会', value: totalExpectedAttendees + ' 人', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        ].map((kpi, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3 p-4">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}><kpi.icon className={kpi.color} /></div>
              <div><p className="text-xs text-neutral-500">{kpi.label}</p><p className="text-lg font-semibold text-neutral-900 dark:text-white">{kpi.value}</p></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Adjust Modal */}
      {showAdjust && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600" />预算调整申请</CardTitle>
            <span className="text-xs text-amber-600">在原批复预算基础上调整</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {QUARTERS.map((q, i) => (
                <div key={q}>
                  <label className="text-xs text-neutral-500">{q} 原预算 {fmtW(Number(config[`q${i+1}_budget`]||0))}</label>
                  <input type="number" className="w-full h-10 px-3 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20" value={config[`q${i+1}_adjust`] || ''} onChange={e => setConfig((prev: any) => ({ ...prev, [`q${i+1}_adjust`]: Number(e.target.value) }))} placeholder="调整金额" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowAdjust(false)}>取消</Button>
              <Button variant="brand" onClick={saveAdjustment} disabled={savingConfig}>确认调整</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Display + Change Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle><History className="w-4 h-4 inline mr-1" />预算修改记录</CardTitle></CardHeader>
          <CardContent>
            {changeLog.length === 0 ? <p className="text-xs text-neutral-400 py-4 text-center">暂无记录</p> : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {changeLog.map((log: any, i: number) => (
                  <div key={i} className="flex gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.action === '批复通过' ? 'bg-emerald-500' : log.action?.includes('重新批复') ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <p className="text-xs font-medium">{log.action}</p>
                      <p className="text-[10px] text-neutral-400">Q1:{fmtW(Number(log.q1_budget||0))} Q2:{fmtW(Number(log.q2_budget||0))} Q3:{fmtW(Number(log.q3_budget||0))} Q4:{fmtW(Number(log.q4_budget||0))}</p>
                      <p className="text-[10px] text-neutral-400">{new Date(log.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>年度预算 {isApproved ? '（已批复）' : isPending ? '（待批复）' : '（可编辑）'}</CardTitle>
              {totalAdjust > 0 && <span className="text-xs text-amber-600">含调整预算 {fmtW(totalAdjust)}</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-xs text-neutral-500">预算</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-xs text-neutral-500">实际支出</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center"><p className="text-[10px] text-blue-600 uppercase">总预算</p><p className="text-xl font-bold text-blue-700 dark:text-blue-300">{fmtW(annualBudget)}</p></div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center"><p className="text-[10px] text-neutral-400 uppercase">原批复</p><p className="text-xl font-bold">{fmtW(baseAnnual)}</p></div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center"><p className="text-[10px] text-amber-600 uppercase">调整</p><p className="text-xl font-bold text-amber-700 dark:text-amber-400">{fmtW(totalAdjust)}</p></div>
            </div>
            <div className="space-y-4">
              {QUARTERS.map((q, i) => {
                const actual = actualSpendQ[i];
                const pct = qBudgets[i] > 0 ? Math.round((actual / qBudgets[i]) * 100) : 0;
                const diff = qBudgets[i] - actual;
                const curQ = Math.floor(now.getMonth() / 3) + 1;
                return (
                  <div key={q} className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: QCOLORS[i] }} />
                        <span className="text-sm font-semibold">{q}</span>
                        {isEditable ? (
                          <input type="number" className="w-36 h-8 px-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={qBudgets[i] || ''} onChange={e => { const n = Number(e.target.value); setConfig((prev: any) => ({ ...prev, [`q${i+1}_budget`]: n })); }} placeholder="0" />
                        ) : (
                          <span className="text-sm font-bold">{fmtW(qBudgets[i])}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${pct > 100 ? 'text-red-500' : pct > 80 ? 'text-amber-500' : 'text-emerald-600'}`}>实际 {fmtW(actual)}</span>
                        <span className={`text-xs font-medium ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{diff >= 0 ? `剩余 ${fmtW(diff)}` : `超支 ${fmtW(Math.abs(diff))}`}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-neutral-500">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Distribution Chart */}
      <Card>
        <CardHeader><CardTitle>{currentYear}年度预算分配与执行情况</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <PieSVG data={qBudgets} size={140} currency={globalCurrency} />
            <div className="flex-1">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {QUARTERS.map((q, i) => {
                  const remaining = qBudgets[i] - actualSpendQ[i];
                  const pct = qBudgets[i] > 0 ? Math.round((actualSpendQ[i] / qBudgets[i]) * 100) : 0;
                  return (
                    <div key={q} className="p-3 rounded-lg" style={{ backgroundColor: `${QCOLORS[i]}15` }}>
                      <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full" style={{ background: QCOLORS[i] }} /><span className="text-xs font-medium">{q}</span></div>
                      <p className="text-lg font-bold" style={{ color: QCOLORS[i] }}>{fmtW(qBudgets[i])}</p>
                      <p className="text-[10px] text-neutral-500">已支出 {fmtW(actualSpendQ[i])} ({pct}%) · {remaining >= 0 ? <span className="text-emerald-600">剩余 {fmtW(remaining)}</span> : <span className="text-red-500">超支 {fmtW(Math.abs(remaining))}</span>}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between text-xs"><span className="text-neutral-600 dark:text-neutral-400">年度预算总计</span><span className="font-bold text-blue-600">{fmtW(annualBudget)}</span></div>
                <div className="flex items-center justify-between text-xs mt-1"><span className="text-neutral-600 dark:text-neutral-400">年度实际支出</span><span className="font-bold text-emerald-600">{fmtW(totalActual)}</span></div>
                <div className="flex items-center justify-between text-xs mt-1"><span className="text-neutral-600 dark:text-neutral-400">预算申请总额</span><span className="font-bold text-amber-600">{fmtW(totalBudgetRequested)}</span></div>
                <div className="flex items-center justify-between text-xs mt-1"><span className="text-neutral-600 dark:text-neutral-400">预算批复总额</span><span className="font-bold text-purple-600">{fmtW(totalBudgetApproved)}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Activity Plans */}
      {QUARTERS.map(q => {
        const items = plan.filter((p: any) => normalizeQuarter(p.quarter) === q);
        const qBudget = qBudgets[QUARTERS.indexOf(q)];
        const lineTotal = items.reduce((s: number, p: any) => s + Number(p.total_budget||0), 0);
        const approvedTotal = items.reduce((s: number, p: any) => s + Number(p.approved_amount||0), 0);
        const remaining = qBudget - approvedTotal;
        const updateRow = (id: string, f: string, v: any) => setPlan(prev => prev.map(p => p.id === id ? { ...p, [f]: v } : p));
        const addRow = () => setPlan(prev => [...prev, { id: 'new-' + Date.now() + Math.random(), year: currentYear, quarter: q, activity_type: 'Marketing', partner_id: '', partner_name: '', category: '线下峰会', region: '', city: '', expected_date: '', total_budget: 0, approved_amount: 0, expected_attendees: 0, expected_output: '', responsible_person: '', goal: '', execution_status: 'Planning', budget: 0, target_leads: 0, target_opps: 0, _new: true }]);
        const removeRow = (id: string) => setPlan(prev => prev.filter(p => p.id !== id));
        const savePlanRows = async (targetPlanStatus: 'draft' | 'submitted') => {
          for (const p of items) {
            const r: any = { year: currentYear, quarter: q, category: p.category, activity_type: p.activity_type, partner_id: p.partner_id, partner_name: p.partner_name, region: p.region, city: p.city, expected_date: p.expected_date, total_budget: Number(p.total_budget)||0, approved_amount: Number(p.approved_amount)||0, expected_attendees: Number(p.expected_attendees)||0, expected_output: p.expected_output, responsible_person: p.responsible_person, goal: p.goal, execution_status: p.execution_status, plan_status: targetPlanStatus, budget: Number(p.total_budget)||0, target_leads: Number(p.expected_output)||0, target_opps: 0 };
            if ((p as any)._new) await supabase.from('marketing_plan').insert(r);
            else await supabase.from('marketing_plan').update(r).eq('id', p.id);
          }
          loadData(currentYear);
        };
        const approveAll = async () => {
          for (const p of items) { await supabase.from('marketing_plan').update({ plan_status: 'approved' }).eq('id', p.id); }
          loadData(currentYear);
        };

        return (
          <Card key={q}>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 rounded-full" style={{ background: QCOLORS[QUARTERS.indexOf(q)] }} />
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{q} 季度活动计划</CardTitle>
                    {(() => {
                      const pStatus = items.length > 0 ? (items[0].plan_status || 'draft') : 'draft';
                      const colors: Record<string,string> = { draft: 'text-neutral-400 bg-neutral-100', submitted: 'text-amber-600 bg-amber-50', approved: 'text-emerald-600 bg-emerald-50' };
                      const labels: Record<string,string> = { draft: '草稿', submitted: '已提交', approved: '已批复' };
                      return <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[pStatus] || colors.draft}`}>{labels[pStatus] || '草稿'}</span>;
                    })()}
                  </div>
                  <span className="text-xs text-neutral-400">季度预算 {fmtW(qBudget)} · 已批复 {fmtW(approvedTotal)} · {items.length} 项 · {lineTotal > 0 ? <span>申请 {fmtW(lineTotal)} · </span> : ''}{remaining >= 0 ? <span className="text-emerald-600">剩余 {fmtW(remaining)}</span> : <span className="text-red-500">超支 {fmtW(Math.abs(remaining))}</span>}{items.filter((p: any) => p.activity_type === 'PMDF').length > 0 ? <span className="text-purple-500"> · PMDF {items.filter((p: any) => p.activity_type === 'PMDF').length}项</span> : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="secondary" size="sm" onClick={addRow}><Plus className="w-3.5 h-3.5" />添加</Button>
                <Button variant="secondary" size="sm" onClick={() => savePlanRows('draft')}>保存</Button>
                <Button variant="brand" size="sm" onClick={() => savePlanRows('submitted')}>提交</Button>
                {items.length > 0 && items[0].plan_status === 'submitted' && (
                  <Button variant="brand" size="sm" onClick={approveAll}>批复通过</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center">暂无活动计划，点击"添加"创建</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500">
                        <th className="text-left py-2 px-2">类型</th><th className="text-left py-2 px-2">合作伙伴</th><th className="text-left py-2 px-2">类别</th><th className="text-left py-2 px-2">城市</th><th className="text-left py-2 px-2">时间</th><th className="text-right py-2 px-2">总预算</th><th className="text-right py-2 px-2">批复</th><th className="text-right py-2 px-2">参加人数</th><th className="text-left py-2 px-2">产出</th><th className="text-left py-2 px-2">负责人</th><th className="text-center py-2 px-2">状态</th><th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p: any) => {
                        const isPMDF = (p.activity_type || 'Marketing') === 'PMDF';
                        return (
                          <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="py-2 px-2">
                              <select value={p.activity_type || 'Marketing'} onChange={e => updateRow(p.id, 'activity_type', e.target.value)} className="w-16 bg-transparent text-[11px] focus:outline-none">
                                <option value="Marketing">Marketing</option><option value="PMDF">PMDF</option>
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              {isPMDF ? (
                                <div>
                                  <SearchableSelect value={p.partner_id || ''} onChange={(id, label) => { updateRow(p.id, 'partner_id', id); updateRow(p.id, 'partner_name', label); }} options={partners.map((pt: any) => ({ id: pt.id, label: pt.name, sub: pt.tier }))} placeholder="搜索伙伴..." className="w-28" />
                                  {p.partner_id && partnerMDF[p.partner_id] && (
                                    <span className={`text-[9px] block ${partnerMDF[p.partner_id].remaining > 0 ? 'text-emerald-600' : 'text-red-500'}`}>MDF: {fmtW(partnerMDF[p.partner_id].allocated)} / 余{fmtW(partnerMDF[p.partner_id].remaining)}</span>
                                  )}
                                </div>
                              ) : <span className="text-neutral-400 text-[11px]">自办</span>}
                            </td>
                            <td className="py-2 px-2"><select value={p.category || '线下峰会'} onChange={e => updateRow(p.id, 'category', e.target.value)} className="w-16 bg-transparent text-[11px] focus:outline-none">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></td>
                            <td className="py-2 px-2"><input className="w-20 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none" value={p.city || ''} onChange={e => updateRow(p.id, 'city', e.target.value)} placeholder="城市" /></td>
                            <td className="py-2 px-2"><input className="w-28 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none" type="date" value={p.expected_date || ''} onChange={e => updateRow(p.id, 'expected_date', e.target.value)} /></td>
                            <td className="py-2 px-2"><input className="w-20 text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none" type="number" value={p.total_budget || ''} onChange={e => updateRow(p.id, 'total_budget', e.target.value)} /></td>
                            <td className="py-2 px-2"><input className="w-20 text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none" type="number" value={p.approved_amount || ''} onChange={e => updateRow(p.id, 'approved_amount', e.target.value)} /></td>
                            <td className="py-2 px-2"><input className="w-12 text-right bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none" type="number" value={p.expected_attendees || ''} onChange={e => updateRow(p.id, 'expected_attendees', e.target.value)} /></td>
                            <td className="py-2 px-2"><input className="w-16 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none" value={p.expected_output || ''} onChange={e => updateRow(p.id, 'expected_output', e.target.value)} placeholder="线索/商机" /></td>
                            <td className="py-2 px-2"><input className="w-16 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-[11px] focus:outline-none" value={p.responsible_person || ''} onChange={e => updateRow(p.id, 'responsible_person', e.target.value)} placeholder="姓名" /></td>
                            <td className="py-2 px-2">
                              <select value={p.execution_status || 'Planning'} onChange={e => updateRow(p.id, 'execution_status', e.target.value)} className={`w-16 bg-transparent text-[11px] focus:outline-none ${p.execution_status === 'Completed' ? 'text-emerald-600' : p.execution_status === 'In Progress' ? 'text-blue-600' : p.execution_status === 'Cancelled' ? 'text-red-400' : 'text-neutral-500'}`}>
                                {EXEC_STATUSES.map(s => <option key={s} value={s}>{EXEC_LABELS[s]}</option>)}
                              </select>
                            </td>
                            <td className="py-2 px-2"><button onClick={() => removeRow(p.id)} className="p-1 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></td>
                          </tr>
                        );
                      })}
                      {/* Category breakdown */}
                      {(() => {
                        const catMap: Record<string, { count: number; budget: number; approved: number; attendees: number }> = {};
                        items.forEach((p: any) => {
                          const cat = p.category || '其他';
                          if (!catMap[cat]) catMap[cat] = { count: 0, budget: 0, approved: 0, attendees: 0 };
                          catMap[cat].count++; catMap[cat].budget += Number(p.total_budget || 0); catMap[cat].approved += Number(p.approved_amount || 0); catMap[cat].attendees += Number(p.expected_attendees || 0);
                        });
                        return Object.entries(catMap).map(([cat, agg]) => (
                          <tr key={`cat-${cat}`} className="text-[10px] text-neutral-500"><td className="py-1 px-2" colSpan={5}>  └ {cat} ({agg.count}项)</td><td className="py-1 px-2 text-right">{fmtW(agg.budget)}</td><td className="py-1 px-2 text-right">{fmtW(agg.approved)}</td><td className="py-1 px-2 text-right">{agg.attendees}</td><td colSpan={4}></td></tr>
                        ));
                      })()}
                      <tr className="bg-neutral-50 dark:bg-neutral-800/50 font-semibold text-[11px]">
                        <td className="py-2 px-2" colSpan={5}>合计 {items.length} 项</td><td className="py-2 px-2 text-right">{fmtW(lineTotal)}</td><td className="py-2 px-2 text-right">{fmtW(approvedTotal)}</td><td className="py-2 px-2 text-right">{items.reduce((s: number, p: any) => s + Number(p.expected_attendees||0), 0)}</td><td colSpan={4}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end"><Button variant="secondary" onClick={() => navigate('/marketing')}>返回营销首页</Button></div>
    </div>
  );
};
