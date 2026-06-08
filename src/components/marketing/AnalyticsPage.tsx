import { SafeGrid } from '../../lib/safeRecharts';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';

const barColors = ['#18181b', '#3f3f46', '#52525b', '#71717a', '#a1a1aa', '#d4d4d8'];

export const AnalyticsPage = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [revenueByRegion, setRevenueByRegion] = useState<{ name: string; value: number }[]>([]);
  const [quarterlyTrend, setQuarterlyTrend] = useState<{ q: string; revenue: number; partners: number; deals: number }[]>([]);
  const [healthScores, setHealthScores] = useState<{ name: string; score: number }[]>([]);
  const [kpis, setKpis] = useState([
    { label: '渠道营收', value: '加载中...', change: '-', up: true },
    { label: '活跃伙伴', value: '加载中...', change: '-', up: true },
    { label: '商机转化率', value: '加载中...', change: '-', up: false },
    { label: '平均客单价', value: '加载中...', change: '-', up: true },
  ]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('deals').select('value, region, status, created_date'),
      supabase.from('partners').select('status, region'),
      supabase.from('marketing_activities').select('leads_generated, actual_spend'),
    ]).then(([dealRes, partnerRes, mktRes]: any[]) => {
      const deals = (dealRes.data || []) as any[];
      const partners = (partnerRes.data || []) as any[];

      // --- Revenue by Region ---
      const regionMap: Record<string, number> = {};
      deals.forEach((d: any) => {
        const region = d.region || '其他';
        regionMap[region] = (regionMap[region] || 0) + Number(d.value || 0);
      });
      const regionData = Object.entries(regionMap)
        .map(([name, value]) => ({ name, value: Math.round(value / 10000) / 100 })) // Convert to 万
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setRevenueByRegion(regionData.length > 0 ? regionData : [{ name: '暂无数据', value: 0 }]);

      // --- Quarterly Trend ---
      const now = new Date();
      const currentYear = now.getFullYear();
      const quarters: { q: string; startMonth: number; endMonth: number }[] = [];
      // Build last 6 quarters
      for (let i = 5; i >= 0; i--) {
        let year = currentYear;
        let qStart = Math.floor(now.getMonth() / 3) * 3 + 1 - i * 3;
        while (qStart < 1) { year--; qStart += 12; }
        const qNum = Math.floor(((qStart - 1) % 12) / 3) + 1;
        const label = `${String(year).slice(2)}Q${qNum}`;
        quarters.push({ q: label, startMonth: qStart, endMonth: qStart + 2 });
      }

      const trendData = quarters.map(({ q, startMonth }) => {
        const qRevenue = deals
          .filter((d: any) => {
            if (!d.created_date) return false;
            const m = new Date(d.created_date).getMonth() + 1;
            const startQ = Math.floor((startMonth - 1) / 12) * 12 + ((startMonth - 1) % 12) + 1;
            return m >= startQ && m <= startQ + 2;
          })
          .reduce((s: number, d: any) => s + Number(d.value || 0), 0);
        return {
          q,
          revenue: Math.round(qRevenue / 10000), // 万
          partners: partners.filter((p: any) => p.status === 'Cooperating').length,
          deals: deals.filter((d: any) => {
            if (!d.created_date) return false;
            const m = new Date(d.created_date).getMonth() + 1;
            const startQ = Math.floor((startMonth - 1) / 12) * 12 + ((startMonth - 1) % 12) + 1;
            return m >= startQ && m <= startQ + 2;
          }).length,
        };
      });
      setQuarterlyTrend(trendData);

      // --- Health Scores ---
      const activePartners = partners.filter((p: any) => p.status === 'Cooperating').length;
      const totalPartners = partners.length;
      const wonDeals = deals.filter((d: any) =>
        d.status === 'Converted' || d.status === 'Closed Won' || d.status === 'Approved'
      ).length;
      const totalDeals = deals.length;

      const scores = [
        { name: '渠道覆盖', score: totalPartners > 0 ? Math.min(100, Math.round((activePartners / totalPartners) * 100)) : 0 },
        { name: '伙伴活跃', score: totalPartners > 0 ? Math.min(100, Math.round((activePartners / totalPartners) * 100)) : 0 },
        { name: '能力建设', score: totalDeals > 0 ? Math.min(100, Math.round((wonDeals / totalDeals) * 100)) : 0 },
        { name: '合作意愿', score: activePartners > 0 ? 75 : 0 },
        { name: '业绩贡献', score: totalDeals > 0 ? Math.min(100, Math.round((wonDeals / totalDeals) * 100)) : 0 },
      ];
      setHealthScores(scores);

      // --- KPIs ---
      const totalRevenue = deals.reduce((s: number, d: any) => s + Number(d.value || 0), 0);
      const avgDealSize = totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0;
      const conversionRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

      setKpis([
        { label: '渠道营收', value: formatCurrency(totalRevenue), change: '', up: true },
        { label: '活跃伙伴', value: String(activePartners), change: `/ ${totalPartners}`, up: true },
        { label: '商机转化率', value: `${conversionRate}%`, change: '', up: conversionRate >= 25 },
        { label: '平均客单价', value: formatCurrency(avgDealSize), change: '', up: true },
      ]);

      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('analytics.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm"><Calendar className="w-4 h-4" /> 本季度</Button>
          <Button variant="secondary" size="sm"><Download className="w-4 h-4" /> 导出报表</Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div>
              <p className="text-xs text-neutral-500">{kpi.label}</p>
              <p className="text-xl font-semibold text-neutral-900 dark:text-white mt-1">{kpi.value}</p>
              {kpi.change && (
                <span className={`text-xs font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {kpi.change}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader><CardTitle>季度业绩趋势</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {quarterlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={quarterlyTrend}>
                    <SafeGrid />
                    <XAxis dataKey="q" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickFormatter={(v) => `${v}万`} />
                    {/* Tooltip removed */}
                    <Line type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={2} dot={{ r: 4, fill: '#18181b' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-neutral-400">暂无数据</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Region Distribution */}
        <Card>
          <CardHeader><CardTitle>区域业绩分布（万元）</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {revenueByRegion.length > 0 && revenueByRegion[0].value > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByRegion} layout="vertical">
                    <SafeGrid />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} width={50} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                      {revenueByRegion.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-neutral-400">暂无数据</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Health */}
      <Card>
        <CardHeader><CardTitle>渠道健康度评分</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {healthScores.map((h) => (
              <div key={h.name} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e4e4e7" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#18181b" strokeWidth="3"
                      strokeDasharray={`${h.score} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{h.score}</span>
                </div>
                <p className="text-xs text-neutral-500">{h.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
