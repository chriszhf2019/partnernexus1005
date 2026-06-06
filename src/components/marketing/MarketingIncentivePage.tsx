import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useMarketingData } from '../../hooks/useData';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { SearchableSelect } from '../ui/SearchableSelect';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Plus, TrendingUp, Users, Calendar, Target, Activity, DollarSign, BarChart3, PieChart, ExternalLink, X, Filter, ChevronRight, Trophy, Flame, Award, Zap, Building2, Handshake, MapPin, Phone, User, FileText, Gift, MessageCircle, CheckSquare, QrCode, Share2, Copy, Eye, Image, Tag, MessageSquare, CalendarDays, Info, Receipt, Package, UserCheck, Wrench } from 'lucide-react';
import { MDFClaimsPanel } from './MDFClaimsPanel';
import { CampaignROIPanel } from './CampaignROIPanel';
import { MarketingAssetLibrary } from './MarketingAssetLibrary';
import { MarketingCalendarPanel } from './MarketingCalendarPanel';
import { LeadNurturingPanel } from './LeadNurturingPanel';
import { ResourceMarketplace } from './ResourceMarketplace';

export const MarketingIncentivePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { config } = useConfig();
  const { mdfStats, mdfActivities, incentivePrograms, incentiveStats } = useMarketingData();
  const [q2Plans, setQ2Plans] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationType, setInvitationType] = useState<'link' | 'qrcode' | 'mini'>('link');
  const [newActivity, setNewActivity] = useState({
    name: '',
    type: '线下峰会',
    date: '',
    endDate: '',
    startTime: '',
    endTime: '',
    budget: '',
    hostType: 'vendor',
    partnerId: '',
    partnerName: '',
    location: '',
    province: '',
    city: '',
    district: '',
    description: '',
    coverImage: '',
    tags: '',
    contactName: '',
    contactPhone: '',
    maxAttendees: 100,
    enableQuestions: false,
    enableLottery: false,
    enableCheckin: true,
    enableShare: true,
    lotteryReward: '',
    signupPoints: 10,
    checkinPoints: 20,
    sharePoints: 15,
    questionPoints: 5,
    lotteryPoints: 10,
    interactionPoints: 8,
    invitePoints: 25,
    reviewPoints: 12,
    completePoints: 30,
    invitation_code: ''
  });
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [partners, setPartners] = useState<any[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<any>({});

  // New panel states
  const [showMDFClaims, setShowMDFClaims] = useState(false);
  const [showROIPanel, setShowROIPanel] = useState(false);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLeadNurturing, setShowLeadNurturing] = useState(false);
  const [showResourceMarket, setShowResourceMarket] = useState(false);

  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentQuarter, setCurrentQuarter] = useState('Q2');
  
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    setCurrentYear(year);
    setCurrentQuarter(`Q${quarter}`);
  }, []);

  useEffect(() => {
    supabase.from('marketing_budget_config').select('*').eq('id', 'current').single().then(({ data }: any) => { if (data) setBudgetConfig(data); });
    supabase.from('marketing_plan').select('*').eq('year', currentYear).eq('quarter', currentQuarter).in('execution_status', ['approved', 'Approved', 'In Progress', '进行中']).order('category').then(({ data }: any) => { if (data?.length) setQ2Plans(data); });
    supabase.from('partners').select('id, name, tier').order('name').then(({ data }: any) => { if (data) setPartners(data); });
  }, [currentYear, currentQuarter]);

  const qActivities = mdfActivities.filter((a: any) => {
    const d = a.event_date || a.date || '';
    const m = parseInt(d.split('-')[1] || '0');
    const quarterNum = parseInt(currentQuarter.replace('Q', ''));
    const quarterStart = (quarterNum - 1) * 3 + 1;
    return m >= quarterStart && m <= quarterStart + 2;
  });

  const filteredActivities = qActivities.filter((a: any) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const activeCount = qActivities.filter((a: any) => a.status !== 'Completed').length;
  const completedCount = qActivities.filter((a: any) => a.status === 'Completed').length;
  const totalLeads = qActivities.reduce((s: number, a: any) => s + (a.leadsGenerated || 0), 0);
  const totalBudget = q2Plans.reduce((s: number, p: any) => s + Number(p.approved_amount || 0), 0);
  const totalSpend = qActivities.reduce((s: number, a: any) => s + (a.actual_spend || 0), 0);
  const totalParticipants = qActivities.reduce((s: number, a: any) => s + (a.expected_attendees || 0), 0);

  const handleCreateActivity = async () => {
    if (!newActivity.name || !newActivity.budget) return;
    setCreating(true);
    try {
      const activityData: any = {
        name: newActivity.name,
        type: newActivity.type,
        event_date: newActivity.date || new Date().toISOString().split('T')[0],
        end_date: newActivity.endDate,
        start_time: newActivity.startTime,
        end_time: newActivity.endTime,
        status: 'Planning',
        budget: Number(newActivity.budget),
        actual_spend: 0,
        leads_generated: 0,
        progress: 0,
        host_type: newActivity.hostType,
        province: newActivity.province,
        city: newActivity.city,
        district: newActivity.district,
        location: newActivity.location,
        cover_image: newActivity.coverImage,
        tags: newActivity.tags,
        description: newActivity.description,
        contact_name: newActivity.contactName,
        contact_phone: newActivity.contactPhone,
        max_attendees: Number(newActivity.maxAttendees),
        enable_checkin: newActivity.enableCheckin,
        enable_questions: newActivity.enableQuestions,
        enable_lottery: newActivity.enableLottery,
        enable_share: newActivity.enableShare,
        lottery_reward: newActivity.lotteryReward,
        signup_points: Number(newActivity.signupPoints),
        checkin_points: Number(newActivity.checkinPoints),
        share_points: Number(newActivity.sharePoints),
        question_points: Number(newActivity.questionPoints),
        lottery_points: Number(newActivity.lotteryPoints),
        interaction_points: Number(newActivity.interactionPoints),
        invite_points: Number(newActivity.invitePoints),
        review_points: Number(newActivity.reviewPoints),
        complete_points: Number(newActivity.completePoints),
        invitation_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      };

      if (newActivity.hostType === 'partner') {
        activityData.partner_id = newActivity.partnerId;
        activityData.partner_name = newActivity.partnerName;
      }

      const { error, data } = await supabase.from('marketing_activities').insert(activityData).select();
      if (error) { 
        alert('创建失败: ' + error.message); 
        setCreating(false); 
        return; 
      }
      
      if (data?.[0]) {
        setShowCreate(false);
        setShowInvitationModal(true);
      }
      setCreating(false);
    } catch (err) {
      alert('创建活动失败: ' + (err instanceof Error ? err.message : String(err)));
      setCreating(false);
    }
  };

  const [copied, setCopied] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState('');
  const [invitationQrCode, setInvitationQrCode] = useState('');

  useEffect(() => {
    if (showInvitationModal) {
      const url = `${window.location.origin}/invitation/${newActivity.invitation_code || Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setInvitationUrl(url);
      setInvitationQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`);
    }
  }, [showInvitationModal, newActivity.invitation_code]);

  const copyToClipboard = async () => {
    if (invitationUrl) {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const PieSVG = ({ data, size = 50 }: { data: number[]; size?: number }) => {
    const colors = ['#2563eb','#059669','#d97706','#7c3aed','#dc2626','#0891b2'];
    const total = data.reduce((s, v) => s + v, 0) || 1;
    const cx = size / 2, cy = size / 2, r = size / 2 - 2;
    let angle = -Math.PI / 2;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((v, i) => {
          if (v <= 0) return null;
          const a = (v / total) * Math.PI * 2;
          const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
          const x2 = cx + r * Math.cos(angle + a), y2 = cy + r * Math.sin(angle + a);
          const large = a > Math.PI ? 1 : 0;
          angle += a;
          return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={colors[i % colors.length]} />;
        })}
      </svg>
    );
  };

  const activityTypes: Record<string, number> = {};
  mdfActivities.forEach((a: any) => { activityTypes[a.type || '其他'] = (activityTypes[a.type || '其他'] || 0) + 1; });

  const topActivities = [...qActivities].sort((a, b) => (b.leadsGenerated || 0) - (a.leadsGenerated || 0)).slice(0, 3);
  
  // Generate dynamic budget data based on real activities
  const quarterNum = parseInt(currentQuarter.replace('Q', ''));
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const quarterMonthIndices = [
    [0, 1, 2],  // Q1
    [3, 4, 5],  // Q2
    [6, 7, 8],  // Q3
    [9, 10, 11] // Q4
  ];
  const currentMonthIndices = quarterMonthIndices[quarterNum - 1];
  
  const monthlyBudgetData = currentMonthIndices.map((idx, i) => {
    const monthName = monthNames[idx];
    const monthActivities = mdfActivities.filter((a: any) => {
      const d = a.event_date || a.date || '';
      const m = parseInt(d.split('-')[1] || '0');
      return m === idx + 1;
    });
    const monthBudget = monthActivities.reduce((sum: number, a: any) => sum + (a.budget || 0), 0);
    const monthSpend = monthActivities.reduce((sum: number, a: any) => sum + (a.actualSpend || 0), 0);
    return { month: monthName, budget: monthBudget, spend: monthSpend };
  });

  const hostTypeOptions = [
    { id: 'vendor', label: '厂商自办', icon: Building2, color: 'text-blue-600' },
    { id: 'partner', label: '代理商合办', icon: Handshake, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('marketing.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('marketing.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/marketing/plan')}><Target className="w-4 h-4" />年度规划</Button>
          <Button variant="brand" size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />新建活动</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: `${currentQuarter} 批复预算`, value: cur(totalBudget), sub: `${q2Plans.length} 个批复活动`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', onClick: () => navigate('/marketing/plan') },
          { label: `${currentQuarter} 执行情况`, value: `${activeCount} 场进行中`, sub: `${completedCount} 场已完成 · 支出 ${cur(totalSpend)}`, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: '线索转化率', value: `${mdfStats.conversionRate}%`, sub: `获取 ${totalLeads} 条线索`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: '激励计划', value: `${incentiveStats.totalActivePrograms} 个活跃`, sub: `YTD ${cur(incentiveStats.totalPayoutYTD)}`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', onClick: () => navigate('/incentives') },
        ].map((kpi, i) => (
          <Card key={i} className={kpi.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={kpi.onClick}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}><kpi.icon className={kpi.color} /></div>
              <div>
                <p className="text-xs text-neutral-500">{kpi.label}</p>
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">{kpi.value}</p>
                <p className="text-[11px] text-neutral-400">{kpi.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 功能快捷入口 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-neutral-500 mr-2">功能快捷入口:</span>
        <Button variant="secondary" size="sm" onClick={() => setShowMDFClaims(true)}>
          <Receipt className="w-3.5 h-3.5 mr-1" />MDF 核销
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowROIPanel(true)}>
          <Target className="w-3.5 h-3.5 mr-1" />ROI 追踪
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowAssetLibrary(true)}>
          <Package className="w-3.5 h-3.5 mr-1" />资料库
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowCalendar(true)}>
          <Calendar className="w-3.5 h-3.5 mr-1" />年度规划
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowLeadNurturing(true)}>
          <UserCheck className="w-3.5 h-3.5 mr-1" />线索培育
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowResourceMarket(true)}>
          <Wrench className="w-3.5 h-3.5 mr-1" />资源市场
        </Button>
      </div>

      {/* Budget Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">预算使用趋势</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-neutral-500">预算</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-neutral-500">实际支出</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-40 gap-3 px-2">
            {monthlyBudgetData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  <div className="w-8 bg-blue-100 dark:bg-blue-900/30 rounded-t" style={{height: `${Math.max(1, (m.budget / Math.max(250000, monthlyBudgetData.reduce((mx,d)=>Math.max(mx,d.budget),0))) * 120)}px`}}></div>
                  <div className="w-8 bg-emerald-500 rounded-t -mt-0.5" style={{height: `${Math.max(0, (m.spend / Math.max(250000, monthlyBudgetData.reduce((mx,d)=>Math.max(mx,d.budget),0))) * 120)}px`}}></div>
                </div>
                <span className="text-xs text-neutral-500">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <span className="text-neutral-500">总预算: {cur(monthlyBudgetData.reduce((s, m) => s + m.budget, 0))}</span>
            <span className="text-neutral-500">总支出: {cur(monthlyBudgetData.reduce((s, m) => s + m.spend, 0))}</span>
            <span className="text-emerald-600 font-medium">执行率: {Math.round((monthlyBudgetData.reduce((s, m) => s + m.spend, 0) / monthlyBudgetData.reduce((s, m) => s + m.budget, 0)) * 100)}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{currentQuarter} 营销活动</CardTitle>
              <span className="text-xs text-neutral-400">{q2Plans.length + qActivities.length} 个活动 · 批复预算 {cur(totalBudget)} · 实际支出 {cur(totalSpend)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              {['all', 'Planning', 'In Progress', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  {status === 'all' ? '全部' : status === 'Planning' ? '计划中' : status === 'In Progress' ? '进行中' : '已完成'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {q2Plans.length === 0 && qActivities.length === 0 && (
                <p className="text-sm text-neutral-400 py-4 text-center">暂无 Q2 活动，请先在年度规划中批复 Q2 计划</p>
              )}
              {/* Approved Q2 plans */}
              {q2Plans.map((p: any) => {
                // Direct match: plan.expected_output = activity name
                const act = qActivities.find((a: any) => a.name === p.expected_output);
                return (
                  <div key={p.id} className="p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="success" size="sm">{p.activity_type || 'Marketing'}</Badge>
                        <span className="text-sm font-medium">{p.category}{p.partner_name ? ` · ${p.partner_name}` : ''}</span>
                      </div>
                      <span className="text-sm font-semibold">{cur(act?.actualSpend || 0)} / {cur(p.approved_amount || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{p.city || ''} · {p.expected_date || ''} · {p.responsible_person || ''}</span>
                      <span>{p.expected_attendees || 0} 参加 · 目标: {p.expected_output || p.goal || ''}</span>
                    </div>
                  </div>
                );
              })}
              {/* Other Q2 activities */}
              {filteredActivities.filter((a: any) => !q2Plans.some((p: any) => p.category === a.type || p.category === a.name)).map((act: any) => {
                const pct = act.budget > 0 ? Math.round(((act.actualSpend || 0) / act.budget) * 100) : 0;
                return (
                  <div key={act.id} className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/marketing/activity/${act.id}`)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={act.hostType === 'partner' ? 'warning' : 'default'} size="sm">
                          {act.hostType === 'partner' ? '代理商合办' : '厂商自办'}
                        </Badge>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{act.name}</span>
                        <Badge variant={act.status === 'Completed' ? 'success' : act.status === 'In Progress' ? 'info' : 'default'} size="sm">
                          {act.status === 'Completed' ? '已完成' : act.status === 'In Progress' ? '进行中' : '计划中'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{cur(act.actualSpend || 0)} / {cur(act.budget)}</span>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                    <ProgressBar value={pct} size="sm" variant={pct >= 90 ? 'danger' : 'brand'} />
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-neutral-400">
                      <span>{act.date} · {act.type}{act.partnerName ? ` · ${act.partnerName}` : ''}</span>
                      <span>{act.leadsGenerated || 0} 线索 · {Math.round((act.leadsGenerated || 0) * 0.25)} 商机</span>
                    </div>
                    {/* Invitation Code & Actions */}
                    {act.invitationCode && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-neutral-500">邀请码:</span>
                            <span className="text-xs font-mono font-bold text-blue-600">{act.invitationCode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = `${window.location.origin}/invitation/${act.invitationCode}`;
                                navigator.clipboard.writeText(link);
                                alert('邀请函链接已复制到剪贴板');
                              }}
                              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                              title="复制邀请函链接"
                            >
                              <Copy className="w-3.5 h-3.5 text-neutral-500" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`/invitation/${act.invitationCode}`, '_blank');
                              }}
                              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                              title="预览邀请函"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-500" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/invitation/${act.invitationCode}`)}`;
                                window.open(qrUrl, '_blank');
                              }}
                              className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                              title="生成二维码"
                            >
                              <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Activity Type Pie */}
          <Card>
            <CardHeader><CardTitle>活动类型分布</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <PieSVG data={Object.values(activityTypes)} size={70} />
                <div className="space-y-1 flex-1 text-xs">
                  {Object.entries(activityTypes).slice(0, 5).map(([t, c]) => {
                    const pct = Math.round((c / mdfActivities.length) * 100);
                    return <div key={t} className="flex items-center justify-between"><span className="text-neutral-500">{t}</span><span className="font-medium">{c}场 ({pct}%)</span></div>;
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Activities Ranking */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">活动效果排行</CardTitle>
              <Trophy className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topActivities.map((act, i) => (
                  <div key={act.id} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/50">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-neutral-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{act.name}</p>
                      <p className="text-[10px] text-neutral-500">{act.leadsGenerated || 0} 线索 · {Math.round((act.leadsGenerated || 0) * 0.25)} 商机</p>
                    </div>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Incentive Programs Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">激励计划概览</CardTitle>
              <Zap className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incentivePrograms.filter(p => p.status === 'Active').slice(0, 3).map((program) => (
                  <div key={program.id} className="p-2 rounded-lg bg-purple-50/30 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{program.title}</span>
                      <Badge variant="info" size="sm">{program.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-neutral-500">{program.participantsCount} 参与</span>
                      <span className="text-purple-600 font-medium">{cur(program.claimedAmount || 0)} 已发放</span>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/incentives')}>
                  查看全部 <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader><CardTitle className="text-sm">快速入口</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/incentives')}>
                  <Target className="w-4 h-4 mr-2" />激励计划管理
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/marketing/plan')}>
                  <Calendar className="w-4 h-4 mr-2" />年度预算规划
                </Button>
                <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/enablement')}>
                  <Award className="w-4 h-4 mr-2" />赋能培训
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Activity Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-8 w-full max-w-5xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">新建营销活动</h3>
              <button onClick={() => {
                setShowCreate(false);
                setSelectedPlan(null);
                setNewActivity({
                  name: '',
                  type: '线下峰会',
                  date: '',
                  endDate: '',
                  startTime: '',
                  endTime: '',
                  budget: '',
                  hostType: 'vendor',
                  partnerId: '',
                  partnerName: '',
                  location: '',
                  province: '',
                  city: '',
                  district: '',
                  description: '',
                  coverImage: '',
                  tags: '',
                  contactName: '',
                  contactPhone: '',
                  maxAttendees: 100,
                  enableQuestions: false,
                  enableLottery: false,
                  enableCheckin: true,
                  enableShare: true,
                  lotteryReward: '',
                  signupPoints: 10,
                  checkinPoints: 20,
                  sharePoints: 15,
                  questionPoints: 5,
                  lotteryPoints: 10,
                  interactionPoints: 8,
                  invitePoints: 25,
                  reviewPoints: 12,
                  completePoints: 30,
                  invitation_code: ''
                });
              }} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quarter Approved Plans List */}
            {q2Plans.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 block mb-2">从已批复计划选择（可选）</label>
                <div className="border rounded-lg overflow-hidden">
                  {q2Plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlan(plan);
                        setNewActivity({
                          name: plan.category || '',
                          type: plan.category || '线下峰会',
                          date: plan.expected_date || '',
                          endDate: '',
                          startTime: '',
                          endTime: '',
                          budget: String(plan.approved_amount || plan.total_budget || ''),
                          hostType: plan.activity_type === 'PMDF' ? 'partner' : 'vendor',
                          partnerId: plan.partner_id || '',
                          partnerName: plan.partner_name || '',
                          location: plan.city || '',
                          province: '',
                          city: '',
                          district: '',
                          description: plan.goal || '',
                          coverImage: '',
                          tags: '',
                          contactName: plan.responsible_person || '',
                          contactPhone: '',
                          maxAttendees: Number(plan.expected_attendees) || 100,
                          enableQuestions: false,
                          enableLottery: false,
                          enableCheckin: true,
                          enableShare: true,
                          lotteryReward: '',
                          signupPoints: 10,
                          checkinPoints: 20,
                          sharePoints: 15,
                          questionPoints: 5,
                          lotteryPoints: 10,
                          interactionPoints: 8,
                          invitePoints: 25,
                          reviewPoints: 12,
                          completePoints: 30,
                          invitation_code: ''
                        });
                      }}
                      className={`w-full px-4 py-3 flex items-center justify-between transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                        selectedPlan?.id === plan.id
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : ''
                      } ${plan !== q2Plans[q2Plans.length - 1] ? 'border-b border-neutral-200 dark:border-neutral-700' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {plan.quarter}
                        </span>
                        <span className="text-sm font-medium">{plan.category}</span>
                        {plan.activity_type === 'PMDF' && (
                          <Badge variant="secondary" className="text-[10px]">PMDF</Badge>
                        )}
                        <Badge className="text-[10px]" variant={
                          ['executed', 'Completed', '已完成'].includes(plan.execution_status || '') ? 'success' :
                          ['approved', 'Approved', 'In Progress', '进行中'].includes(plan.execution_status || '') ? 'info' : 'default'
                        }>
                          {['executed', 'Completed', '已完成'].includes(plan.execution_status || '') ? '已完成' :
                           ['approved', 'Approved', 'In Progress', '进行中'].includes(plan.execution_status || '') ? '已批复' : '草稿'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-neutral-500">
                          {plan.partner_name || '厂商自办'}
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {cur(Number(plan.approved_amount || plan.total_budget || 0))}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Host Type Selection */}
              <div>
                <label className="text-xs font-semibold text-neutral-500 block mb-2">主办类型 *</label>
                <div className="grid grid-cols-2 gap-3">
                  {hostTypeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setNewActivity({...newActivity, hostType: opt.id, partnerId: '', partnerName: ''})}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                        newActivity.hostType === opt.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 ${opt.color}`} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Partner Selection for 代理商合办 */}
              {newActivity.hostType === 'partner' && (
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">选择代理商 *</label>
                  <SearchableSelect
                    value={newActivity.partnerId}
                    onChange={(id, label) => setNewActivity({...newActivity, partnerId: id, partnerName: label})}
                    options={partners.map((p: any) => ({ id: p.id, label: p.name, sub: p.tier }))}
                    placeholder="搜索代理商..."
                    className="w-full"
                  />
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">活动名称 *</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.name} 
                    onChange={e => setNewActivity({...newActivity, name: e.target.value})} 
                    placeholder="请输入活动名称"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">活动类型</label>
                  <select className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.type} 
                    onChange={e => setNewActivity({...newActivity, type: e.target.value})}
                  >
                    {['线下峰会','线下沙龙','Webinar','联合营销','渠道招募','行业大会'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">开始日期</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="date" 
                    value={newActivity.date} 
                    onChange={e => setNewActivity({...newActivity, date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">结束日期</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="date" 
                    value={newActivity.endDate} 
                    onChange={e => setNewActivity({...newActivity, endDate: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">开始时间</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="time" 
                    value={newActivity.startTime} 
                    onChange={e => setNewActivity({...newActivity, startTime: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">结束时间</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="time" 
                    value={newActivity.endTime} 
                    onChange={e => setNewActivity({...newActivity, endTime: e.target.value})} 
                  />
                </div>
              </div>

              {/* Budget and Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">预算 *</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="number" 
                    value={newActivity.budget} 
                    onChange={e => setNewActivity({...newActivity, budget: e.target.value})} 
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">报名人数限制</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="number" 
                    value={newActivity.maxAttendees} 
                    onChange={e => setNewActivity({...newActivity, maxAttendees: parseInt(e.target.value) || 0})}
                    placeholder="100"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">省份</label>
                  <select className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.province} 
                    onChange={e => setNewActivity({...newActivity, province: e.target.value})}
                  >
                    <option value="">请选择省份</option>
                    {['北京市','上海市','广东省','浙江省','江苏省','山东省','四川省','湖北省'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">城市</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.city} 
                    onChange={e => setNewActivity({...newActivity, city: e.target.value})} 
                    placeholder="城市"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">区域</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.district} 
                    onChange={e => setNewActivity({...newActivity, district: e.target.value})} 
                    placeholder="区/县"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 block mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />详细地址
                </label>
                <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                  value={newActivity.location} 
                  onChange={e => setNewActivity({...newActivity, location: e.target.value})} 
                  placeholder="请输入详细地址"
                />
              </div>

              {/* Cover Image and Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2 flex items-center gap-1">
                    <Image className="w-3 h-3" />封面图片URL
                  </label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.coverImage} 
                    onChange={e => setNewActivity({...newActivity, coverImage: e.target.value})} 
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" />标签
                  </label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.tags} 
                    onChange={e => setNewActivity({...newActivity, tags: e.target.value})} 
                    placeholder="用逗号分隔"
                  />
                </div>
              </div>

              {/* Agenda and Guests */}
              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2 flex items-center gap-1">
                    <User className="w-3 h-3" />联系人
                  </label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.contactName} 
                    onChange={e => setNewActivity({...newActivity, contactName: e.target.value})} 
                    placeholder="请输入联系人姓名"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2 flex items-center gap-1">
                    <Phone className="w-3 h-3" />联系电话
                  </label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.contactPhone} 
                    onChange={e => setNewActivity({...newActivity, contactPhone: e.target.value})} 
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-neutral-500 block mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" />活动描述
                </label>
                <textarea className="w-full h-20 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm resize-none" 
                  value={newActivity.description} 
                  onChange={e => setNewActivity({...newActivity, description: e.target.value})} 
                  placeholder="请输入活动详细描述..."
                />
              </div>

              {/* Features */}
              <div>
                <label className="text-xs font-semibold text-neutral-500 block mb-3">活动功能</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                    <CheckSquare className={`w-5 h-5 ${newActivity.enableCheckin ? 'text-green-600' : 'text-neutral-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">启用签到功能</p>
                      <p className="text-xs text-neutral-400">支持扫码签到</p>
                    </div>
                    <input type="checkbox" checked={newActivity.enableCheckin} onChange={e => setNewActivity({...newActivity, enableCheckin: e.target.checked})} className="hidden" />
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                    <MessageSquare className={`w-5 h-5 ${newActivity.enableQuestions ? 'text-blue-600' : 'text-neutral-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">启用提问功能</p>
                      <p className="text-xs text-neutral-400">允许参会者在线提问</p>
                    </div>
                    <input type="checkbox" checked={newActivity.enableQuestions} onChange={e => setNewActivity({...newActivity, enableQuestions: e.target.checked})} className="hidden" />
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                    <Gift className={`w-5 h-5 ${newActivity.enableLottery ? 'text-amber-600' : 'text-neutral-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">启用抽奖功能</p>
                      <p className="text-xs text-neutral-400">现场抽奖互动</p>
                    </div>
                    <input type="checkbox" checked={newActivity.enableLottery} onChange={e => setNewActivity({...newActivity, enableLottery: e.target.checked})} className="hidden" />
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                    <Share2 className={`w-5 h-5 ${newActivity.enableShare ? 'text-purple-600' : 'text-neutral-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">启用分享功能</p>
                      <p className="text-xs text-neutral-400">支持微信分享</p>
                    </div>
                    <input type="checkbox" checked={newActivity.enableShare} onChange={e => setNewActivity({...newActivity, enableShare: e.target.checked})} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Lottery Reward */}
              {newActivity.enableLottery && (
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">抽奖奖品</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    value={newActivity.lotteryReward} 
                    onChange={e => setNewActivity({...newActivity, lotteryReward: e.target.value})} 
                    placeholder="请输入奖品信息，如：iPhone 15、礼品卡等"
                  />
                </div>
              )}

              {/* Points Settings */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">报名积分</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="number" 
                    value={newActivity.signupPoints} 
                    onChange={e => setNewActivity({...newActivity, signupPoints: parseInt(e.target.value) || 0})} 
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">签到积分</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="number" 
                    value={newActivity.checkinPoints} 
                    onChange={e => setNewActivity({...newActivity, checkinPoints: parseInt(e.target.value) || 0})} 
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">分享积分</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="number" 
                    value={newActivity.sharePoints} 
                    onChange={e => setNewActivity({...newActivity, sharePoints: parseInt(e.target.value) || 0})} 
                    placeholder="15"
                  />
                </div>
                {newActivity.enableQuestions && (
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 block mb-2">提问积分</label>
                    <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                      type="number" 
                      value={newActivity.questionPoints} 
                      onChange={e => setNewActivity({...newActivity, questionPoints: parseInt(e.target.value) || 0})} 
                      placeholder="5"
                    />
                  </div>
                )}
                {newActivity.enableLottery && (
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 block mb-2">抽奖积分</label>
                    <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                      type="number" 
                      value={newActivity.lotteryPoints} 
                      onChange={e => setNewActivity({...newActivity, lotteryPoints: parseInt(e.target.value) || 0})} 
                      placeholder="10"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">互动积分</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="number" 
                    value={newActivity.interactionPoints} 
                    onChange={e => setNewActivity({...newActivity, interactionPoints: parseInt(e.target.value) || 0})} 
                    placeholder="8"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">邀请积分</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="number" 
                    value={newActivity.invitePoints} 
                    onChange={e => setNewActivity({...newActivity, invitePoints: parseInt(e.target.value) || 0})} 
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">评价积分</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="number" 
                    value={newActivity.reviewPoints} 
                    onChange={e => setNewActivity({...newActivity, reviewPoints: parseInt(e.target.value) || 0})} 
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-2">完成积分</label>
                  <input className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" 
                    type="number" 
                    value={newActivity.completePoints} 
                    onChange={e => setNewActivity({...newActivity, completePoints: parseInt(e.target.value) || 0})} 
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    活动创建提示
                  </h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                      从已批复计划选择可以快速填充活动基本信息
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                      邀请函链接在活动创建成功后自动生成
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                      积分设置用于激励参会者参与活动互动
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                      活动功能可根据实际需求灵活启用或关闭
                    </li>
                  </ul>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    活动时间说明
                  </h4>
                  <p className="text-xs text-neutral-500 mb-3">
                    活动日期范围和时间设置用于生成邀请函和提醒通知。
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">开始日期</span>
                      <span className="text-neutral-700 dark:text-neutral-300">{newActivity.date || '未设置'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">结束日期</span>
                      <span className="text-neutral-700 dark:text-neutral-300">{newActivity.endDate || '未设置'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">开始时间</span>
                      <span className="text-neutral-700 dark:text-neutral-300">{newActivity.startTime || '未设置'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">结束时间</span>
                      <span className="text-neutral-700 dark:text-neutral-300">{newActivity.endTime || '未设置'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    快捷操作
                  </h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        const now = new Date();
                        setNewActivity({
                          ...newActivity,
                          date: now.toISOString().split('T')[0],
                          startTime: '09:00',
                          endTime: '17:00'
                        });
                      }}
                      className="w-full p-3 text-left rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
                    >
                      设置为今天
                    </button>
                    <button 
                      onClick={() => {
                        setNewActivity({
                          ...newActivity,
                          signupPoints: 10,
                          checkinPoints: 20,
                          sharePoints: 15,
                          questionPoints: 5,
                          lotteryPoints: 10,
                          interactionPoints: 8,
                          invitePoints: 25,
                          reviewPoints: 12,
                          completePoints: 30
                        });
                      }}
                      className="w-full p-3 text-left rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
                    >
                      重置积分默认值
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
              <Button variant="brand" onClick={handleCreateActivity} disabled={creating || !newActivity.name || !newActivity.budget || (newActivity.hostType === 'partner' && !newActivity.partnerId)}>
                {creating ? '创建中...' : '创建活动'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invitation Modal */}
      {showInvitationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-lg font-semibold">生成邀请函</h3>
              <button onClick={() => { setShowInvitationModal(false); window.location.reload(); }} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-4">
                <label className="text-xs font-semibold text-neutral-500 block mb-2">邀请函链接</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={invitationUrl}
                    readOnly
                    className="flex-1 h-10 px-3 bg-white dark:bg-neutral-700 border rounded-lg text-sm"
                  />
                  <Button size="sm" onClick={copyToClipboard} className="h-10">
                    {copied ? <span className="flex items-center gap-1"><CheckSquare className="w-4 h-4" />已复制</span> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-center mb-4">
                <div className="bg-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg p-4 mb-4">
                  <img src={invitationQrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-neutral-500">扫码报名 / 分享链接</p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">邀请函分发方式</h4>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                  <li>分享链接到微信群或朋友圈</li>
                  <li>打印二维码张贴在活动现场</li>
                  <li>发送给合作伙伴进行转发</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-neutral-200 dark:border-neutral-800">
              <Button variant="secondary" onClick={() => { setShowInvitationModal(false); window.location.reload(); }}>关闭</Button>
              <Button variant="brand" onClick={() => { setShowInvitationModal(false); window.location.reload(); }}>完成</Button>
            </div>
          </div>
        </div>
      )}

      {/* New Panels */}
      <MDFClaimsPanel open={showMDFClaims} onClose={() => setShowMDFClaims(false)} />
      <CampaignROIPanel open={showROIPanel} onClose={() => setShowROIPanel(false)} />
      <MarketingAssetLibrary open={showAssetLibrary} onClose={() => setShowAssetLibrary(false)} />
      <MarketingCalendarPanel open={showCalendar} onClose={() => setShowCalendar(false)} />
      <LeadNurturingPanel open={showLeadNurturing} onClose={() => setShowLeadNurturing(false)} />
      <ResourceMarketplace open={showResourceMarket} onClose={() => setShowResourceMarket(false)} />
    </div>
  );
};