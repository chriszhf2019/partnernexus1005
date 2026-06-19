import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Calendar, DollarSign, Users, Gift, TrendingUp,
  Download, Edit, AlertCircle, BarChart3, RefreshCw,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useConfig } from '../../contexts/ConfigContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PageLoader } from '../ui/PageLoader';
import { IncentiveMaturityTracker } from '../LifecycleTracker';
import { incentiveMaturityService } from '../../services/lifecycle-service';
import type { IncentiveMaturityHealth, IncentiveMaturityEvent } from '../../types';

const statusVariant = (s: string) => {
  if (s === 'Active') return 'success';
  if (s === 'Upcoming') return 'info';
  if (s === 'Completed') return 'default';
  return 'default';
};

const statusLabel = (s: string) => {
  if (s === 'Active') return '进行中';
  if (s === 'Upcoming') return '即将开始';
  if (s === 'Completed') return '已结束';
  return s;
};

export const IncentivePlanDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { config } = useConfig();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [topPartners, setTopPartners] = useState<any[]>([]);
  const [maturityHealth, setMaturityHealth] = useState<IncentiveMaturityHealth | null>(null);
  const [maturityEvents, setMaturityEvents] = useState<IncentiveMaturityEvent[]>([]);
  const [maturityLoading, setMaturityLoading] = useState(false);

  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  useEffect(() => {
    if (!id) { setLoading(false); setError('未找到计划ID'); return; }
    Promise.all([
      supabase.from('incentive_programs').select('*').eq('id', id).single(),
      supabase.from('incentive_applications').select('*').eq('program_id', id).order('submitted_at', { ascending: false }).limit(10),
    ]).then(([{ data: planData, error: planErr }, { data: appData }]) => {
      if (planData) {
        setPlan(planData);
        if (appData) setApplications(appData);
      } else if (planErr) {
        setError('获取计划信息失败');
      } else {
        setError('未找到该激励计划');
      }
      setLoading(false);
    }).catch(() => { setError('获取计划信息失败'); setLoading(false); });

    // Load top partners for this plan
    supabase.from('incentive_applications').select('partner_name,partner_tier,approved_amount')
      .eq('program_id', id).eq('status', 'approved')
      .then(({ data }: any) => {
        if (data) {
          const map = new Map<string, { name: string; tier: string; total: number; count: number }>();
          data.forEach((a: any) => {
            const key = a.partner_name || '未知';
            if (!map.has(key)) map.set(key, { name: key, tier: a.partner_tier || '-', total: 0, count: 0 });
            const e = map.get(key)!;
            e.total += Number(a.approved_amount || 0);
            e.count += 1;
          });
          setTopPartners(Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5));
        }
      });
  }, [id]);

  // 加载生命周期评估数据
  useEffect(() => {
    if (!plan) return;
    setMaturityLoading(true);

    // 构造统一的 program 对象（字段适配）
    const normalizedPlan = {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      totalBudget: Number(plan.total_budget) || 0,
      claimedAmount: Number(plan.claimed_amount) || 0,
      used: Number(plan.claimed_amount) || 0,
      remaining: (Number(plan.total_budget) || 0) - (Number(plan.claimed_amount) || 0),
      participantsCount: Number(plan.participants_count) || 0,
      roiRate: plan.roi_rate ? Number(plan.roi_rate) : undefined,
      payoutType: plan.payout_type || 'Cash',
      type: plan.trigger_type || plan.category,
      description: plan.description,
      direction: plan.direction,
      startDate: plan.start_date,
      endDate: plan.end_date,
      quarter: plan.quarter,
      year: plan.year,
      trigger: plan.trigger_type,
      conversionRate: typeof plan.conversion_rate === 'number' ? plan.conversion_rate : undefined,
      registeredDeals: typeof plan.registered_deals === 'number' ? plan.registered_deals : undefined,
      targetDeals: typeof plan.target_deals === 'number' ? plan.target_deals : undefined,
      budgetUtilizationRate: Number(plan.total_budget) > 0 ? (Number(plan.claimed_amount) / Number(plan.total_budget)) : undefined,
      healthScore: plan.health_score,
      daysInCurrentStage: (() => {
        const ref = plan.status_updated_at || plan.updated_at || plan.created_at;
        if (!ref) return 0;
        const d = new Date(ref).getTime();
        if (isNaN(d)) return 0;
        return Math.max(0, Math.floor((Date.now() - d) / 86400000));
      })(),
    };

    Promise.all([
      incentiveMaturityService.calculateHealth(id!, normalizedPlan),
      incentiveMaturityService.getEvents(id!),
    ]).then(([health, events]) => {
      setMaturityHealth(health);
      setMaturityEvents(events || []);
      setMaturityLoading(false);
    }).catch((err) => {
      console.error('[IncentivePlanDetail] lifecycle calc error:', err);
      setMaturityLoading(false);
    });
  }, [id, plan]);

  if (loading) return <PageLoader />;

  if (error || !plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="w-12 h-12 text-neutral-300" />
        <p className="text-lg font-semibold text-neutral-400">{error || '未找到计划'}</p>
        <button onClick={() => navigate('/incentives')} className="text-sm text-blue-500 hover:underline">
          返回激励管理
        </button>
      </div>
    );
  }

  const pct = plan.total_budget > 0 ? Math.round((plan.claimed_amount / plan.total_budget) * 100) : 0;
  const isOverBudget = pct >= 90;
  const remaining = Math.max(0, (Number(plan.total_budget) || 0) - (Number(plan.claimed_amount) || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/incentives')}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{plan.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant(plan.status)}>{statusLabel(plan.status)}</Badge>
            <Badge variant="outline">{plan.trigger_type}</Badge>
            <Badge variant="outline">{plan.payout_type}</Badge>
            {isOverBudget && <Badge variant="danger" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />预算超支</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Edit className="w-4 h-4" />编辑</Button>
          <Button variant="brand" size="sm"><Download className="w-4 h-4" />导出报表</Button>
        </div>
      </div>

      {/* Description */}
      {plan.description && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{plan.description}</p>
          </CardContent>
        </Card>
      )}

      {/* 激励政策生命周期与关系深度评估 */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 bg-gradient-to-br from-indigo-50 via-blue-50 to-violet-50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-violet-950/20 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-sm">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">激励政策生命周期 · 关系深度评估</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">基于身份 / 价值 / 管理 / 粘性 四大维度，驱动政策从"单纯发钱"走向"战略杠杆"</p>
                </div>
              </div>
              {maturityLoading && (
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <RefreshCw className="w-3 h-3 animate-spin" /> 正在计算...
                </div>
              )}
            </div>
          </div>
          <IncentiveMaturityTracker
            planTitle={plan.title}
            maturityHealth={maturityHealth}
            events={maturityEvents}
          />
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hover>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-neutral-500">总预算</p>
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{cur(plan.total_budget)}</p>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-neutral-500">已申领</p>
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{cur(plan.claimed_amount)}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">{pct}% 使用率</p>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xs text-neutral-500">剩余预算</p>
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{cur(remaining)}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {isOverBudget ? '预算即将耗尽' : '预算充足'}
            </p>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-neutral-500">参与伙伴</p>
            </div>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{plan.participants_count || 0}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">家合作伙伴</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader><CardTitle>预算使用进度</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-neutral-600">已使用</span>
            <span className={cn(isOverBudget ? 'text-red-600 font-medium' : 'text-neutral-900')}>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', isOverBudget ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-brand-500')}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-400">
            <span>{cur(0)}</span>
            <span>{cur(plan.total_budget)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card>
        <CardHeader><CardTitle>有效期</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-500">开始:</span>
              <span className="font-medium text-neutral-900 dark:text-white">{plan.start_date || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-500">结束:</span>
              <span className="font-medium text-neutral-900 dark:text-white">{plan.end_date || '-'}</span>
            </div>
            {plan.start_date && plan.end_date && (
              <Badge variant={
                new Date(plan.end_date) < new Date() ? 'danger' :
                new Date(plan.end_date) < new Date(Date.now() + 30 * 86400000) ? 'warning' : 'success'
              } size="sm">
                {new Date(plan.end_date) < new Date() ? '已过期' :
                 new Date(plan.end_date) < new Date(Date.now() + 30 * 86400000) ? '即将到期' : '进行中'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Partners */}
      {topPartners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500" />
              头部申领伙伴
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">排名</th>
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">伙伴名称</th>
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">等级</th>
                    <th className="text-right py-2 px-3 text-xs text-neutral-500 font-medium">申领总额</th>
                    <th className="text-right py-2 px-3 text-xs text-neutral-500 font-medium">申领次数</th>
                  </tr>
                </thead>
                <tbody>
                  {topPartners.map((p, i) => (
                    <tr key={p.name} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-2 px-3 font-medium text-neutral-900 dark:text-white">#{i + 1}</td>
                      <td className="py-2 px-3 font-medium text-neutral-900 dark:text-white">{p.name}</td>
                      <td className="py-2 px-3"><Badge variant="outline" size="sm">{p.tier}</Badge></td>
                      <td className="py-2 px-3 text-right font-semibold">{cur(p.total)}</td>
                      <td className="py-2 px-3 text-right text-neutral-500">{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Applications */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              最近申领记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">伙伴</th>
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">金额</th>
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">状态</th>
                    <th className="text-left py-2 px-3 text-xs text-neutral-500 font-medium">日期</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app: any) => (
                    <tr key={app.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-2 px-3 font-medium text-neutral-900 dark:text-white">{app.partner_name || '-'}</td>
                      <td className="py-2 px-3">{cur(app.approved_amount || app.requested_amount || 0)}</td>
                      <td className="py-2 px-3">
                        <Badge variant={
                          app.status === 'approved' ? 'success' :
                          app.status === 'rejected' ? 'danger' :
                          app.status === 'pending' ? 'warning' : 'default'
                        } size="sm">
                          {app.status === 'approved' ? '已批复' :
                           app.status === 'rejected' ? '已拒绝' :
                           app.status === 'pending' ? '待审批' : app.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-neutral-500">{app.submitted_at || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
