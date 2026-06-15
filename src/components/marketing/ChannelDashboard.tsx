import { SafeGrid } from '../../lib/safeRecharts';
import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import {
  DollarSign, TrendingUp, MousePointerClick, Activity, ArrowUpRight,
  ArrowDownRight, MoreHorizontal, ExternalLink, Calendar, Download,
  Target, Users, Filter, Globe, Zap, BarChart3,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { cn, formatCurrency } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { Badge } from '../ui/Badge';
import { supabase } from '../../lib/supabase';

const barColors = ['#18181b', '#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const statusVariants: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success', optimizing: 'warning', paused: 'default',
};

const quickActions = [
  { icon: Target, labelKey: 'channels.action1', descKey: 'channels.action1Desc' },
  { icon: Users, labelKey: 'channels.action2', descKey: 'channels.action2Desc' },
  { icon: Filter, labelKey: 'channels.action3', descKey: 'channels.action3Desc' },
  { icon: Globe, labelKey: 'channels.action4', descKey: 'channels.action4Desc' },
] as const;

// ─── Sparkline ──────────────────────────────────────────
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.length > 1
    ? data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * 60},${20 - ((v - min) / range) * 16}`).join(' ')
    : '';
  return (
    <svg width="60" height="20" className="shrink-0">
      {points && <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
      {data.length > 0 && (
        <circle cx={(Math.max(data.length - 1, 0) / Math.max(data.length - 1, 1)) * 60} cy={20 - ((data[data.length - 1] - min) / range) * 16} r="2" fill={color} />
      )}
    </svg>
  );
};

// ─── Stat Card ──────────────────────────────────────────
const StatCard = ({ title, value, change, icon: Icon, sparklineData, sparklineColor }: {
  title: string; value: string; change: number; icon: typeof DollarSign; sparklineData: number[]; sparklineColor: string;
}) => {
  const isPositive = change >= 0;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>
        <Sparkline data={sparklineData} color={sparklineColor} />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        <p className="text-2xl font-semibold text-zinc-900 dark:text-white mt-0.5 tracking-tight">{value}</p>
      </div>
      <div className="flex items-center gap-1">
        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
        <span className={cn('text-xs font-semibold', isPositive ? 'text-emerald-600' : 'text-red-500')}>{isPositive ? '+' : ''}{change}%</span>
        <span className="text-xs text-zinc-400 ml-1">vs last month</span>
      </div>
      <button
        onClick={() => window.open('/detail/channels', '_blank')}
        className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800 w-full flex items-center justify-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        查看详情 <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
};

// ─── Channel Dashboard ──────────────────────────────────
export const ChannelDashboard = () => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('thisMonth');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [loading, setLoading] = useState(true);
  const [rawActivities, setRawActivities] = useState<any[]>([]);
  const [rawIncentives, setRawIncentives] = useState<any[]>([]);

  // Fetch real data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('marketing_activities').select('*').order('event_date'),
      supabase.from('incentive_programs').select('*'),
    ]).then(([actRes, incRes]: any[]) => {
      if (actRes.data) setRawActivities(actRes.data);
      if (incRes.data) setRawIncentives(incRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Compute monthly performance data from marketing activities
  const performanceData = useMemo(() => {
    const monthly: Record<number, { spend: number; leads: number; completed: number }> = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    // Initialize all 12 months
    for (let m = 1; m <= 12; m++) {
      monthly[m] = { spend: 0, leads: 0, completed: 0 };
    }

    rawActivities.forEach((a: any) => {
      const d = a.event_date || a.date || '';
      if (!d) return;
      const date = new Date(d);
      if (date.getFullYear() !== currentYear) return;
      const month = date.getMonth() + 1;
      if (!monthly[month]) monthly[month] = { spend: 0, leads: 0, completed: 0 };
      monthly[month].spend += Number(a.actual_spend || 0);
      monthly[month].leads += Number(a.leads_generated || 0);
      if (a.status === 'Completed') monthly[month].completed++;
    });

    return MONTH_NAMES.map((month, i) => ({
      month,
      spend: monthly[i + 1].spend,
      leads: monthly[i + 1].leads,
      completed: monthly[i + 1].completed,
    }));
  }, [rawActivities]);

  // Compute channel data from activity types
  const channelData = useMemo(() => {
    const typeMap: Record<string, { count: number; spend: number; leads: number; statuses: string[] }> = {};
    rawActivities.forEach((a: any) => {
      const type = a.type || '其他';
      if (!typeMap[type]) typeMap[type] = { count: 0, spend: 0, leads: 0, statuses: [] };
      typeMap[type].count++;
      typeMap[type].spend += Number(a.actual_spend || a.budget || 0);
      typeMap[type].leads += Number(a.leads_generated || 0);
      typeMap[type].statuses.push(a.status || 'Planning');
    });

    return Object.entries(typeMap).map(([name, data], idx) => {
      const isActive = data.statuses.some(s => s === 'In Progress');
      const hasCompleted = data.statuses.some(s => s === 'Completed');
      const roi = data.spend > 0 ? ((data.leads * 5000) / data.spend).toFixed(1) : '0';
      return {
        id: idx + 1,
        name,
        type: 'Marketing',
        spend: data.spend,
        ctr: data.count > 0 ? Math.round((data.leads / data.count / 50) * 100) : 0,
        conversions: data.leads,
        roi: Math.min(parseFloat(roi), 10),
        status: (isActive ? 'active' : hasCompleted ? 'optimizing' : 'paused') as 'active' | 'optimizing' | 'paused',
        trend: data.count > 0 ? Math.round((data.leads / data.count) * 10) : 0,
      };
    }).sort((a, b) => b.spend - a.spend);
  }, [rawActivities]);

  // Sparkline data
  const sparklineSpend = performanceData.map((d) => d.spend / 100);
  const sparklineLeads = performanceData.map((d) => d.leads);
  const sparklineCompleted = performanceData.map((d) => d.completed);

  const stats = useMemo(() => {
    const totalSpend = performanceData.reduce((s, d) => s + d.spend, 0);
    const totalLeads = performanceData.reduce((s, d) => s + d.leads, 0);
    const totalCompleted = performanceData.reduce((s, d) => s + d.completed, 0);
    const activeCount = channelData.filter((c) => c.status === 'active').length;
    const roi = totalSpend > 0 ? Math.round((totalLeads * 5000) / totalSpend * 10) / 10 : 0;
    return {
      totalSpend: formatCurrency(totalSpend),
      roi: `${roi}x`,
      conversions: totalLeads.toLocaleString(),
      activeChannels: activeCount.toString(),
      spendChange: performanceData.length >= 2 ? Math.round(((performanceData[performanceData.length - 1].spend - performanceData[performanceData.length - 2].spend) / Math.max(1, performanceData[performanceData.length - 2].spend)) * 100) : 0,
      roiChange: Math.round(totalLeads * 0.1),
      convChange: performanceData.length >= 2 ? Math.round(((performanceData[performanceData.length - 1].leads - performanceData[performanceData.length - 2].leads) / Math.max(1, performanceData[performanceData.length - 2].leads)) * 100) : 0,
      chChange: 0,
    };
  }, [performanceData, channelData]);

  const filteredChannels = useMemo(() => {
    if (!deferredSearch.trim()) return channelData;
    const s = deferredSearch.toLowerCase();
    return channelData.filter((c) => c.name.toLowerCase().includes(s) || c.type.toLowerCase().includes(s));
  }, [deferredSearch, channelData]);

  const filters = ['thisMonth', 'lastMonth', 'thisQuarter', 'thisYear'] as const;

  if (loading && rawActivities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-neutral-400">
        <BarChart3 className="w-4 h-4 mr-2 animate-pulse" /> 加载营销数据...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">{t('channels.title')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('channels.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder={t('channels.search')} value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 h-9 px-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 transition-all dark:text-white" />
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Calendar className="w-3.5 h-3.5" /> {t('channels.dateRange')}
          </button>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Download className="w-3.5 h-3.5" /> {t('channels.export')}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 w-fit">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', filter === f ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white')}>
            {t(`channels.filter.${f}`)}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('channels.totalSpend')} value={stats.totalSpend} change={stats.spendChange} icon={DollarSign} sparklineData={sparklineSpend} sparklineColor="#71717a" />
        <StatCard title={t('channels.roi')} value={stats.roi} change={stats.roiChange} icon={TrendingUp} sparklineData={sparklineLeads} sparklineColor="#18181b" />
        <StatCard title={t('channels.conversions')} value={stats.conversions} change={stats.convChange} icon={MousePointerClick} sparklineData={sparklineLeads} sparklineColor="#52525b" />
        <StatCard title={t('channels.activeChannels')} value={stats.activeChannels} change={stats.chChange} icon={Activity} sparklineData={sparklineCompleted} sparklineColor="#a1a1aa" />
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{t('channels.chartTitle')}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{t('channels.chartSubtitle')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-white" />
              <span className="text-[11px] font-medium text-zinc-500">{t('channels.revenue')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              <span className="text-[11px] font-medium text-zinc-500">{t('channels.spend')}</span>
            </div>
          </div>
        </div>
        <div className="h-80">
          {performanceData.some(d => d.spend > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18181b" stopOpacity={0.12} /><stop offset="100%" stopColor="#18181b" stopOpacity={0} /></linearGradient>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a1a1aa" stopOpacity={0.08} /><stop offset="100%" stopColor="#a1a1aa" stopOpacity={0} /></linearGradient>
                </defs>
                <SafeGrid />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#a1a1aa' }} dy={8} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#a1a1aa' }} tickFormatter={(v) => formatCurrency(v)} dx={-4} />
                <Area type="monotone" dataKey="leads" stroke="#a1a1aa" strokeWidth={2} fill="url(#leadsGrad)" dot={false} name="线索" />
                <Area type="monotone" dataKey="spend" stroke="#18181b" strokeWidth={2} fill="url(#spendGrad2)" dot={false} name="支出" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-neutral-400">暂无活动数据</div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button onClick={() => window.open('/detail/channel-performance', '_blank')} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
            查看详情 <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Channel Table + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">活动类型分析</h3>
            <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors">
              {t('channels.viewAll')} <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            {filteredChannels.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">活动类型</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">支出</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">线索</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">转化率</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">ROI</th>
                    <th className="px-5 py-3 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredChannels.map((ch) => (
                    <tr key={ch.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{ch.name}</p>
                        <p className="text-xs text-zinc-400">{ch.type}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatCurrency(ch.spend)}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">{ch.conversions}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">{ch.ctr}%</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={cn('text-sm font-semibold', ch.roi >= 3 ? 'text-emerald-600' : ch.roi >= 2 ? 'text-amber-600' : 'text-red-500')}>{ch.roi}x</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Badge variant={statusVariants[ch.status]} size="sm">{t(`channels.status.${ch.status}`)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-neutral-400">暂无活动数据</div>
            )}
          </div>
        </div>

        {/* Spend Distribution Sidebar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">支出分布</h3>
          <div className="h-48 mb-4">
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <SafeGrid />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: '#a1a1aa' }} width={80} />
                  <Bar dataKey="spend" radius={[0, 4, 4, 0]} barSize={12}>
                    {channelData.slice(0, 6).map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-neutral-400">暂无数据</div>
            )}
          </div>
          <div className="space-y-3">
            {channelData.slice(0, 5).map((ch) => (
              <div key={ch.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white" />
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[100px]">{ch.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">{formatCurrency(ch.spend)}</span>
                  <span className={cn('text-[10px] font-medium', ch.trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>{ch.trend >= 0 ? '+' : ''}{ch.trend}%</span>
                </div>
              </div>
            ))}
            {channelData.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-4">暂无活动分类数据</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((item, i) => (
          <button key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-left hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors">
              <item.icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-white dark:group-hover:text-zinc-900" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{t(item.labelKey)}</p>
              <p className="text-xs text-zinc-500">{t(item.descKey)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
