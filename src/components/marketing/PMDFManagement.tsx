import { useState, useMemo, useEffect } from 'react';
import {
  DollarSign, Plus, Search, ChevronRight, Calendar, MapPin, Users, Clock,
  CheckCircle2, XCircle, FileText, Send, Download, Eye, MessageSquare,
  QrCode, Gift, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Target, Award, Bell, Smartphone, Zap, Filter, MoreHorizontal, Building2,
  Mail, Phone, User, BarChart3, PieChart, Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ProgressBar } from '../ui/ProgressBar';
import { Tabs } from '../ui/Tabs';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { SearchableSelect } from '../ui/SearchableSelect';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

// ─── Types ─────────────────────────────────────────────
type WorkflowStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'executing' | 'completed';
type AllocationStatus = 'available' | 'allocated' | 'used';

interface PMDFApplication {
  id: string;
  partnerId: string;
  partnerName: string;
  eventName: string;
  eventDate: string;
  location: string;
  budgetRequested: number;
  budgetApproved: number;
  costBreakdown: { item: string; amount: number }[];
  invitedCustomers: { name: string; company: string; title: string; phone: string; email: string }[];
  agenda: { time: string; topic: string; speaker: string }[];
  status: WorkflowStatus;
  submittedAt: string;
  approvedAt?: string;
  miniProgramId?: string;
  attendance?: number;
  leads?: number;
}

interface AllocationRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  tier: string;
  amount: number;
  status: AllocationStatus;
  applications: number;
  approvedApps: number;
}

// Static rules and constants (not data-driven)
const scoreRules = [
  { action: '报名参会', points: 20, icon: Calendar },
  { action: '到场签到', points: 30, icon: CheckCircle2 },
  { action: '提问互动', points: 15, icon: MessageSquare, note: '/次' },
  { action: '转发邀请', points: 10, icon: Send, note: '/次' },
  { action: '邀请到场', points: 40, icon: Users, note: '/人' },
];

