import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { 
  Target, TrendingUp, Users, Calendar, DollarSign, CheckCircle, Clock,
  Plus, Edit, Eye, Send, ThumbsUp, BarChart3, Award, AlertCircle, Check, X, Gift,
  Layers, Zap, FileText, Download, RefreshCw, Filter, Bell, StopCircle, Settings, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useConfig } from '../../contexts/ConfigContext';
import { useNavigate } from 'react-router-dom';

// 简化版的激励政策管理页面
export const IncentivePolicyPage: React.FC = () => {
  const { config } = useConfig();
  const navigate = useNavigate();
  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'templates' | 'applications' | 'analytics'>('plans');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load incentive programs
      const { data: programsData } = await supabase
        .from('incentive_programs')
        .select('*')
        .order('created_at', { ascending: false });
      if (programsData) setPrograms(programsData);

      // Load templates
      const { data: templatesData } = await supabase
        .from('incentive_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });
      if (templatesData) setTemplates(templatesData);

      // Load applications
      const { data: appsData } = await supabase
        .from('incentive_applications')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(20);
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
    if (s === 'Completed') return 'default';
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
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">激励政策管理</h1>
          <p className="text-sm text-neutral-500 mt-1">看、管、算全场景管理</p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />新建计划
        </Button>
      </div>

      {/* Tab切换 */}
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
              <Card key={p.id} hover className="cursor-pointer" onClick={() => navigate(`/detail/incentive-${p.id}`)}>
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
                      <div 
                        className={cn('h-full rounded-full transition-all', pct > 90 ? 'bg-red-500' : 'bg-brand-500')}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
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
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/detail/incentive-${p.id}`); }} className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                    查看详情 <ChevronRight className="w-3 h-3" />
                  </button>
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
            <Card key={t.id} hover className="cursor-pointer" onClick={() => navigate(`/detail/template-${t.id}`)}>
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); }}>
                    <Layers className="w-4 h-4" />使用模板
                  </Button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/detail/template-${t.id}`); }} className="flex-1 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-blue-50 transition-colors border border-neutral-200">
                    查看详情 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
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
                  <span className="text-lg font-semibold">
                    {programs.length > 0 
                      ? Math.round(programs.reduce((sum, p) => sum + (p.participants_count || 0), 0) / programs.length)
                      : 0}%
                  </span>
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
                        <div 
                          className={cn('h-full rounded-full', pct > 90 ? 'bg-red-500' : 'bg-brand-500')}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
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
            <div>
              <label className="text-xs font-semibold text-neutral-500">描述</label>
              <textarea className="w-full px-3 py-2 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm resize-none" rows={3} placeholder="输入计划描述" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500">总预算</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="number" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">触发类型</label>
                <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm">
                  <option>Pipeline Gap</option>
                  <option>New Product</option>
                  <option>Competitive</option>
                  <option>Sales Acceleration</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500">开始日期</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">结束日期</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" />
              </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500">状态</p>
                <Badge variant={statusVariant(selectedPlan.status)}>{statusLabel(selectedPlan.status)}</Badge>
              </div>
              <div>
                <p className="text-xs text-neutral-500">触发类型</p>
                <p className="text-sm font-medium">{selectedPlan.trigger_type}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-500">描述</p>
              <p className="text-sm">{selectedPlan.description}</p>
            </div>
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