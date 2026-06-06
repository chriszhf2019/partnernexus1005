import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useMarketingData } from '../../hooks/useData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Gift, TrendingUp, Users, Target, Plus, Calendar, Settings, BarChart3, FileText, X, RefreshCw, Layers, Eye, Edit, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

// 概览页面组件
const IncentivesOverview: React.FC = () => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const { incentivePrograms, incentiveStats } = useMarketingData();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', trigger_type: 'Pipeline Gap', payout_type: 'Cash', total_budget: '', description: '', start_date: '', end_date: '' });
  const [creating, setCreating] = useState(false);

  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const handleCreate = async () => {
    if (!form.title || !form.total_budget) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('incentive_programs').insert({
        title: form.title, trigger_type: form.trigger_type, payout_type: form.payout_type,
        total_budget: Number(form.total_budget), description: form.description,
        start_date: form.start_date, end_date: form.end_date, status: 'Active',
        claimed_amount: 0, participants_count: 0,
      });
      if (error) throw new Error(error.message);
      setShowCreate(false);
      setForm({ title: '', trigger_type: 'Pipeline Gap', payout_type: 'Cash', total_budget: '', description: '', start_date: '', end_date: '' });
    } catch (err) {
      console.error('Failed to create incentive program:', err);
    } finally {
      setCreating(false);
    }
  };

  const statusVariant = (s: string) => s === 'Active' ? 'success' as const : s === 'Upcoming' ? 'info' as const : 'default' as const;
  const statusLabel = (s: string) => s === 'Active' ? '进行中' : s === 'Upcoming' ? '即将开始' : '已结束';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('incentives.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">管理合作伙伴激励计划，推动业绩增长</p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />新建激励计划
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '活跃计划', value: incentiveStats.totalActivePrograms, icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: '年度支出', value: cur(incentiveStats.totalPayoutYTD), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: '平均参与率', value: `${incentiveStats.avgParticipationRate}%`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: '核心驱动', value: incentiveStats.topTrigger, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.bg)}>
                <s.icon className={cn('w-5 h-5', s.color)} />
              </div>
              <div>
                <p className="text-xs text-neutral-500">{s.label}</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 激励计划列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {incentivePrograms.map((p: any) => {
          const pct = p.totalBudget > 0 ? Math.round((p.claimedAmount / p.totalBudget) * 100) : 0;
          return (
            <Card key={p.id} hover>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{p.title}</h3>
                  <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                </div>
                <p className="text-xs text-neutral-500 line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Calendar className="w-3 h-3" />
                  {p.startDate} ~ {p.endDate}
                </div>
                <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex justify-between text-xs">
                    <span>预算使用</span>
                    <span>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} size="sm" variant={pct > 90 ? 'danger' : 'brand'} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-neutral-400">总预算</p>
                    <p className="text-xs font-semibold">{cur(p.totalBudget)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">已申领</p>
                    <p className="text-xs font-semibold">{cur(p.claimedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">参与伙伴</p>
                    <p className="text-xs font-semibold">{p.participantsCount}</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 创建激励计划模态框 */}
      {showCreate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">新建激励计划</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500">计划名称 *</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500">触发类型</label>
                  <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={form.trigger_type} onChange={e => setForm({...form, trigger_type: e.target.value})}>
                    {['Pipeline Gap','New Product','Competitive','Sales Acceleration'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">发放类型</label>
                  <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={form.payout_type} onChange={e => setForm({...form, payout_type: e.target.value})}>
                    {['Cash','Rebate','Points'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500">总预算 *</label>
                  <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="number" value={form.total_budget} onChange={e => setForm({...form, total_budget: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">开始</label>
                  <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">结束</label>
                  <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">描述</label>
                <textarea className="w-full px-3 py-2 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm resize-none" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
              <Button variant="brand" onClick={handleCreate} disabled={creating}>{creating ? '创建中...' : '创建计划'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 政策管理页面组件
const IncentivePolicyManagement: React.FC = () => {
  const { config } = useConfig();
  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'templates' | 'applications' | 'analytics'>('plans');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: programsData } = await supabase.from('incentive_programs').select('*').order('created_at', { ascending: false });
      if (programsData) setPrograms(programsData);

      const { data: templatesData } = await supabase.from('incentive_templates').select('*').eq('is_active', true).order('usage_count', { ascending: false });
      if (templatesData) setTemplates(templatesData);

      const { data: appsData } = await supabase.from('incentive_applications').select('*').order('submitted_at', { ascending: false }).limit(20);
      if (appsData) setApplications(appsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusVariant = (s: string) => {
    if (s === 'Active') return 'success';
    if (s === 'Upcoming') return 'info';
    return 'default';
  };

  const statusLabel = (s: string) => {
    if (s === 'Active') return '进行中';
    if (s === 'Upcoming') return '即将开始';
    if (s === 'Completed') return '已结束';
    return s;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">政策管理</h2>
          <p className="text-sm text-neutral-500 mt-1">看、管、算全场景管理</p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />新建计划
        </Button>
      </div>

      {/* 子Tab切换 */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {[
          { id: 'plans', label: '激励计划', icon: Gift },
          { id: 'templates', label: '模板库', icon: Layers },
          { id: 'applications', label: '申请审批', icon: FileText },
          { id: 'analytics', label: '效果分析', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2',
              activeTab === tab.id
                ? 'text-brand-600 border-brand-600'
                : 'text-neutral-600 border-transparent hover:text-neutral-900'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => {
            const pct = p.total_budget > 0 ? Math.round((p.claimed_amount / p.total_budget) * 100) : 0;
            return (
              <Card key={p.id} hover onClick={() => { setSelectedPlan(p); setShowDetailModal(true); }}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{p.title}</h3>
                    <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2">{p.description}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Calendar className="w-3 h-3" />
                    {p.start_date} ~ {p.end_date}
                  </div>
                  <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex justify-between text-xs">
                      <span>预算使用</span>
                      <span className={cn(pct > 90 ? 'text-red-600' : 'text-neutral-600')}>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', pct > 90 ? 'bg-red-500' : 'bg-brand-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-neutral-400">总预算</p>
                      <p className="text-xs font-semibold">{cur(p.total_budget)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400">已申领</p>
                      <p className="text-xs font-semibold">{cur(p.claimed_amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-400">参与伙伴</p>
                      <p className="text-xs font-semibold">{p.participants_count || 0}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {programs.length === 0 && (
            <div className="col-span-full text-center py-12 text-neutral-500">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无激励计划</p>
              <Button variant="brand" size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" />创建第一个计划
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} hover>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t.name}</h3>
                  <Badge variant="default">{t.category}</Badge>
                </div>
                <p className="text-xs text-neutral-500 line-clamp-2">{t.description}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <Users className="w-3 h-3" />
                  已使用 {t.usage_count || 0} 次
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Layers className="w-4 h-4" />使用模板
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'applications' && (
        <Card>
          <CardHeader>
            <CardTitle>激励申请审批</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无待审批申请</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{a.partner_name}</p>
                      <p className="text-xs text-neutral-500">{a.metric} - {cur(a.claimed_value)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'info' : 'default'}>
                        {a.status === 'approved' ? '已批准' : a.status === 'pending' ? '待审批' : a.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>投入产出分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">总投入</span>
                  <span className="text-lg font-semibold">{cur(programs.reduce((sum, p) => sum + (p.claimed_amount || 0), 0))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">活跃计划</span>
                  <span className="text-lg font-semibold">{programs.filter(p => p.status === 'Active').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">平均参与率</span>
                  <span className="text-lg font-semibold">{programs.length > 0 ? Math.round(programs.reduce((sum, p) => sum + (p.participants_count || 0), 0) / programs.length) : 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>预算使用情况</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {programs.slice(0, 5).map((p) => {
                  const pct = p.total_budget > 0 ? Math.round((p.claimed_amount / p.total_budget) * 100) : 0;
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{p.title}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', pct > 90 ? 'bg-red-500' : 'bg-brand-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 创建计划模态框 */}
      {showCreateModal && (
        <Modal title="新建激励计划" onClose={() => setShowCreateModal(false)} open={showCreateModal}>
          <div className="space-y-4 p-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500">计划名称</label>
              <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" placeholder="输入计划名称" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
              <Button variant="brand">创建计划</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 详情模态框 */}
      {showDetailModal && selectedPlan && (
        <Modal title={selectedPlan.title} onClose={() => { setShowDetailModal(false); setSelectedPlan(null); }} open={showDetailModal}>
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-500">总预算</p>
                <p className="text-lg font-semibold">{cur(selectedPlan.total_budget)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">已申领</p>
                <p className="text-lg font-semibold">{cur(selectedPlan.claimed_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">参与伙伴</p>
                <p className="text-lg font-semibold">{selectedPlan.participants_count || 0}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline"><Edit className="w-4 h-4" />编辑</Button>
              <Button variant="brand"><Download className="w-4 h-4" />导出报表</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// 整合后的激励管理页面
export const IncentivesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'policy'>('overview');

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3, description: '激励计划统计与快速管理' },
    { id: 'policy', label: '政策管理', icon: Settings, description: '看、管、算全场景管理' },
  ];

  return (
    <div className="space-y-6">
      {/* 主Tab切换 */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-1">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'policy')}
              className={cn(
                'flex-1 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={cn('text-xs', activeTab === tab.id ? 'text-brand-500' : 'text-neutral-400')}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 根据Tab显示不同内容 */}
      {activeTab === 'overview' ? (
        <IncentivesOverview />
      ) : (
        <IncentivePolicyManagement />
      )}
    </div>
  );
};