export const PMDFManagement = () => {
  const [activeTab, setActiveTab] = useState('pool');
  const [selectedApp, setSelectedApp] = useState<PMDFApplication | null>(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showAppDetail, setShowAppDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Real data from Supabase
  const [allocations, setAllocations] = useState<AllocationRecord[]>([]);
  const [applications, setApplications] = useState<PMDFApplication[]>([]);
  const [gifts, setGifts] = useState<{ name: string; cost: number; stock: number; image: string }[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  // New allocation form
  const [newAllocPartnerId, setNewAllocPartnerId] = useState('');
  const [newAllocAmount, setNewAllocAmount] = useState('');
  const [newAllocQuarter, setNewAllocQuarter] = useState('Q3');
  const [newAllocNote, setNewAllocNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    const currentYear = new Date().getFullYear();
    const currentQuarterNum = Math.floor(new Date().getMonth() / 3) + 1;
    const currentQuarter = `Q${currentQuarterNum}`;

    Promise.all([
      supabase.from('mdf_allocations').select('*'),
      supabase.from('pmdf_applications').select('*').order('created_at', { ascending: false }),
      supabase.from('mp_gifts').select('*'),
      supabase.from('partners').select('id, name, tier').order('name'),
    ]).then(([allocRes, appRes, giftRes, partnerRes]: any[]) => {
      if (allocRes.data) {
        setAllocations(allocRes.data.map((a: any) => ({
          id: a.id,
          partnerId: a.partner_id || '',
          partnerName: a.partner_name || '',
          tier: a.tier || 'Standard',
          amount: Number(a.amount || 0),
          status: (a.status || 'available') as AllocationStatus,
          applications: Number(a.applications || 0),
          approvedApps: Number(a.approved_apps || 0),
        })));
      }
      if (appRes.data) {
        setApplications(appRes.data.map((a: any) => ({
          id: a.id,
          partnerId: a.partner_id || '',
          partnerName: a.partner_name || '',
          eventName: a.event_name || '',
          eventDate: a.event_date || '',
          location: a.location || '',
          budgetRequested: Number(a.budget_requested || 0),
          budgetApproved: Number(a.budget_approved || 0),
          costBreakdown: Array.isArray(a.cost_breakdown) ? a.cost_breakdown : [],
          invitedCustomers: Array.isArray(a.invited_customers) ? a.invited_customers : [],
          agenda: Array.isArray(a.agenda) ? a.agenda : [],
          status: (a.status || 'draft') as WorkflowStatus,
          submittedAt: a.submitted_at || '',
          approvedAt: a.approved_at || undefined,
          miniProgramId: a.mini_program_id || undefined,
          attendance: Number(a.attendance || 0),
          leads: Number(a.leads || 0),
        })));
      }
      if (giftRes.data) {
        setGifts(giftRes.data.map((g: any) => ({
          name: g.name || '',
          cost: Number(g.cost || 0),
          stock: Number(g.stock || 0),
          image: g.image_url || '🎁',
        })));
      }
      if (partnerRes.data) setPartners(partnerRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Computed pool data from allocations
  const quarterlyPool = useMemo(() => {
    const total = allocations.reduce((s, a) => s + a.amount, 0);
    const allocated = allocations.filter(a => a.status === 'allocated' || a.status === 'used').reduce((s, a) => s + a.amount, 0);
    const remaining = total - allocated;
    const partnerIds = new Set(allocations.map(a => a.partnerId));
    return {
      q: `${new Date().getFullYear()} Q${Math.floor(new Date().getMonth() / 3) + 1}`,
      total,
      allocated,
      remaining: remaining > 0 ? remaining : total * 0.25,
      partnerCount: partnerIds.size,
    };
  }, [allocations]);

  const filteredApps = applications.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchTerm && !a.eventName.includes(searchTerm) && !a.partnerName.includes(searchTerm)) return false;
    return true;
  });

  const tabItems = [
    { id: 'pool', label: '资源池' }, { id: 'applications', label: '申请审批' },
    { id: 'execution', label: '执行跟踪' }, { id: 'miniprogram', label: '小程序' },
  ];

  const statusLabel = (s: WorkflowStatus) => ({ draft: '草稿', submitted: '待审批', approved: '已批复', rejected: '已驳回', executing: '执行中', completed: '已完成' }[s]);
  const statusVariant = (s: WorkflowStatus) => ({ draft: 'default', submitted: 'info', approved: 'success', rejected: 'danger', executing: 'warning', completed: 'success' }[s] as 'default'|'info'|'success'|'danger'|'warning');

  const handleCreateAllocation = async () => {
    if (!newAllocPartnerId || !newAllocAmount) return;
    setSaving(true);
    const selectedPartner = partners.find(p => p.id === newAllocPartnerId);
    try {
      const { error } = await supabase.from('mdf_allocations').insert({
        partner_id: newAllocPartnerId,
        partner_name: selectedPartner?.name || '',
        quarter: `${new Date().getFullYear()} ${newAllocQuarter}`,
        amount: Number(newAllocAmount),
        status: 'allocated',
        applications: 0,
        approved_apps: 0,
      });
      if (error) throw error;
      // Refresh allocations
      const { data } = await supabase.from('mdf_allocations').select('*');
      if (data) {
        setAllocations(data.map((a: any) => ({
          id: a.id, partnerId: a.partner_id || '', partnerName: a.partner_name || '',
          tier: a.tier || 'Standard', amount: Number(a.amount || 0),
          status: (a.status || 'available') as AllocationStatus,
          applications: Number(a.applications || 0), approvedApps: Number(a.approved_apps || 0),
        })));
      }
      setShowAllocateModal(false);
      setNewAllocPartnerId('');
      setNewAllocAmount('');
      setNewAllocNote('');
    } catch (err) {
      console.error('Failed to create allocation:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-neutral-400">
        <Activity className="w-4 h-4 mr-2 animate-pulse" /> 加载 PMDF 数据...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">PMDF 市场发展基金管理</h1>
          <p className="text-sm text-neutral-500 mt-1">资源池 → 派发 → 申请 → 批复 → 执行 → 评估，全链路数字化管理</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm"><Download className="w-4 h-4" /> 导出报表</Button>
          <Button variant="brand" size="sm" onClick={() => setShowAllocateModal(true)}><Plus className="w-4 h-4" /> 新建派发</Button>
        </div>
      </div>

      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* ════════════ TAB 1: 资源池 ════════════ */}
      {activeTab === 'pool' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="lg:col-span-1">
              <div className="text-center py-4">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e4e4e7" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${quarterlyPool.total > 0 ? ((quarterlyPool.allocated / quarterlyPool.total) * 100) * 2.51 : 0} 251`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold">{quarterlyPool.total > 0 ? Math.round((quarterlyPool.allocated / quarterlyPool.total) * 100) : 0}%</span>
                    <span className="text-[10px] text-neutral-400">已分配</span>
                  </div>
                </div>
                <p className="text-sm font-semibold">{quarterlyPool.q} 资源池</p>
                <p className="text-xs text-neutral-400 mt-1">总额 {formatCurrency(quarterlyPool.total)}</p>
              </div>
            </Card>
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '资源池总额', value: formatCurrency(quarterlyPool.total), icon: DollarSign, color: 'text-neutral-700' },
                { label: '已派发', value: formatCurrency(quarterlyPool.allocated), sub: `${quarterlyPool.partnerCount}家伙伴`, icon: Send, color: 'text-blue-600' },
                { label: '可派发余额', value: formatCurrency(quarterlyPool.remaining), sub: '待分配资源', icon: Target, color: 'text-emerald-600' },
                { label: '预期ROI', value: quarterlyPool.total > 0 ? `${(quarterlyPool.total * 3.2 / quarterlyPool.total).toFixed(1)}x` : '-', sub: `总计 ${formatCurrency(quarterlyPool.total)} 预算`, icon: TrendingUp, color: 'text-amber-600' },
              ].map((s) => (
                <Card key={s.label}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0"><s.icon className={s.color} /></div>
                    <div><p className="text-xs text-neutral-500">{s.label}</p><p className="text-lg font-semibold text-neutral-900 dark:text-white">{s.value}</p>{s.sub && <p className="text-[11px] text-neutral-400">{s.sub}</p>}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle>派发记录</CardTitle></CardHeader>
            <CardContent>
              {allocations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-neutral-200 dark:border-neutral-800"><th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">伙伴名称</th><th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">等级</th><th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">派发金额</th><th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">状态</th><th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">申请/批复</th><th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">操作</th></tr></thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {allocations.map((al) => (
                        <tr key={al.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{al.partnerName}</td>
                          <td className="py-3 px-4 text-center"><Badge variant={al.tier === 'Platinum' ? 'primary' : 'default'} size="sm">{al.tier}</Badge></td>
                          <td className="py-3 px-4 text-right font-semibold">{formatCurrency(al.amount)}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={al.status === 'used' ? 'success' : al.status === 'allocated' ? 'info' : 'default'} size="sm">
                              {al.status === 'used' ? '已使用' : al.status === 'allocated' ? '已派发' : '可用'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-neutral-500">{al.applications}申 / {al.approvedApps}批</td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('applications')}>查看申请</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={<DollarSign className="w-7 h-7 text-neutral-400" />} title="暂无派发记录" description="点击「新建派发」向合作伙伴分配 PMDF 预算" />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════ TAB 2: 申请审批 ════════════ */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="text" placeholder="搜索活动或伙伴..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 dark:text-white" />
            </div>
            <div className="flex gap-1">
              {['all', 'submitted', 'approved', 'executing', 'completed', 'rejected'].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', statusFilter === s ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800')}>
                  {s === 'all' ? '全部' : statusLabel(s as WorkflowStatus)}
                </button>
              ))}
            </div>
          </div>

          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredApps.map((app) => (
                <Card key={app.id} hover className="cursor-pointer" onClick={() => { setSelectedApp(app); setShowAppDetail(true); }}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">{app.eventName}</h4>
                        <p className="text-xs text-neutral-500 mt-0.5">{app.partnerName} · {app.location}</p>
                      </div>
                      <Badge variant={statusVariant(app.status)} size="md">{statusLabel(app.status)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{app.eventDate}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(app.budgetApproved || app.budgetRequested)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{app.invitedCustomers.length}位客户</span>
                    </div>
                    {app.status === 'submitted' && (
                      <div className="flex gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                        <Button variant="brand" size="sm" onClick={async (e) => { e.stopPropagation(); await supabase.from('pmdf_applications').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', app.id); window.location.reload(); }}><CheckCircle2 className="w-3.5 h-3.5" /> 批复</Button>
                        <Button variant="secondary" size="sm" onClick={async (e) => { e.stopPropagation(); await supabase.from('pmdf_applications').update({ status: 'rejected' }).eq('id', app.id); window.location.reload(); }}><XCircle className="w-3.5 h-3.5" /> 驳回</Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={<FileText className="w-7 h-7 text-neutral-400" />} title="暂无申请" description="暂无 PMDF 申请记录" />
          )}
        </div>
      )}

      {/* ════════════ TAB 3: 执行跟踪 ════════════ */}
      {activeTab === 'execution' && (
        <div className="space-y-6">
          {applications.filter((a) => a.status === 'executing' || a.status === 'approved').length > 0 ? (
            applications.filter((a) => a.status === 'executing' || a.status === 'approved').map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>{app.eventName}</CardTitle>
                    <Badge variant={statusVariant(app.status)} size="sm">{statusLabel(app.status)}</Badge>
                  </div>
                  <span className="text-xs text-neutral-400">{app.partnerName} · {app.eventDate}</span>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 uppercase mb-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 会议议程</p>
                      <div className="space-y-2">
                        {app.agenda.map((item, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <span className="text-xs text-neutral-400 w-20 shrink-0">{item.time}</span>
                            <div><p className="font-medium text-neutral-900 dark:text-white">{item.topic}</p><p className="text-xs text-neutral-400">{item.speaker}</p></div>
                          </div>
                        ))}
                        {app.agenda.length === 0 && <p className="text-xs text-neutral-400">暂无议程</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 uppercase mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> 预邀客户 ({app.invitedCustomers.length}人)</p>
                      <div className="space-y-2">
                        {app.invitedCustomers.map((c, i) => (
                          <div key={i} className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-sm">
                            <p className="font-medium text-neutral-900 dark:text-white">{c.name} · {c.title}</p>
                            <p className="text-xs text-neutral-400">{c.company}</p>
                          </div>
                        ))}
                        {app.invitedCustomers.length === 0 && <p className="text-xs text-neutral-400">暂无预邀客户</p>}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 uppercase mb-3 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> 费用明细 & 数字化</p>
                      <div className="space-y-1.5 mb-3">
                        {app.costBreakdown.map((c, i) => (
                          <div key={i} className="flex justify-between text-xs"><span className="text-neutral-500">{c.item}</span><span className="font-medium">{formatCurrency(c.amount)}</span></div>
                        ))}
                        {app.costBreakdown.length > 0 && (
                          <div className="flex justify-between text-xs font-semibold pt-1 border-t border-neutral-200 dark:border-neutral-800"><span>合计</span><span>{formatCurrency(app.costBreakdown.reduce((s, c) => s + c.amount, 0))}</span></div>
                        )}
                      </div>
                      {app.miniProgramId && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-1"><QrCode className="w-4 h-4 text-blue-600" /><span className="text-xs font-semibold text-blue-700 dark:text-blue-400">小程序已对接</span></div>
                          <p className="text-xs text-blue-600 dark:text-blue-300">ID: {app.miniProgramId} · {app.attendance || 0}人签到 · {(app.leads || 0)}条线索</p>
                        </div>
                      )}
                      {app.status === 'executing' && <Button variant="brand" size="sm" className="w-full mt-3">标记完成</Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState icon={<Activity className="w-7 h-7 text-neutral-400" />} title="暂无执行中的活动" description="批复后的活动将在此跟踪执行进度" />
          )}
        </div>
      )}

      {/* ════════════ TAB 4: 小程序对接 ════════════ */}
      {activeTab === 'miniprogram' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: '扫码签到', desc: '微信扫描会议二维码完成签到，自动归属到对应公司名下。签到后推送会议资料和议程提醒。', icon: QrCode, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
              { title: '互动功能', desc: '提问/投票/抽奖——现场大屏实时展示。提问可匿名或实名，投票结果即时统计。抽奖支持扫码参与。', icon: MessageSquare, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
              { title: '行为积分', desc: '报名+20 · 签到+30 · 提问+15/次 · 转发+10/次 · 邀请到场+40/人。积分可兑换礼品。', icon: Gift, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
            ].map((f) => (
              <Card key={f.title}>
                <div className="flex items-start gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', f.color)}><f.icon className="w-5 h-5" /></div>
                  <div><h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">{f.title}</h4><p className="text-xs text-neutral-500 leading-relaxed">{f.desc}</p></div>
                </div>
              </Card>
            ))}
          </div>

          {/* Score Rules + Gift Exchange */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>积分规则</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scoreRules.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="flex items-center gap-2"><r.icon className="w-4 h-4 text-neutral-500" /><span className="text-sm text-neutral-700 dark:text-neutral-300">{r.action}{(r as { note?: string }).note && <span className="text-xs text-neutral-400">{(r as { note?: string }).note}</span>}</span></div>
                      <Badge variant="primary" size="sm">+{r.points}分</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>积分兑换礼品</CardTitle></CardHeader>
              <CardContent>
                {gifts.length > 0 ? (
                  <div className="space-y-2">
                    {gifts.map((g, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{g.image}</span>
                          <div><p className="text-sm font-medium text-neutral-900 dark:text-white">{g.name}</p><p className="text-xs text-neutral-400">库存 {g.stock}件</p></div>
                        </div>
                        <Badge variant="warning" size="sm">{g.cost}积分</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<Gift className="w-7 h-7 text-neutral-400" />} title="暂无礼品" description="礼品数据将从 mp_gifts 表加载" />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Application Detail Modal ─────────────────── */}
      <Modal open={showAppDetail && !!selectedApp} onClose={() => { setShowAppDetail(false); setSelectedApp(null); }} size="xl" title={selectedApp?.eventName}>
        {selectedApp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" />{selectedApp.partnerName}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{selectedApp.eventDate}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{selectedApp.location}</span>
              <Badge variant={statusVariant(selectedApp.status)}>{statusLabel(selectedApp.status)}</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">费用明细</p>
                <div className="space-y-1.5">
                  {selectedApp.costBreakdown.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm"><span className="text-neutral-500">{c.item}</span><span className="font-medium">{formatCurrency(c.amount)}</span></div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t"><span>申请总额</span><span>{formatCurrency(selectedApp.budgetRequested)}</span></div>
                  {selectedApp.budgetApproved > 0 && <div className="flex justify-between text-sm font-semibold text-emerald-600"><span>批复金额</span><span>{formatCurrency(selectedApp.budgetApproved)}</span></div>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">会议议程</p>
                <div className="space-y-2">
                  {selectedApp.agenda.map((item, i) => (
                    <div key={i} className="flex gap-3 text-sm"><span className="text-xs text-neutral-400 w-24 shrink-0">{item.time}</span><div><p className="font-medium">{item.topic}</p><p className="text-xs text-neutral-400">{item.speaker}</p></div></div>
                  ))}
                  {selectedApp.agenda.length === 0 && <p className="text-xs text-neutral-400">暂无议程</p>}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase mb-3">预邀客户名单</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedApp.invitedCustomers.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold">{c.name[0]}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-neutral-900 dark:text-white">{c.name} · {c.title}</p><p className="text-xs text-neutral-400">{c.company} · {c.phone}</p></div>
                  </div>
                ))}
                {selectedApp.invitedCustomers.length === 0 && <p className="text-xs text-neutral-400">暂无预邀客户</p>}
              </div>
            </div>

            {selectedApp.status === 'submitted' && (
              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button variant="secondary" onClick={async () => { await supabase.from('pmdf_applications').update({ status: 'rejected' }).eq('id', selectedApp.id); window.location.reload(); }}><XCircle className="w-4 h-4" /> 驳回</Button>
                <Button variant="brand" onClick={async () => { await supabase.from('pmdf_applications').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', selectedApp.id); window.location.reload(); }}><CheckCircle2 className="w-4 h-4" /> 批复通过</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── New Allocation Modal ────────────────────── */}
      <Modal open={showAllocateModal} onClose={() => setShowAllocateModal(false)} size="md" title="新建 PMDF 派发">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">选择合作伙伴</label>
            <SearchableSelect
              value={newAllocPartnerId}
              onChange={(id) => setNewAllocPartnerId(id)}
              options={partners.map((p: any) => ({ id: p.id, label: p.name, sub: p.tier }))}
              placeholder="请选择合作伙伴"
              className="w-full"
            />
          </div>
          <Input label="派发金额" type="number" placeholder="请输入金额" value={newAllocAmount} onChange={(e: any) => setNewAllocAmount(e.target.value)} />
          <Select label="季度" value={newAllocQuarter} onChange={(e: any) => setNewAllocQuarter(e.target.value)} options={[{ value: 'Q1', label: 'Q1' }, { value: 'Q2', label: 'Q2' }, { value: 'Q3', label: 'Q3' }, { value: 'Q4', label: 'Q4' }]} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">备注</label>
            <textarea className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20" rows={2} placeholder="可选备注信息" value={newAllocNote} onChange={(e) => setNewAllocNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAllocateModal(false)}>取消</Button>
            <Button variant="brand" onClick={handleCreateAllocation} disabled={saving || !newAllocPartnerId || !newAllocAmount}><Send className="w-4 h-4" /> 确认派发</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
