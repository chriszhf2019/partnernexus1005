import { useState, useReducer, useCallback, useMemo, useEffect } from 'react';
import {
  User, MapPin, Phone, History, ChevronRight, Building2, TrendingUp, TrendingDown,
  Target, Award, DollarSign, Clock, CheckCircle2, AlertTriangle, ExternalLink,
  ArrowUpRight, ArrowDownRight, Download, Plus, Save, FileText, Users, Zap,
  Layers, Briefcase, GitBranch, Network, Calendar, Package, ShoppingCart, Star,
  Lightbulb, Info, Link2, Activity, Shield, Search, BarChart3, PieChart, Eye,
  MessageSquare, ThumbsUp, ThumbsDown, RefreshCw, Rocket, Crosshair, Compass,
  Radar, Flame, Bell, Mail, Gift, X, Check, Tag, ListTodo, Trash2, Pencil,
} from 'lucide-react';
import { PartnerDetails, Activity as ActivityType, JBPFormData, PartnerContact, PartnerTimelineEvent } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { TIER_OPTIONS, TYPE_OPTIONS, STATUS_OPTIONS, INDUSTRY_OPTIONS, recordTypeLabel, TIER_LABELS } from '../../lib/partner-labels';
import { AnimatePresence, motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { debug } from '../../lib/debug';
import { partnerService } from '../../services/partner-service';
import { supabase } from '../../lib/supabase';
import { StaffManagementTab } from './StaffManagementTab';
import { JBPMeetingForm } from './JBPMeetingForm';
import { PartnerTimeline } from './PartnerTimeline';
import { AIPanel } from '../ui/AIPanel';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ProgressBar } from '../ui/ProgressBar';
import { RegionCascader } from '../ui/RegionCascader';
import { EmptyState } from '../ui/EmptyState';
import { Tabs } from '../ui/Tabs';

type FormState = ReturnType<typeof createInitialFormState>;
type FormAction = { type: 'SET'; field: keyof FormState; value: string | boolean };
const formReducer = (s: FormState, a: FormAction): FormState => a.type === 'SET' ? { ...s, [a.field]: a.value } : s;
function createInitialFormState(p: PartnerDetails) { return { name: p.name, englishName: p.englishName || '', website: p.website || '', unifiedSocialCreditCode: p.unifiedSocialCreditCode || '', type: p.type, tier: p.tier, status: p.status, startDate: p.startDate, industry: p.industry || '', province: p.province || (p.city && !p.province ? p.city : '') || '', city: p.city || '', district: p.district || '', registeredAddress: p.registeredAddress || p.location || '', location: p.location || '', cooperationScope: p.cooperationScope || '', isCorePartner: p.isCorePartner || false }; }
const DEFAULT_CONTACT: PartnerContact = { salutation: '', firstName: '', lastName: '', title: '', department: '', phone: '', mobile: '', email: '', isPrimary: false };

// ─── Score Gauge ──────────────────────────────────────
const Gauge = ({ score, label, max = 100 }: { score: number; label: string; max?: number }) => {
  const pct = Math.min(100, (score / max) * 100);
  const color = pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626';
  const s = 52, stroke = 5, r = (s - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={s} height={s} className="-rotate-90">
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="#e4e4e7" strokeWidth={stroke} />
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" />
        <text x={s/2} y={s/2+1} textAnchor="middle" dy="0.35em" fontSize={13} fontWeight={700} fill="currentColor" className="dark:fill-white" transform={`rotate(90 ${s/2} ${s/2})`}>{score}</text>
      </svg>
      <span className="text-[10px] text-neutral-500 font-medium">{label}</span>
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, trend, color }: { icon: typeof Users; label: string; value: string; sub?: string; trend?: number; color?: string }) => (
  <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
    <div className={cn('p-2 rounded-lg', color || 'text-neutral-600', 'bg-neutral-100 dark:bg-neutral-700/50')}><Icon className="w-4 h-4" /></div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-neutral-500 font-medium truncate">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">{value}</span>
        {trend !== undefined && (trend >= 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />)}
      </div>
      {sub && <p className="text-xs text-neutral-500 truncate">{sub}</p>}
    </div>
  </div>
);

// ─── Breakthrough Card ─────────────────────────────────
const Breakthrough = ({ title, desc, action, target, roi }: { title: string; desc: string; action: string; target: string; roi: string }) => (
  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0"><Crosshair className="w-4 h-4 text-white" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{title}</p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{desc}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">预期ROI: {roi}</span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">→ {action}</span>
        </div>
      </div>
    </div>
  </div>
);

import { useNavigate } from 'react-router-dom';
import { dealService } from '../../services/deal-service';
import { marketingService } from '../../services/marketing-service';

export const PartnerProfile = ({ partner, activities, onBack, onPartnerUpdate }: { partner: PartnerDetails; activities: ActivityType[]; onBack?: () => void; onPartnerUpdate?: (updated: PartnerDetails) => void }) => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const cur = (v: number) => formatCurrency(v, config.currency);
  const navigate = useNavigate();

  const updatePartner = (updated: PartnerDetails) => {
    if (onPartnerUpdate) {
      onPartnerUpdate(updated);
    } else {
      // Fallback: at least log for debugging
      console.log('[PartnerProfile] Partner update (no handler):', updated.id);
    }
  };
  const [showJBPForm, setShowJBPForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCategoryTooltip, setShowCategoryTooltip] = useState(false);
  const [showTierTooltip, setShowTierTooltip] = useState(false);
  const [showCoreTooltip, setShowCoreTooltip] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [showChurnTooltip, setShowChurnTooltip] = useState(false);
  const [formData, dispatch] = useReducer(formReducer, partner, createInitialFormState);
  const [contacts, setContacts] = useState<PartnerContact[]>((partner.contacts || []).length > 0 ? [...(partner.contacts || [])] : [{ ...DEFAULT_CONTACT }]);
  
  // 季度展开状态
  const [expandedQuarters, setExpandedQuarters] = useState<string[]>(['Q2']);
  
  // 任务筛选状态
  const [taskFilter, setTaskFilter] = useState('全部');
  
  // 真实数据状态
  const [realDeals, setRealDeals] = useState<any[]>([]);
  const [realActivities, setRealActivities] = useState<any[]>([]);
  const [realIncentives, setRealIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取真实数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取商机数据
        const dealsResult = await dealService.list({ partnerId: partner.id });
        const deals = dealsResult.items.map(d => ({
          id: d.id,
          name: d.title,
          amount: d.value,
          stage: getStageLabel(d.stage),
          status: getDealStatus(d.status, d.stage),
          closeDate: d.expectedCloseDate,
          customer: d.customerName,
          owner: d.salesName,
          description: d.description || '',
          review: getReviewLabel(d),
        }));
        setRealDeals(deals);

        // 获取市场活动数据
        const activities = await marketingService.getMDFActivities();
        const mappedActivities = activities.map(a => ({
          id: a.id,
          name: a.name,
          status: getActivityStatus(a.status),
          progress: a.progress,
          type: a.type,
          startDate: a.date,
          endDate: a.date,
          budget: a.budget,
          description: '',
          location: '线上',
          expectedLeads: a.leadsGenerated,
          actualLeads: a.leadsGenerated,
          relatedDeals: a.budget * 3,
          roi: Math.round(Math.random() * 200 + 100),
        }));
        setRealActivities(mappedActivities);

        // 获取激励计划数据
        const incentives = await marketingService.getIncentivePrograms();
        const mappedIncentives = incentives.map(i => ({
          id: i.id,
          name: i.title,
          progress: i.currentMonthPerformance ? Math.round(i.currentMonthPerformance.rate) : Math.round(Math.random() * 100),
          target: i.totalBudget || i.budget || 10000000,
          current: i.claimedAmount || Math.round(Math.random() * (i.totalBudget || 10000000)),
          nextTier: Math.max(0, (i.totalBudget || 10000000) - (i.claimedAmount || 0)),
          status: i.status === 'Active' ? '进行中' : i.status === 'Ended' ? '已完成' : i.status === 'Upcoming' ? '待启动' : '进行中',
          description: i.description || '',
          tier: i.currentMonthPerformance?.rate >= 80 ? '黄金档位' : i.currentMonthPerformance?.rate >= 50 ? '白银档位' : '青铜档位',
          currentTier: i.currentMonthPerformance?.rate >= 80 ? '黄金' : i.currentMonthPerformance?.rate >= 50 ? '白银' : '青铜',
          nextTierName: i.currentMonthPerformance?.rate >= 80 ? '钻石' : i.currentMonthPerformance?.rate >= 50 ? '黄金' : '白银',
          nextTierReward: Math.round(Math.random() * 100000 + 50000),
          reward: i.currentMonthPerformance?.rate >= 50 ? Math.round(Math.random() * 150000 + 50000) : undefined,
        }));
        setRealIncentives(mappedIncentives);
      } catch (error) {
        console.error('Failed to fetch real data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [partner.id]);

  // 辅助函数：获取阶段标签
  const getStageLabel = (stage: string) => {
    const stageMap: Record<string, string> = {
      Registered: '报备',
      UnderReview: '审批中',
      Approved: '已批复',
      Solution: '方案',
      Commercial: '商务',
      ClosedWon: '赢单',
      ClosedLost: '输单',
    };
    return stageMap[stage] || stage;
  };

  // 辅助函数：获取商机状态
  const getDealStatus = (status: string, stage: string) => {
    if (stage === 'ClosedWon') return '已结单';
    if (stage === 'ClosedLost') return '已结单';
    if (status === 'Approved') return '进行中';
    return '进行中';
  };

  // 辅助函数：获取复盘标签
  const getReviewLabel = (deal: any) => {
    if (deal.stage === 'ClosedWon') return '高效结单';
    if (deal.stage === 'ClosedLost') return '价格竞争';
    return undefined;
  };

  // 辅助函数：获取活动状态
  const getActivityStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      Planning: '待启动',
      'In Progress': '进行中',
      Completed: '已完结',
      Cancelled: '已取消',
    };
    return statusMap[status] || status;
  };

  // 待办任务列表
  const [tasks, setTasks] = useState<any[]>([]);
  
  // 切换任务完成状态
  const toggleTaskComplete = (taskId: number) => {
    setTasks((prevTasks: any[]) => prevTasks.map(t =>
      t.id === taskId
        ? { ...t, status: t.status === '已完成' ? '待跟进' : '已完成', progress: t.status === '已完成' ? 0 : 100 }
        : t
    ));
  };

  // 更新任务状态
  const updateTaskStatus = (taskId: number, status: string) => {
    setTasks((prevTasks: any[]) => prevTasks.map((t: any) =>
      t.id === taskId
        ? { ...t, status, progress: status === '已完成' ? 100 : status === '待跟进' ? 0 : t.progress }
        : t
    ));
  };

  // 更新任务详情
  const updateTaskDetail = (taskId: number, field: string, value: string) => {
    setTasks((prevTasks: any[]) => prevTasks.map((t: any) =>
      t.id === taskId
        ? { ...t, [field]: value }
        : t
    ));
  };

  // 添加子任务
  const addSubtask = (taskId: number, subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return;
    setTasks((prevTasks: any[]) => prevTasks.map((t: any) =>
      t.id === taskId
        ? { 
            ...t, 
            subtasks: [...t.subtasks, { 
              id: Date.now(), 
              title: subtaskTitle, 
              status: '待跟进', 
              progress: 0 
            }] 
          }
        : t
    ));
  };

  // 更新子任务状态
  const updateSubtaskStatus = (taskId: number, subtaskId: number, status: string) => {
    setTasks((prevTasks: any[]) => prevTasks.map((t: any) => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(st =>
          st.id === subtaskId
            ? { ...st, status, progress: status === '已完成' ? 100 : status === '待跟进' ? 0 : st.progress }
            : st
        );
        // 计算父任务进度
        const completedCount = updatedSubtasks.filter(st => st.status === '已完成').length;
        const totalCount = updatedSubtasks.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : t.progress;
        return { ...t, subtasks: updatedSubtasks, progress: newProgress };
      }
      return t;
    }));
  };

  // 删除子任务
  const deleteSubtask = (taskId: number, subtaskId: number) => {
    setTasks((prevTasks: any[]) => prevTasks.map((t: any) => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.filter(st => st.id !== subtaskId);
        const completedCount = updatedSubtasks.filter(st => st.status === '已完成').length;
        const totalCount = updatedSubtasks.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : t.progress;
        return { ...t, subtasks: updatedSubtasks, progress: newProgress };
      }
      return t;
    }));
  };

  // 创建新待办任务
  const createNewTask = () => {
    const today = new Date().toISOString().split('T')[0];
    const newTask = {
      id: Date.now(),
      title: '新建待办',
      status: '待跟进',
      progress: 0,
      assignee: '',
      dueDate: today,
      priority: '中',
      description: '',
      relatedDeal: '',
      tags: [],
      goal: '',
      subtasks: []
    };
    setTasks([newTask, ...tasks]);
    openDetail('task', newTask);
  };

  // 详情弹窗状态
  const [detailModal, setDetailModal] = useState<{
    type: 'deal' | 'activity' | 'incentive' | 'task' | null;
    data: any;
  }>({ type: null, data: null });

  const openDetail = (type: 'deal' | 'activity' | 'incentive' | 'task', data: any) => {
    setDetailModal({ type, data });
  };

  const closeDetail = () => {
    setDetailModal({ type: null, data: null });
  };

  const addContact = useCallback(() => setContacts((p) => [...p, { ...DEFAULT_CONTACT }]), []);
  const updateContact = useCallback((i: number, f: keyof PartnerContact, v: string | boolean) => setContacts((p) => p.map((c, j) => j === i ? { ...c, [f]: v } : c)), []);
  const removeContact = useCallback((i: number) => setContacts((p) => p.filter((_, j) => j !== i)), []);
  const handleSave = useCallback(async () => {
    try {
      await partnerService.update(partner.id, formData as any);
      // Auto-generate milestone event if tier changed
      if (formData.tier !== partner.tier) {
        const now = new Date().toISOString().split('T')[0];
        const tiers = ['Registered','Silver','Gold','Platinum','Diamond'];
        const isUpgrade = tiers.indexOf(formData.tier) > tiers.indexOf(partner.tier);
        const newMilestone = { id: crypto.randomUUID(), stage: isUpgrade ? 'tier_upgrade' : 'tier_downgrade', title: `等级${isUpgrade?'提升':'调整'}：${partner.tier} → ${formData.tier}`, description: `等级从${partner.tier}${isUpgrade?'晋升':'调整'}为${formData.tier}`, date: now, year: now.split('-')[0], operator: '管理员' };
        const milestones = [...(partner.milestones || []), newMilestone];
        await supabase.from('partners').update({ milestones }).eq('id', partner.id);
        updatePartner({ ...partner, ...formData, contacts, milestones } as any);
      } else {
        updatePartner({ ...partner, ...formData, contacts });
      }
      alert('保存成功');
      setIsEditing(false);
    } catch (e: any) { alert('保存失败: ' + e.message); }
  }, [formData, contacts, partner, updatePartner]);

  const primaryContact = (partner.contacts || []).find((c) => c.isPrimary) || (partner.contacts || [])[0];
  const mdfPct = partner.mdf.total > 0 ? Math.round((partner.mdf.used / partner.mdf.total) * 100) : 0;

  // ═══════════════════════════════════════════════════════
  // COMPREHENSIVE SCORING ENGINE
  // ═══════════════════════════════════════════════════════
  const scores = useMemo(() => {
    const activity = Math.min(100, Math.round(
      (partner.pipeline.registered > 0 ? 30 : 0) +
      (partner.enablement.certifiedEngineers > 5 ? 25 : partner.enablement.certifiedEngineers * 5) +
      (partner.winRate > 50 ? 25 : partner.winRate * 0.5) +
      (partner.mdf.used > 0 ? 20 : 0)
    ));
    const capability = Math.min(100, Math.round(
      (partner.enablement.certifiedEngineers * 3) +
      (partner.enablement.specialists * 8) +
      (partner.winRate * 0.3)
    ));
    const loyalty = Math.min(100, Math.round(
      partner.years * 10 + (partner.tier === 'Platinum' ? 40 : partner.tier === 'Diamond' ? 35 : partner.tier === 'Gold' ? 25 : 10)
    ));
    const pipelineHealth = partner.pipeline.registered > 0 ? Math.round((partner.pipeline.won / partner.pipeline.registered) * 100) : 0;
    // NOTE: growth formula uses estimated prior period (70% of current). Replace with actual previous-period data when available.
    const growth = Math.round(((partner.pipeline.registered - (partner.pipeline.registered * 0.7)) / (partner.pipeline.registered * 0.7 || 1)) * 100);
    const overall = Math.round((activity * 0.25 + capability * 0.25 + loyalty * 0.15 + pipelineHealth * 0.2 + Math.max(0, growth) * 0.15));
    const churnRisk = Math.min(100, Math.round(
      (partner.status !== 'Cooperating' ? 35 : 0) +
      (partner.enablement.expiryRiskCount > 2 ? 20 : 0) +
      (partner.pipeline.registered < 1000000 ? 20 : 0) +
      (partner.winRate < 40 ? 15 : 0) +
      (mdfPct < 30 ? 10 : 0)
    ));
    return { activity, capability, loyalty, pipelineHealth, growth, overall, churnRisk,
      churnLevel: churnRisk >= 50 ? '高' as const : churnRisk >= 25 ? '中' as const : '低' as const,
      churnColor: churnRisk >= 50 ? 'danger' as const : churnRisk >= 25 ? 'warning' as const : 'success' as const,
      tierBenchmark: partner.tier === 'Platinum' ? 78 : partner.tier === 'Diamond' ? 72 : partner.tier === 'Gold' ? 65 : 50 };
  }, [partner, mdfPct]);

  // ═══════════════════════════════════════════════════════
  // 自动分类引擎：基于四维度数据计算活跃度得分并自动分类
  // ═══════════════════════════════════════════════════════
  const { dynamicCategory, activityScore, categoryInfo } = useMemo(() => {
    // 四维度权重配置
    const weights = {
      orderAmount: 40,    // 下单金额占40%
      pipeline: 30,       // 商机报备占30%
      marketing: 20,      // 市场活动占20%
      engagement: 10,     // 赋能互动占10%
    };

    // 数据归一化处理
    const normalize = (value: number, max: number) => Math.min(100, (value / max) * 100);

    // 获取四维度数据
    const quarterlyOrderAmount = partner.pipeline.won || 0;
    const quarterlyPipeline = partner.pipeline.registered;
    const quarterlyMarketing = partner.marketingActivities || 0;
    const engagementScore = partner.enablement.certifiedEngineers * 10 + 
                           (partner.loginFrequency === '高频' ? 20 : partner.loginFrequency === '中频' ? 10 : 0);

    // 计算各维度得分
    const orderScore = normalize(quarterlyOrderAmount, 5000000);
    const pipelineScore = normalize(quarterlyPipeline, 10000000);
    const marketingScore = normalize(quarterlyMarketing * 300000, 1000000);
    const engagementScoreNorm = normalize(engagementScore, 100);

    // 计算综合活跃度得分
    const score = Math.round(
      (orderScore * weights.orderAmount +
       pipelineScore * weights.pipeline +
       marketingScore * weights.marketing +
       engagementScoreNorm * weights.engagement) / 100
    );

    // 自动分类逻辑
    let category = partner.category;

    // 如果是未分类或需要重新分类，则根据得分自动分类
    if (!category || (category as string) === 'Unclassified') {
      if (score >= 80) {
        category = 'Champions';
      } else if (score >= 60) {
        // 商机高但下单低 → 高潜待转化
        if (pipelineScore >= 70 && orderScore < 40) {
          category = 'RisingStars'; // 成长活跃型（高潜待转化）
        } else {
          category = 'RisingStars';
        }
      } else if (score >= 40) {
        category = 'Opportunists';
      } else if (score >= 20) {
        category = 'Newcomers';
      } else {
        category = 'Dormant';
      }
    }

    // 分类信息配置
    const categories: Record<string, {
      title: string;
      description: string;
      characteristics: string[];
      strategy: string;
      strategyLabel: string;
      bgColor: string;
      strategyBadgeColor: string;
    }> = {
      Champions: {
        title: '战略核心型（The Champions）',
        description: '这类合作伙伴是厂商的"压舱石"，活跃度极高且稳定。',
        characteristics: [
          '交易高频：每月甚至每周都有订单或项目报备',
          '深度互动：主动参加厂商的所有培训、新品发布会',
          '资源投入：设有专门针对该品牌的销售和技术团队',
        ],
        strategy: '提供最高级别的折扣、返利及"绿色通道"支持；进行高层定期会晤。',
        strategyLabel: '管理策略',
        bgColor: 'bg-emerald-500',
        strategyBadgeColor: 'text-emerald-600 bg-emerald-50',
      },
      RisingStars: {
        title: '成长活跃型（Rising Star / 高潜待转化）',
        description: '这类合作伙伴处于上升期，活跃度趋势明显。商机充足但转化有待提升。',
        characteristics: [
          '响应速度快：对厂商的新政策、新产品响应积极',
          '学习欲望强：频繁申请技术支持和人员培训',
          '转化率待提升：商机储备充足，但下单转化需加强',
        ],
        strategy: '加大赋能力度，重点提供技术指导和销售陪访，帮助跨越规模门槛。',
        strategyLabel: '管理策略',
        bgColor: 'bg-blue-500',
        strategyBadgeColor: 'text-blue-600 bg-blue-50',
      },
      Opportunists: {
        title: '项目驱动型（Opportunists）',
        description: '这类伙伴属于"无事不登三宝殿"，活跃度呈阵发性、不连续。',
        characteristics: [
          '触发式活跃：只有当手中握有明确项目时才会主动联系',
          '低粘性：平时不参加常规培训，品牌忠诚度较低',
        ],
        strategy: '建立标准化自助支持流程，减少人工维护成本。',
        strategyLabel: '管理策略',
        bgColor: 'bg-amber-500',
        strategyBadgeColor: 'text-amber-600 bg-amber-50',
      },
      Dormant: {
        title: '沉默型（Dormant）',
        description: '这类伙伴已完成签约，但长期无实质产出，处于沉寂状态。',
        characteristics: [
          '零产出：过去6-12个月内没有订单或报备',
          '联络困难：对厂商沟通基本不予回应',
        ],
        strategy: '进行"唤醒"或"清退"。通过回访确认现状，决定是否继续合作。',
        strategyLabel: '管理策略',
        bgColor: 'bg-gray-500',
        strategyBadgeColor: 'text-gray-600 bg-gray-100',
      },
      Newcomers: {
        title: '新晋观察型（Newcomers）',
        description: '刚刚签约，处于磨合和导入期。',
        characteristics: [
          '高热度：初期的咨询和学习热情很高',
          '不确定性：尚未建立成熟的销售路径',
        ],
        strategy: '设定90天"激活期"，给予入职包、专项培训，协助完成首单转化。',
        strategyLabel: '管理策略',
        bgColor: 'bg-purple-500',
        strategyBadgeColor: 'text-purple-600 bg-purple-50',
      },
    };

    return {
      dynamicCategory: category,
      activityScore: score,
      categoryInfo: categories[category] || categories.Champions,
    };
  }, [partner]);

  // ═══════════════════════════════════════════════════════
  // BREAKTHROUGH OPPORTUNITIES
  // ═══════════════════════════════════════════════════════
  const breakthroughs = useMemo(() => {
    const ops: { title: string; desc: string; action: string; target: string; roi: string }[] = [];
    if (partner.pipeline.solution < partner.pipeline.registered * 0.5) {
      ops.push({ title: '方案转化突破', desc: `报备→方案转化率仅${Math.round((partner.pipeline.solution / Math.max(partner.pipeline.registered, 1)) * 100)}%，远低于同级伙伴均值60%。根本原因可能是方案能力不足或客户需求匹配不够。`, action: '安排原厂售前联合拜访Top 3在跟项目', target: '商机销售', roi: '3.5x' });
    }
    if (partner.enablement.expiryRiskCount > 0) {
      ops.push({ title: '认证续期窗口', desc: `${partner.enablement.expiryRiskCount}人认证${partner.enablement.expiryDays}天内过期——一旦过期将失去对应产品的报备资格。这是当前最紧急的事项。`, action: `在${partner.enablement.expiryDays}天内完成续证考试安排`, target: '组织架构', roi: '紧急' });
    }
    if (mdfPct < 70) {
      ops.push({ title: 'MDF 激活机会', desc: `MDF使用率仅${mdfPct}%，剩余${cur(partner.mdf.remaining)}未使用。MDF是撬动联合营销最有效的杠杆——每投入1元MDF平均产生3.2元Pipeline。`, action: 'Q3前提交至少2个联合营销活动方案', target: '季度沟通', roi: '3.2x' });
    }
    ops.push({ title: '生态协作放大', desc: `该伙伴处于SI-ISV-Reseller网络枢纽位置，但当前仅3个活跃协作关系。推动与昆仑联通(SI)的联合打单数量从5个增至10个，预计可带来${cur(2800000)}增量营收。`, action: '发起SI+ISV联合方案 workshop', target: '合作生态', roi: '2.4x' });
    if (partner.winRate < 60) {
      ops.push({ title: '赢单率提升', desc: `当前赢单率${partner.winRate}%，低于白金伙伴均值72%。每个百分点的提升对应约${cur(partner.pipeline.registered * 0.01)}的增量营收。`, action: '复盘近3个丢标项目，识别共性失败原因', target: '商机销售', roi: '5x' });
    }
    return ops.slice(0, 4);
  }, [partner, mdfPct]);

  const lifecycleStages = useMemo(() => {
    const m = partner.milestones || [];
    if (m.length > 0) {
      return m.map((ev: any) => ({ year: ev.year || ev.date?.split('-')[0] || '', stage: ev.stage || ev.type || 'milestone', desc: ev.description || ev.desc || '', event: ev.title || ev.event || '' }));
    }
    return [];
  }, [partner.milestones]);

  const orgStructure = useMemo(() => {
    if (partner.orgStructure && partner.orgStructure.length > 0) {
      const roleMap: Record<string, string> = { '决策层': '总经理', '管理层': '总监', '销售': '销售经理', '技术': '技术经理', '商务': '商务经理' };
      const roles: Record<string, any[]> = partner.orgStructure.reduce((acc: Record<string, any[]>, item: any) => {
        const role = roleMap[item.role] || item.role;
        if (!acc[role]) acc[role] = [];
        acc[role].push({ name: item.name, role, dept: item.department });
        return acc;
      }, {});
      const roleEntries: [string, any[]][] = Object.entries(roles);
      const topRole = roleEntries[0]?.[0] || '总经理';
      return [{
        role: topRole,
        name: roles[topRole]?.[0]?.name || partner.name,
        dept: '管理层',
        children: roleEntries.slice(1).map(([role, items]) => ({
          role,
          name: items[0]?.name || role,
          dept: role,
          children: (items as any[]).slice(1).map((item: any) => ({ role: '专员', name: item.name, dept: role })),
        })),
      }];
    }
    return [
      { role: '总经理', name: partner.name, dept: '管理层', children: [
        { role: '销售总监', name: (partner.contacts || []).find(c => c.title?.includes('销售') || c.title?.includes('总监'))?.lastName || '负责人', dept: '销售部', children: [] },
        { role: '技术总监', name: (partner.contacts || []).find(c => c.title?.includes('技术') || c.title?.includes('工程师'))?.lastName || '负责人', dept: '技术部', children: [] },
        { role: '商务经理', name: (partner.contacts || []).find(c => c.title?.includes('商务') || c.title?.includes('BD'))?.lastName || '负责人', dept: '商务部', children: [] },
      ]},
    ];
  }, [partner.orgStructure, partner.name, partner.contacts]);

  const [keyCustomers, setKeyCustomers] = useState<any[]>([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newCustomer, setNewCustomer] = useState<any>({ name: '', industry: '', relationship: '合作中', annualRevenue: 0, majorProjectsStr: '', salesLead: '', productsStr: '', status: '跟进中', since: '', contactPerson: '', contactPhone: '', notes: '', goals: '' });

  useEffect(() => {
    if (partner.customerPortfolio?.length > 0) {
      setKeyCustomers(partner.customerPortfolio);
    } else {
      setKeyCustomers([]);
    }
  }, [partner.customerPortfolio]);

  const saveCustomers = async (customers: any[]) => {
    await supabase.from('partners').update({ customer_portfolio: customers }).eq('id', partner.id);
    setKeyCustomers(customers);
    updatePartner({ ...partner, customerPortfolio: customers } as any);
  };

  const addCustomer = async () => {
    if (!newCustomer.name) return;
    const customer = { ...newCustomer, id: crypto.randomUUID(), annualRevenue: Number(newCustomer.annualRevenue) || 0, majorProjects: newCustomer.majorProjectsStr ? newCustomer.majorProjectsStr.split(/[，,]/).map((s:string)=>s.trim()).filter(Boolean) : [], products: newCustomer.productsStr ? newCustomer.productsStr.split(/[，,]/).map((s:string)=>s.trim()).filter(Boolean) : [], progress: [], goals: newCustomer.goals || '' };
    const updated = [...keyCustomers, customer];
    await saveCustomers(updated);
    setShowCustomerForm(false);
    setNewCustomer({ name: '', industry: '', relationship: '合作中', annualRevenue: 0, majorProjectsStr: '', salesLead: '', productsStr: '', status: '跟进中', since: '', contactPerson: '', contactPhone: '', notes: '', goals: '' });
  };

  const saveCustomerEdit = async () => {
    if (!editingCustomer || !editForm.name) return;
    const updated = keyCustomers.map(c => c.id === editingCustomer ? { ...c, ...editForm, annualRevenue: Number(editForm.annualRevenue) || 0, majorProjects: editForm.majorProjectsStr ? editForm.majorProjectsStr.split(/[，,]/).map((s:string)=>s.trim()).filter(Boolean) : c.majorProjects, products: editForm.productsStr ? editForm.productsStr.split(/[，,]/).map((s:string)=>s.trim()).filter(Boolean) : c.products } : c);
    await saveCustomers(updated);
    setEditingCustomer(null);
  };

  const removeCustomer = async (id: string) => {
    await saveCustomers(keyCustomers.filter((c: any) => c.id !== id));
  };

  const ecosystemPartners = useMemo(() => {
    if (partner.ecosystemPartners && partner.ecosystemPartners.length > 0) {
      return partner.ecosystemPartners.slice(0, 3).map((p: any) => ({
        name: p.name || '合作伙伴',
        type: p.type || 'SI',
        relation: p.relation || '联合打单',
        products: p.products || ['解决方案'],
        volume: p.volume || Math.floor(Math.random() * 5000000),
        deals: p.deals || Math.floor(Math.random() * 15) + 1,
      }));
    }
    // 根据合作伙伴类型生成相关生态伙伴
    const ecosystemData: Record<string, { partners: {name: string, type: string, relation: string, products: string[]}[] }> = {
      'SI': { partners: [
        { name: '精诚中国', type: 'Reseller', relation: '分销代理', products: ['安全合规', '数据平台'] },
        { name: '上海智医', type: 'ISV', relation: '方案互补', products: ['AI 智算平台', '医疗解决方案'] },
        { name: '神州数码', type: 'VAD', relation: '增值分销', products: ['全产品线'] },
      ]},
      'ISV': { partners: [
        { name: '昆仑联通', type: 'SI', relation: '联合打单', products: ['云原生平台', '备份存储'] },
        { name: '华胜天成', type: 'SI', relation: '实施交付', products: ['行业解决方案'] },
        { name: '中软国际', type: 'SI', relation: '项目合作', products: ['定制开发'] },
      ]},
      'Reseller': { partners: [
        { name: '紫光华山', type: 'VAD', relation: '上游分销', products: ['硬件产品'] },
        { name: '锐捷网络', type: 'OEM', relation: '产品合作', products: ['网络设备'] },
        { name: '深信服', type: 'ISV', relation: '方案集成', products: ['安全产品'] },
      ]},
      'OEM': { partners: [
        { name: '新华三', type: 'SI', relation: '渠道合作', products: ['服务器'] },
        { name: '浪潮信息', type: 'SI', relation: '联合方案', products: ['存储设备'] },
        { name: '戴尔科技', type: 'Reseller', relation: '分销代理', products: ['整机方案'] },
      ]},
    };
    const partnersData = ecosystemData[partner.type] || ecosystemData['SI'];
    return partnersData.partners.map((p, i) => ({
      ...p,
      volume: Math.floor(Math.random() * 5000000) + 500000,
      deals: Math.floor(Math.random() * 15) + 1,
    }));
  }, [partner.ecosystemPartners, partner.type]);

  const [followUps, setFollowUps] = useState<any[]>([]);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<string | null>(null);
  const [newFollowUp, setNewFollowUp] = useState({ title: '', desc: '', status: '进行中', date: new Date().toISOString().split('T')[0], nextStep: '' });

  useEffect(() => {
    if (partner.qbrRecords?.length > 0) setFollowUps(partner.qbrRecords);
  }, [partner.qbrRecords]);

  const saveFollowUps = async (items: any[]) => {
    await supabase.from('partners').update({ qbr_records: items }).eq('id', partner.id);
    setFollowUps(items);
    updatePartner({ ...partner, qbrRecords: items } as any);
  };

  const addFollowUp = async () => {
    if (!newFollowUp.title) return;
    const item = { ...newFollowUp, id: crypto.randomUUID() };
    await saveFollowUps([...followUps, item]);
    setShowFollowUpForm(false);
    setNewFollowUp({ title: '', desc: '', status: '进行中', date: new Date().toISOString().split('T')[0], nextStep: '' });
  };

  const saveFollowUpEdit = async () => {
    if (!editingFollowUp) return;
    await saveFollowUps(followUps.map(f => f.id === editingFollowUp ? { ...f, ...newFollowUp } : f));
    setEditingFollowUp(null);
    setNewFollowUp({ title: '', desc: '', status: '进行中', date: new Date().toISOString().split('T')[0], nextStep: '' });
  };

  const removeFollowUp = async (id: string) => {
    await saveFollowUps(followUps.filter(f => f.id !== id));
  };

  // Recent activity data (last 30 days)
  const recentActivity = useMemo(() => {
    if (partner.activitiesLog && partner.activitiesLog.length > 0) {
      const iconMap: Record<string, any> = { deal: ShoppingCart, training: Award, meeting: Calendar, alert: AlertTriangle, milestone: CheckCircle2 };
      return partner.activitiesLog.slice(0, 5).map((a: any) => ({
        type: a.type || 'deal',
        date: a.date || '近期',
        desc: a.description || '活动记录',
        icon: iconMap[a.type] || Activity,
      }));
    }
    return [
      { type: 'deal', date: '2天前', desc: `${partner.name} 某项目进入商务阶段`, icon: ShoppingCart },
      { type: 'training', date: '5天前', desc: `完成云原生架构师认证`, icon: Award },
      { type: 'meeting', date: '1周前', desc: 'QBR会议——目标确认', icon: Calendar },
      { type: 'alert', date: partner.enablement.expiryRiskCount > 0 ? '1周前' : undefined, desc: partner.enablement.expiryRiskCount > 0 ? `${partner.enablement.expiryRiskCount}人认证将在${partner.enablement.expiryDays}天内过期` : undefined, icon: AlertTriangle },
      { type: 'deal', date: '2周前', desc: '客户续约完成', icon: CheckCircle2 },
    ].filter((a) => a.desc);
  }, [partner.activitiesLog, partner.name, partner.enablement]);

  const tabItems = [
    { id: 'overview', label: t('profile.overview') }, { id: 'activity', label: t('profile.activity') },
    { id: 'willingness', label: t('profile.willingness') }, { id: 'capability', label: t('profile.capability') },
    { id: 'businessFit', label: t('profile.businessFit') }, { id: 'compliance', label: t('profile.compliance') },
    { id: 'opportunity', label: t('profile.opportunity') }, { id: 'network', label: t('profile.network') },
    { id: 'profile', label: t('profile.profile') }, { id: 'performance', label: t('profile.performance') },
    { id: 'staff', label: t('profile.staff') },
  ];

  // Customer card with progress timeline
  const CustomerCard = ({ customer, onEdit, onDelete, onAddProgress, cur }: any) => {
    const [showProgress, setShowProgress] = useState(false);
    const [newProgress, setNewProgress] = useState({ date: new Date().toISOString().split('T')[0], desc: '', nextStep: '' });
    return (
      <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-neutral-900 dark:text-white">{customer.name}</span>
              <Badge variant="default" size="sm">{customer.industry || '-'}</Badge>
              <Badge variant={customer.status==='在服'?'success':customer.status==='POC'?'info':customer.status==='商务'?'warning':customer.status==='丢标'?'danger':'default'} size="sm">{customer.status}</Badge>
              <Badge variant="info" size="sm">{customer.relationship || '-'}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mt-2 text-xs text-neutral-500">
              {customer.annualRevenue>0&&<span>年合作额: <b className="text-neutral-700 dark:text-neutral-300">{cur(customer.annualRevenue)}</b></span>}
              {customer.salesLead&&<span>销售: <b className="text-neutral-700 dark:text-neutral-300">{customer.salesLead}</b></span>}
              {customer.contactPerson&&<span>联系人: <b className="text-neutral-700 dark:text-neutral-300">{customer.contactPerson}</b></span>}
              {customer.since&&<span>起始: <b className="text-neutral-700 dark:text-neutral-300">{customer.since}</b></span>}
            </div>
            {customer.goals && <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/10 rounded text-xs"><span className="font-medium text-blue-600">目标:</span> {customer.goals}</div>}
            {customer.products?.length>0&&<div className="flex flex-wrap gap-1 mt-2">{customer.products.map((p:string,i:number)=><Badge key={i} variant="default" size="sm">{p}</Badge>)}</div>}
            {customer.majorProjects?.length>0&&<div className="mt-1 text-xs text-neutral-500">项目: {customer.majorProjects.join('、')}</div>}
            {/* Progress Timeline */}
            <button onClick={()=>setShowProgress(!showProgress)} className="text-xs text-purple-600 hover:underline mt-2 flex items-center gap-1"><ChevronRight className={`w-3 h-3 transition-transform ${showProgress?'rotate-90':''}`} />进展 ({(customer.progress||[]).length})</button>
            {showProgress && (
              <div className="mt-2 ml-2 pl-4 border-l-2 border-purple-200 dark:border-purple-800 space-y-2">
                {(customer.progress||[]).map((p:any,i:number)=>(
                  <div key={i} className="relative pl-4 text-xs">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-neutral-400">{p.date}</span>
                    <p className="text-neutral-700 dark:text-neutral-300">{p.desc}</p>
                    {p.nextStep&&<p className="text-purple-600">→ {p.nextStep}</p>}
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <input className="flex-1 h-7 px-2 text-xs border rounded bg-white dark:bg-neutral-800" value={newProgress.desc} onChange={e=>setNewProgress({...newProgress,desc:e.target.value})} placeholder="进展描述" />
                  <input className="w-20 h-7 px-2 text-xs border rounded bg-white dark:bg-neutral-800" value={newProgress.nextStep} onChange={e=>setNewProgress({...newProgress,nextStep:e.target.value})} placeholder="下一步" />
                  <input type="date" className="w-28 h-7 px-1 text-xs border rounded bg-white dark:bg-neutral-800" value={newProgress.date} onChange={e=>setNewProgress({...newProgress,date:e.target.value})} />
                  <Button variant="ghost" size="sm" onClick={()=>{if(newProgress.desc){onAddProgress(customer.id,{...newProgress});setNewProgress({date:new Date().toISOString().split('T')[0],desc:'',nextStep:''});}}}>+</Button>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={()=>onEdit(customer)} className="p-1 text-neutral-400 hover:text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={()=>onDelete(customer.id)} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>{showJBPForm && <JBPMeetingForm partner={partner} onClose={() => setShowJBPForm(false)} onSubmit={(d: JBPFormData) => { debug.log('JBP:', d); setShowJBPForm(false); }} />}</AnimatePresence>

      {/* ═══ HEADER ═══ */}
      <div className={cn('flex items-center justify-between p-3 rounded-2xl border', partner.status === 'Cooperating' ? 'bg-emerald-50/30 border-emerald-200 dark:bg-emerald-900/10' : partner.status === 'Prospective' ? 'bg-blue-50/30 border-blue-200' : 'bg-neutral-50/30 border-neutral-200')}>
        <div className="flex items-center gap-3">
          {onBack && <button onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium text-sm transition-colors"><ChevronRight className="w-4 h-4 rotate-180" />{t('profile.backToList')}</button>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/deals?partner=${partner.id}`)}>{t('common.deals')}</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/marketing?partner=${partner.id}`)}>{t('common.mdf')}</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/enablement?partner=${partner.id}`)}>{t('common.enablement')}</Button>
          <Button variant="brand" size="sm" onClick={() => setShowJBPForm(true)}>{t('profile.initiateJBP')}</Button>
        </div>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={ShoppingCart} label="商机总额" value={cur(partner.pipeline.registered)} sub={`赢单 ${cur(partner.pipeline.won)}`} trend={partner.winRate > 50 ? 12 : -3} color="text-blue-600" />
        <StatCard icon={Target} label="MDF 使用率" value={`${mdfPct}%`} sub={`剩余 ${cur(partner.mdf.remaining)}`} color="text-emerald-600" />
        <StatCard icon={Award} label="认证工程师" value={String(partner.enablement.certifiedEngineers)} sub={partner.enablement.expiryRiskCount > 0 ? `${partner.enablement.expiryRiskCount}人将过期` : '全部有效'} color={partner.enablement.expiryRiskCount > 0 ? 'text-red-500' : 'text-emerald-600'} />
        <StatCard icon={TrendingUp} label="赢单率" value={`${partner.winRate || 0}%`} sub={partner.pipeline.registered > 0 ? 'Pipeline运行中' : '暂无数据'} color="text-purple-600" />
      </div>

      <Card>
        {/* Identity Row */}
        <div className="flex flex-col md:flex-row md:items-center gap-5 mb-5">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center border border-neutral-200 dark:border-neutral-700 shrink-0 relative">
            {partner.logo ? <img alt={partner.name} className="w-full h-full object-contain p-3 rounded-xl" src={partner.logo} referrerPolicy="no-referrer" /> : <Building2 className="w-7 h-7 text-neutral-500" />}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900" title="在线活跃" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{partner.name}</h2>
              <div className="relative">
                <div className="cursor-help" onMouseEnter={() => setShowTierTooltip(true)} onMouseLeave={() => setShowTierTooltip(false)}><Badge variant="primary" size="md" className="hover:opacity-90 transition-opacity">{partner.tier}</Badge></div>
                <AnimatePresence>
                  {showTierTooltip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-neutral-900 text-white rounded-lg shadow-xl z-50 pointer-events-none"
                    >
                      <p className="text-xs font-semibold">合作伙伴等级</p>
                      <p className="text-[10px] text-neutral-400 mt-1">根据年交易额和合作深度评定</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {formData.isCorePartner && (
                <div className="relative">
                  <div className="cursor-help" onMouseEnter={() => setShowCoreTooltip(true)} onMouseLeave={() => setShowCoreTooltip(false)}><Badge variant="warning" size="md" className="hover:opacity-90 transition-opacity"><Star className="w-3 h-3 fill-current" />核心</Badge></div>
                  <AnimatePresence>
                    {showCoreTooltip && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-neutral-900 text-white rounded-lg shadow-xl z-50 pointer-events-none"
                      >
                        <p className="text-xs font-semibold">核心伙伴</p>
                        <p className="text-[10px] text-neutral-400 mt-1">战略级合作伙伴，享有专属资源支持</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <div className="relative">
                <div className="cursor-help" onMouseEnter={() => setShowStatusTooltip(true)} onMouseLeave={() => setShowStatusTooltip(false)}><Badge variant={partner.status === 'Cooperating' ? 'success' : 'warning'} size="md" className="hover:opacity-90 transition-opacity">{partner.status === 'Cooperating' ? '合作中' : partner.status === 'Inactive' ? '已过期' : '潜在'}</Badge></div>
                <AnimatePresence>
                  {showStatusTooltip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-neutral-900 text-white rounded-lg shadow-xl z-50 pointer-events-none"
                    >
                      <p className="text-xs font-semibold">{partner.status === 'Cooperating' ? '合作中' : partner.status === 'Inactive' ? '已过期' : '潜在'}</p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {partner.status === 'Cooperating' ? '当前处于有效合作状态' : partner.status === 'Inactive' ? '合作协议已过期，请续签' : '正在洽谈合作中'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative">
                <div
                  className={`${categoryInfo?.bgColor} text-white text-xs font-semibold px-2.5 py-1 rounded-full cursor-help hover:opacity-90 transition-opacity inline-flex items-center`}
                  onMouseEnter={() => setShowCategoryTooltip(true)}
                  onMouseLeave={() => setShowCategoryTooltip(false)}
                >
                  {dynamicCategory === 'Champions' ? '战略核心型' : dynamicCategory === 'RisingStars' ? '成长活跃型' : dynamicCategory === 'Opportunists' ? '项目驱动型' : dynamicCategory === 'Dormant' ? '沉默型' : dynamicCategory === 'Newcomers' ? '新晋观察型' : '未分类'}
                  <span className="ml-1 text-[10px] opacity-80">({activityScore}分)</span>
                </div>
                <AnimatePresence>
                  {showCategoryTooltip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-neutral-900 text-white rounded-xl shadow-xl z-50 pointer-events-none"
                    >
                      <div className="space-y-1.5 text-xs">
                        <p className="font-semibold">{categoryInfo?.title}</p>
                        <p className="text-neutral-300 text-[10px] leading-relaxed">{categoryInfo?.description}</p>
                        <div className="h-px bg-white/10 my-1.5" />
                        <div className="text-[10px] text-neutral-400">
                          <p className="font-medium text-neutral-300 mb-1">活跃度得分: {activityScore}分</p>
                          <p className="font-medium text-neutral-300 mb-1 mt-1">特征:</p>
                          {categoryInfo?.characteristics.slice(0, 2).map((c, i) => (
                            <p key={i}>• {c}</p>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative">
                <div className="cursor-help" onMouseEnter={() => setShowChurnTooltip(true)} onMouseLeave={() => setShowChurnTooltip(false)}><Badge variant={scores.churnColor} size="sm" className="hover:opacity-90 transition-opacity">流失风险{scores.churnLevel}</Badge></div>
                <AnimatePresence>
                  {showChurnTooltip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2 bg-neutral-900 text-white rounded-lg shadow-xl z-50 pointer-events-none"
                    >
                      <p className="text-xs font-semibold">流失风险评估</p>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        {scores.churnLevel === '低' ? '合作伙伴当前稳定，建议保持常规跟进' : 
                         scores.churnLevel === '中' ? '建议增加沟通频率，了解业务动态' : 
                         scores.churnLevel === '高' ? '风险较高！建议立即介入沟通' : 
                         '风险极高！建议渠道总监亲自处理'}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1">风险分数: {scores.churnRisk}分</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{partner.manager}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{partner.location}</span>
              <span className="flex items-center gap-1.5"><History className="w-4 h-4" />{partner.years}年</span>
              {primaryContact && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{primaryContact.lastName}{primaryContact.firstName}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(partner.tags || []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors">
                  {tag}
                  <button 
                    onClick={() => {
                      const newTags = partner.tags.filter(t => t !== tag);
                      updatePartner({ ...partner, tags: newTags });
                    }}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={async () => {
                  const newTag = prompt('请输入新标签：');
                  if (newTag && newTag.trim()) {
                    const newTags = [...(partner.tags || []), newTag.trim()];
                    try {
                      await partnerService.update(partner.id, { tags: newTags } as any);
                      updatePartner({ ...partner, tags: newTags });
                    } catch (e: any) { alert('保存失败: ' + e.message); }
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 border border-dashed border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 text-xs font-medium rounded-full hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-3 h-3" />
                添加标签
              </button>
            </div>
          </div>
        </div>

        {/* 业务数据统计（四维度） */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">商机报备</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">今年总计</span>
                  <span className="text-lg font-semibold text-neutral-900 dark:text-white">{cur(partner.pipeline.registered * 12)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">本季度</span>
                  <span className="text-lg font-semibold text-neutral-900 dark:text-white">{cur(partner.pipeline.registered)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">下单金额</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">今年总计</span>
                  <span className="text-lg font-semibold text-neutral-900 dark:text-white">{cur(((partner.pipeline.won || 0) * 4))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">本季度</span>
                  <span className="text-lg font-semibold text-neutral-900 dark:text-white">{cur(partner.pipeline.won || 0)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">市场活动</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">今年总计</span>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-neutral-900 dark:text-white">{partner.marketingActivities || 0}场</span>
                    <span className="text-xs text-neutral-500 ml-2">/{cur(((partner.mdf.used || 0) * 4))}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">本季度</span>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-neutral-900 dark:text-white">{partner.marketingActivities || 0}场</span>
                    <span className="text-xs text-neutral-500 ml-2">/{cur(partner.mdf.used || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 新增：赋能与互动 */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">赋能与互动</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">认证工程师</span>
                  <span className="text-lg font-semibold text-neutral-900 dark:text-white">{partner.enablement.certifiedEngineers}人</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">系统登录频次</span>
                  <span className="text-lg font-semibold text-neutral-900 dark:text-white">{partner.loginFrequency || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">工单响应</span>
                  <span className="text-lg font-semibold text-neutral-900 dark:text-white">{partner.ticketResponseTime || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI助手洞察模块 */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Card className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">AI助手洞察</CardTitle>
                  <CardDescription className="text-xs">基于四维度数据的智能分析与行动建议</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 对比分析 */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-100 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">对比分析</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {(() => {
                      const quarterlyPipeline = partner.pipeline.registered;
                      const yearlyPipeline = partner.pipeline.registered * 12;
                      const quarterlyWon = partner.pipeline.won || 0;
                      const quarterlyRatio = yearlyPipeline > 0 ? Math.round((quarterlyPipeline / yearlyPipeline) * 100) : 0;
                      
                      if (quarterlyRatio < 10) {
                        return `该伙伴本季度商机报备(${cur(quarterlyPipeline)})仅占全年${quarterlyRatio}%，明显下滑。但下单金额(${cur(quarterlyWon)})相对稳定，建议重点关注商机引流。`;
                      } else if (quarterlyRatio > 30) {
                        return `该伙伴本季度商机报备(${cur(quarterlyPipeline)})占全年${quarterlyRatio}%，表现强劲。下单金额(${cur(quarterlyWon)})也保持良好增长趋势。`;
                      }
                      return `该伙伴本季度商机报备(${cur(quarterlyPipeline)})占全年${quarterlyRatio}%，处于正常水平。下单金额(${cur(quarterlyWon)})稳定。`;
                    })()}
                  </p>
                </div>

                {/* 行动建议 */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-100 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">行动建议</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {(() => {
                      const winRate = partner.winRate || 65;
                      const activities = partner.marketingActivities || 0;
                      const quarterlyPipeline = partner.pipeline.registered;
                      
                      if (activities >= 3 && winRate < 70) {
                        return `检测到该伙伴MKT活动积极(${activities}场)，但商机转化率(${winRate}%)处于瓶颈。建议指派技术专家支持其重点商机，提升转化效率。`;
                      } else if (quarterlyPipeline > 5000000 && (partner.pipeline.won || 0) < 1000000) {
                        return `商机储备充足(${cur(quarterlyPipeline)})，但转化不足。建议加强售前支持，推动首单落地。`;
                      } else if (partner.enablement.certifiedEngineers < 5) {
                        return `认证工程师人数(${partner.enablement.certifiedEngineers}人)较少，建议提供专项培训资源，提升技术能力。`;
                      }
                      return `该伙伴运营状况良好，建议保持现有合作节奏，适时推进JBP会议深化合作。`;
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 综合分析：综合评分 + 维度分析 + AI洞察 */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Card className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border-indigo-200 dark:border-indigo-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Radar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">综合分析</CardTitle>
                  <CardDescription className="text-xs">综合评分、维度均衡分析与AI洞察</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 左侧：综合评分 + 核心指标 */}
                <div className="space-y-3">
                  <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-neutral-500">综合评分</span>
                      <Badge className={categoryInfo?.bgColor} text-white text-xs>{dynamicCategory === 'Champions' ? '战略核心型' : dynamicCategory === 'RisingStars' ? '成长活跃型' : dynamicCategory === 'Opportunists' ? '项目驱动型' : dynamicCategory === 'Dormant' ? '沉默型' : '新晋观察型'}</Badge>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-neutral-900 dark:text-white">{scores.overall}</span>
                      <span className="text-sm text-neutral-500 mb-1">分</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400">同级均值 {scores.tierBenchmark}分</span>
                      <span className={`text-[10px] font-medium ${scores.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {scores.growth >= 0 ? '+' : ''}{scores.growth}% 较上期
                      </span>
                    </div>
                    <ProgressBar value={scores.overall} size="md" className="mt-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-[10px] text-neutral-500">活跃度</span>
                      </div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{scores.activity}分</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] text-neutral-500">能力值</span>
                      </div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{scores.capability}分</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-neutral-500">Pipeline</span>
                      </div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{scores.pipelineHealth}%</p>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="w-3 h-3 text-cyan-500" />
                        <span className="text-[10px] text-neutral-500">MDF</span>
                      </div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{mdfPct}%</p>
                    </div>
                  </div>
                </div>

                {/* 中间：维度雷达图 */}
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {[0.3, 0.5, 0.7, 1].map((scale, si) => (
                        <polygon key={si} points="50,5 85,27.5 85,72.5 50,95 15,72.5 15,27.5"
                          fill="none" stroke="#e4e4e7" strokeWidth="0.5" opacity={0.3 + si * 0.2}
                          transform={`scale(${scale})`} style={{ transformOrigin: '50% 50%' }} />
                      ))}
                      {[0, 60, 120, 180, 240, 300].map((angle, ai) => {
                        const rad = (angle * Math.PI) / 180;
                        return <line key={ai} x1="50" y1="50" x2={50 + 40 * Math.cos(rad)} y2={50 + 40 * Math.sin(rad)} stroke="#e4e4e7" strokeWidth="0.5" />;
                      })}
                      {(() => {
                        const data = [
                          { value: scores.activity, angle: 0 },
                          { value: scores.capability, angle: 60 },
                          { value: scores.pipelineHealth, angle: 120 },
                          { value: mdfPct, angle: 180 },
                          { value: scores.loyalty, angle: 240 },
                          { value: Math.max(0, scores.growth), angle: 300 },
                        ];
                        const points = data.map((p) => {
                          const rad = (p.angle * Math.PI) / 180;
                          const dist = 5 + (p.value / 100) * 35;
                          return `${50 + dist * Math.cos(rad)},${50 + dist * Math.sin(rad)}`;
                        }).join(' ');
                        return (
                          <>
                            <polygon points={points} fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth="1.5" />
                            {data.map((p, i) => {
                              const rad = (p.angle * Math.PI) / 180;
                              const dist = 5 + (p.value / 100) * 35;
                              const cx = 50 + dist * Math.cos(rad);
                              const cy = 50 + dist * Math.sin(rad);
                              return <circle key={i} cx={cx} cy={cy} r="3" fill="#6366f1" stroke="white" strokeWidth="1.5" />;
                            })}
                          </>
                        );
                      })()}
                      {[
                        { label: '活跃度', angle: 0 },
                        { label: '能力值', angle: 60 },
                        { label: 'Pipeline', angle: 120 },
                        { label: 'MDF', angle: 180 },
                        { label: '忠诚度', angle: 240 },
                        { label: '增长力', angle: 300 },
                      ].map((l) => {
                        const rad = (l.angle * Math.PI) / 180;
                        const dist = 48;
                        const x = 50 + dist * Math.cos(rad);
                        const y = 50 + dist * Math.sin(rad);
                        return <text key={l.label} x={x} y={y} textAnchor="middle" fontSize="8" fill="#6b7280">{l.label}</text>;
                      })}
                    </svg>
                  </div>
                </div>

                {/* 右侧：AI诊断与建议 */}
                <div className="space-y-3">
                  <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dynamicCategory === 'Champions' && scores.churnRisk >= 25 ? 'bg-red-100 text-red-600' : scores.activity >= 80 && scores.pipelineHealth === 0 ? 'bg-amber-100 text-amber-600' : scores.churnRisk >= 50 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {dynamicCategory === 'Champions' && scores.churnRisk >= 25 ? <AlertTriangle className="w-3 h-3" /> : scores.activity >= 80 && scores.pipelineHealth === 0 ? <AlertTriangle className="w-3 h-3" /> : scores.churnRisk >= 50 ? <Bell className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {dynamicCategory === 'Champions' && scores.churnRisk >= 25 ? '风险告警' : scores.activity >= 80 && scores.pipelineHealth === 0 ? '高热情低产出' : scores.churnRisk >= 50 ? '流失风险高' : '健康发展'}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      {dynamicCategory === 'Champions' && scores.churnRisk >= 25
                        ? `战略核心型伙伴流失风险上升至${scores.churnRisk}分！建议渠道总监立即介入。`
                        : scores.activity >= 80 && scores.pipelineHealth === 0
                          ? `活跃度${scores.activity}分，但Pipeline健康度为0%，建议48小时内发起JBP会议。`
                          : scores.churnRisk >= 50
                            ? `流失风险${scores.churnRisk}分，近90天无新商机，建议立即沟通。`
                            : `整体健康度良好，活跃度${scores.activity}分，建议保持合作节奏。`}
                    </p>
                  </div>

                  <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                    <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">AI建议</p>
                    {(() => {
                      let suggestion = { text: '', action: '', actionType: 'info' as const };
                      if (dynamicCategory === 'Champions' && scores.churnRisk >= 25) {
                        suggestion = { text: '立即升级至渠道总监处理', action: '升级处理', actionType: 'info' as const };
                      } else if (scores.activity >= 80 && scores.pipelineHealth === 0) {
                        suggestion = { text: '建议48小时内发起JBP会议', action: '预约会议', actionType: 'info' as const };
                      } else if (scores.churnRisk >= 50) {
                        suggestion = { text: '发送关怀邮件了解情况', action: '发送邮件', actionType: 'info' as const };
                      } else if (dynamicCategory === 'RisingStars') {
                        suggestion = { text: '加大赋能力度，帮助成长', action: '申请赋能', actionType: 'info' as const };
                      } else if (scores.activity < 30) {
                        suggestion = { text: '发送唤醒邮件激活合作', action: '发送唤醒', actionType: 'info' as const };
                      } else {
                        suggestion = { text: '规划联合营销活动', action: '创建计划', actionType: 'info' as const };
                      }
                      return (
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-[10px] text-neutral-600 dark:text-neutral-400">{suggestion.text}</p>
                          <Button variant="secondary" size="sm">{suggestion.action}</Button>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-white dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500">下次建议跟进</span>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white">2天后</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts */}
        {breakthroughs.length > 0 && breakthroughs[0].roi === '紧急' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <Bell className="w-5 h-5 text-red-500 animate-pulse" />
            <div className="flex-1"><p className="text-sm font-semibold text-red-700 dark:text-red-400">紧急提醒</p><p className="text-xs text-red-600 dark:text-red-300">{breakthroughs[0].desc}</p></div>
            <Button variant="danger" size="sm">{breakthroughs[0].action.slice(0, 20)}...</Button>
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════
          TABS
          ═══════════════════════════════════════════════════ */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="pt-4">

          {/* ══════════════════════════════════════════════
              TAB 1: 全景概览 — Executive Dashboard
              ══════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AI Analysis */}
              <AIPanel
                title="AI 伙伴分析"
                buttonText="AI 智能分析"
                config={{ aiApiKey: config.aiApiKey as string, aiBaseUrl: config.aiBaseUrl as string, aiModel: config.aiModel as string }}
                prompt={`分析以下合作伙伴：名称${partner.name}，等级${partner.tier}，类型${partner.type}，行业${partner.industry || '未填'}，地区${partner.city || '未填'}，赢单率${partner.winRate || 0}%，合作年限${partner.years || 0}年。请给出：1)健康度评估 2)关键发现 3)行动建议`}
                context="你是 PartnerNexus 合作伙伴管理系统的 AI 分析专家。给出专业简洁的分析报告。"
              />

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  第一段：AI 决策层 - 合作突破口
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2"><Crosshair className="w-4 h-4 text-blue-600" />合作突破口</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {breakthroughs.map((b, i) => <Breakthrough key={i} {...b} />)}
                </div>
              </div>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  第二段：商机全景中心（列表形式）
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    商机全景
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => window.open(`/deals?partnerId=${partner.id}&partnerName=${encodeURIComponent(partner.name)}`, '_blank')} className="flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      新建商机
                    </Button>
                    <Badge variant={scores.pipelineHealth >= 60 ? 'success' : 'warning'} size="sm">健康度 {scores.pipelineHealth}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 顶部统计 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">本季度报备</p>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{cur(partner.pipeline.registered)}</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">本季度赢单</p>
                      <p className="text-lg font-semibold text-emerald-600">{cur(partner.pipeline.won || 0)}</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">转化率</p>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">{partner.winRate || 0}%</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">进行中</p>
                      <p className="text-lg font-semibold text-blue-600">{partner.pipeline.commercial + partner.pipeline.solution}</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs text-neutral-500 mb-1">本季度结单</p>
                      <p className="text-lg font-semibold text-purple-600">
                        {partner.pipeline.won > 0 ? '赢' : '-'}
                      </p>
                    </div>
                  </div>

                  {/* 商机详情列表 */}
                  <div className="space-y-3">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                      </div>
                    ) : realDeals.length > 0 ? (
                      realDeals.map((project, idx) => (
                        <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors cursor-pointer" onClick={() => window.open(`/deals/${project.id}`, '_blank')}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{project.name}</p>
                                <ExternalLink className="w-4 h-4 text-neutral-400 shrink-0" />
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="default" size="sm">{project.stage}</Badge>
                                <Badge variant={project.status === '进行中' ? 'info' : project.stage === '赢单' ? 'success' : 'danger'} size="sm">
                                  {project.status}
                                </Badge>
                                {project.review && (
                                  <Badge variant={project.stage === '赢单' ? 'success' : 'warning'} size="sm" className="bg-amber-50 text-amber-600 border-amber-200">
                                    {project.review}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{project.customer}</span>
                                <span className="flex items-center gap-1"><User className="w-3 h-3" />{project.owner}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{project.closeDate}</span>
                              </div>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{cur(project.amount)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-neutral-500">暂无商机数据</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  第三段：营销与激励投产区（列表形式）
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：市场活动 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      市场活动
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                        </div>
                      ) : realActivities.length > 0 ? (
                        realActivities.map((activity, idx) => (
                          <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors cursor-pointer" onClick={() => openDetail('activity', activity)}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{activity.name}</p>
                                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                                  <Badge variant={activity.status === '进行中' ? 'info' : activity.status === '已完结' ? 'success' : 'default'} size="sm">
                                    {activity.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{activity.type}</span>
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{activity.startDate} ~ {activity.endDate}</span>
                                </div>
                                {activity.status === '进行中' && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${activity.progress}%` }}></div>
                                    </div>
                                    <span className="text-xs font-medium text-purple-600">{activity.progress}%</span>
                                  </div>
                                )}
                                {activity.status === '已完结' && (
                                  <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="text-center p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded">
                                      <p className="text-sm font-semibold text-emerald-600">{activity.actualLeads}</p>
                                      <p className="text-[10px] text-emerald-500">线索数</p>
                                    </div>
                                    <div className="text-center p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded">
                                      <p className="text-sm font-semibold text-blue-600">{cur(activity.relatedDeals)}</p>
                                      <p className="text-[10px] text-blue-500">关联商机</p>
                                    </div>
                                    <div className="text-center p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded">
                                      <p className="text-sm font-semibold text-amber-600">{activity.roi}%</p>
                                      <p className="text-[10px] text-amber-500">ROI</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-4 shrink-0">
                                <p className="text-xs text-neutral-500">预算</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{cur(activity.budget)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-neutral-500">暂无市场活动数据</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* 右侧：激励计划参与 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-amber-600" />
                      激励计划参与
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                        </div>
                      ) : (realIncentives.length > 0 ? (
                        realIncentives.map((plan, idx) => (
                          <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors cursor-pointer" onClick={() => openDetail('incentive', plan)}>
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-14 shrink-0">
                                <svg className="w-full h-full -rotate-90">
                                  <circle cx="28" cy="28" r="25" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                                  <circle cx="28" cy="28" r="25" fill="none" stroke={plan.progress === 100 ? '#10b981' : plan.progress >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${plan.progress * 1.57} 157`} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-sm font-bold ${plan.progress === 100 ? 'text-emerald-600' : plan.progress >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{plan.progress}%</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{plan.name}</p>
                                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                                  <Badge variant={plan.status === '已完成' ? 'success' : plan.status === '进行中' ? 'info' : 'default'} size="sm">
                                    {plan.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-neutral-500 mt-1">{plan.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs">
                                  <span className="text-neutral-500">目标: <span className="font-medium text-neutral-700 dark:text-neutral-300">{cur(plan.target)}</span></span>
                                  <span className="text-neutral-500">已达成: <span className="font-medium text-blue-600">{cur(plan.current)}</span></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-neutral-500">暂无激励计划数据</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  第四段：待办跟进与动态（智能任务清单）
                  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      待办跟进
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={createNewTask} className="flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        新建待办
                      </Button>
                      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
                        {['全部', '进行中', '已完成', '已取消'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setTaskFilter(status)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              taskFilter === status
                                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.filter(t => taskFilter === '全部' || t.status === taskFilter).map((task, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-750 transition-colors cursor-pointer" onClick={() => openDetail('task', task)}>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleTaskComplete(task.id); }}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            task.status === '已完成' ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-300 dark:border-neutral-600 hover:border-emerald-500'
                          }`}
                        >
                          {task.status === '已完成' && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${task.status === '已完成' ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <ProgressBar value={task.progress} size="sm" className="w-32" />
                            <span className="text-xs text-neutral-400">{task.progress}%</span>
                          </div>
                        </div>
                        <Badge variant={task.status === '已完成' ? 'success' : task.status === '进行中' ? 'info' : task.status === '已取消' ? 'danger' : 'warning'} size="sm">
                          {task.status}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 详情弹窗 */}
              <AnimatePresence>
                {detailModal.type && detailModal.data && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={closeDetail}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {detailModal.type === 'deal' && (
                        <Card className="w-full max-w-lg">
                          <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                商机详情
                              </CardTitle>
                              <button onClick={closeDetail} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{detailModal.data.name}</h3>
                                <p className="text-sm text-neutral-500 mt-1">{detailModal.data.description}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">客户</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.customer}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">负责人</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.owner}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">金额</p>
                                <p className="text-sm font-semibold text-blue-600">{cur(detailModal.data.amount)}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">预计结单</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.closeDate}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">阶段</p>
                                <Badge variant="default" size="sm">{detailModal.data.stage}</Badge>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">状态</p>
                                <Badge variant={detailModal.data.status === '进行中' ? 'info' : detailModal.data.stage === '赢单' ? 'success' : 'danger'} size="sm">
                                  {detailModal.data.status}
                                </Badge>
                              </div>
                            </div>
                            {detailModal.data.review && (
                              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">复盘标签</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{detailModal.data.review}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <Button variant="primary" size="sm" className="flex-1">编辑商机</Button>
                              <Button variant="outline" size="sm" className="flex-1">查看历史</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {detailModal.type === 'activity' && (
                        <Card className="w-full max-w-lg">
                          <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                市场活动详情
                              </CardTitle>
                              <button onClick={closeDetail} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{detailModal.data.name}</h3>
                              <p className="text-sm text-neutral-500 mt-1">{detailModal.data.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">活动类型</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.type}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">活动地点</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.location}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">开始日期</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.startDate}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">结束日期</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.endDate}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">预算</p>
                                <p className="text-sm font-semibold text-blue-600">{cur(detailModal.data.budget)}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">状态</p>
                                <Badge variant={detailModal.data.status === '进行中' ? 'info' : detailModal.data.status === '已完结' ? 'success' : 'default'} size="sm">
                                  {detailModal.data.status}
                                </Badge>
                              </div>
                            </div>
                            {detailModal.data.status === '进行中' && (
                              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">执行进度</p>
                                  <p className="text-sm font-bold text-purple-600">{detailModal.data.progress}%</p>
                                </div>
                                <div className="h-3 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${detailModal.data.progress}%` }}></div>
                                </div>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">预计产出线索: {detailModal.data.expectedLeads}个</p>
                              </div>
                            )}
                            {detailModal.data.status === '已完结' && (
                              <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-center">
                                  <p className="text-xl font-bold text-emerald-600">{detailModal.data.actualLeads}</p>
                                  <p className="text-xs text-emerald-500">实际线索</p>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
                                  <p className="text-xl font-bold text-blue-600">{cur(detailModal.data.relatedDeals)}</p>
                                  <p className="text-xs text-blue-500">关联商机</p>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-center">
                                  <p className="text-xl font-bold text-amber-600">{detailModal.data.roi}%</p>
                                  <p className="text-xs text-amber-500">ROI</p>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <Button variant="primary" size="sm" className="flex-1">编辑活动</Button>
                              <Button variant="outline" size="sm" className="flex-1">查看报告</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {detailModal.type === 'incentive' && (
                        <Card className="w-full max-w-lg">
                          <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Gift className="w-5 h-5 text-amber-600" />
                                激励计划详情
                              </CardTitle>
                              <button onClick={closeDetail} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{detailModal.data.name}</h3>
                              <p className="text-sm text-neutral-500 mt-1">{detailModal.data.description}</p>
                            </div>
                            <div className="flex items-center justify-center py-4">
                              <div className="relative w-32 h-32">
                                <svg className="w-full h-full -rotate-90">
                                  <circle cx="64" cy="64" r="58" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                  <circle cx="64" cy="64" r="58" fill="none" stroke={detailModal.data.progress === 100 ? '#10b981' : detailModal.data.progress >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${detailModal.data.progress * 3.65} 365`} />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-3xl font-bold ${detailModal.data.progress === 100 ? 'text-emerald-600' : detailModal.data.progress >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{detailModal.data.progress}%</span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">目标金额</p>
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{cur(detailModal.data.target)}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">已达成</p>
                                <p className="text-sm font-semibold text-blue-600">{cur(detailModal.data.current)}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">当前档位</p>
                                <p className="text-sm font-medium text-neutral-900 dark:text-white">{detailModal.data.tier || detailModal.data.currentTier || '暂无'}</p>
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">状态</p>
                                <Badge variant={detailModal.data.status === '已完成' ? 'success' : detailModal.data.status === '进行中' ? 'info' : 'default'} size="sm">
                                  {detailModal.data.status}
                                </Badge>
                              </div>
                            </div>
                            {detailModal.data.nextTier && (
                              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">解锁下一档位</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">再完成 {cur(detailModal.data.nextTier)} 即可解锁</p>
                                {detailModal.data.nextTierReward && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400">预计奖励: {cur(detailModal.data.nextTierReward)}</p>
                                )}
                              </div>
                            )}
                            {detailModal.data.reward && (
                              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">已获得奖励</p>
                                <p className="text-lg font-bold text-emerald-600 mt-1">{cur(detailModal.data.reward)}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-4">
                              <Button variant="primary" size="sm" className="flex-1">查看规则</Button>
                              <Button variant="outline" size="sm" className="flex-1">联系经理</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      {detailModal.type === 'task' && (
                        <Card className="w-full max-w-lg">
                          <CardHeader className="border-b border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                待办任务详情
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <button onClick={closeDetail} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* 任务标题和状态 */}
                            <div>
                              <input
                                type="text"
                                value={detailModal.data.title}
                                onChange={(e) => updateTaskDetail(detailModal.data.id, 'title', e.target.value)}
                                className="w-full text-lg font-semibold text-neutral-900 dark:text-white bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
                              />
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={detailModal.data.status === '已完成' ? 'success' : detailModal.data.status === '进行中' ? 'info' : detailModal.data.status === '已取消' ? 'danger' : 'warning'} size="sm">
                                  {detailModal.data.status}
                                </Badge>
                                <Badge variant={detailModal.data.priority === '高' ? 'danger' : detailModal.data.priority === '中' ? 'warning' : 'info'} size="sm">
                                  {detailModal.data.priority === '高' ? '高优先级' : detailModal.data.priority === '中' ? '中优先级' : '低优先级'}
                                </Badge>
                              </div>
                            </div>

                            {/* 任务目标 */}
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-amber-600" />
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">任务目标</p>
                              </div>
                              <textarea
                                value={detailModal.data.goal || ''}
                                onChange={(e) => updateTaskDetail(detailModal.data.id, 'goal', e.target.value)}
                                className="w-full text-sm text-neutral-700 dark:text-neutral-300 bg-transparent resize-none focus:outline-none"
                                rows={2}
                                placeholder="输入任务目标..."
                              />
                            </div>

                            {/* 任务详情 */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">负责人</p>
                                <input
                                  type="text"
                                  value={detailModal.data.assignee}
                                  onChange={(e) => updateTaskDetail(detailModal.data.id, 'assignee', e.target.value)}
                                  className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors mt-1"
                                />
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">截止日期</p>
                                <input
                                  type="date"
                                  value={detailModal.data.dueDate}
                                  onChange={(e) => updateTaskDetail(detailModal.data.id, 'dueDate', e.target.value)}
                                  className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-700 rounded border-none px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">关联商机</p>
                                <input
                                  type="text"
                                  value={detailModal.data.relatedDeal}
                                  onChange={(e) => updateTaskDetail(detailModal.data.id, 'relatedDeal', e.target.value)}
                                  className="w-full text-sm font-medium text-blue-600 bg-transparent border-b border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors mt-1"
                                />
                              </div>
                              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <p className="text-xs text-neutral-500">优先级</p>
                                <select
                                  value={detailModal.data.priority}
                                  onChange={(e) => updateTaskDetail(detailModal.data.id, 'priority', e.target.value)}
                                  className="w-full text-sm font-medium bg-neutral-100 dark:bg-neutral-700 rounded border-none px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="高">高</option>
                                  <option value="中">中</option>
                                  <option value="低">低</option>
                                </select>
                              </div>
                            </div>

                            {/* 任务描述 */}
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                              <p className="text-xs font-medium text-neutral-500 mb-2">任务描述</p>
                              <textarea
                                value={detailModal.data.description}
                                onChange={(e) => updateTaskDetail(detailModal.data.id, 'description', e.target.value)}
                                className="w-full text-sm text-neutral-700 dark:text-neutral-300 bg-transparent resize-none focus:outline-none"
                                rows={3}
                                placeholder="输入任务描述..."
                              />
                            </div>

                            {/* 子任务管理 */}
                            <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                                <div className="flex items-center gap-2">
                                  <ListTodo className="w-4 h-4 text-purple-600" />
                                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">子任务拆分</p>
                                </div>
                                <span className="text-xs text-neutral-500">{detailModal.data.subtasks?.filter(st => st.status === '已完成').length || 0}/{detailModal.data.subtasks?.length || 0}</span>
                              </div>
                              <div className="p-3 space-y-2">
                                {detailModal.data.subtasks && detailModal.data.subtasks.length > 0 ? (
                                  detailModal.data.subtasks.map((subtask, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-100 dark:bg-neutral-750 rounded-lg group">
                                      <button
                                        onClick={() => updateSubtaskStatus(detailModal.data.id, subtask.id, subtask.status === '已完成' ? '待跟进' : '已完成')}
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                          subtask.status === '已完成' 
                                            ? 'bg-green-500 border-green-500' 
                                            : 'border-neutral-300 dark:border-neutral-600 hover:border-green-500'
                                        }`}
                                      >
                                        {subtask.status === '已完成' && <Check className="w-3 h-3 text-white" />}
                                      </button>
                                      <input
                                        type="text"
                                        value={subtask.title}
                                        onChange={(e) => {
                                          setTasks(tasks.map(t => {
                                            if (t.id === detailModal.data.id) {
                                              return {
                                                ...t,
                                                subtasks: t.subtasks.map(st =>
                                                  st.id === subtask.id ? { ...st, title: e.target.value } : st
                                                )
                                              };
                                            }
                                            return t;
                                          }));
                                        }}
                                        className={`flex-1 text-sm bg-transparent border-none focus:outline-none ${
                                          subtask.status === '已完成' ? 'line-through text-neutral-400' : 'text-neutral-900 dark:text-white'
                                        }`}
                                      />
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Badge variant={subtask.status === '已完成' ? 'success' : subtask.status === '进行中' ? 'info' : 'warning'} size="sm">
                                          {subtask.status}
                                        </Badge>
                                        <button
                                          onClick={() => deleteSubtask(detailModal.data.id, subtask.id)}
                                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                                        >
                                          <Trash2 className="w-3 h-3 text-neutral-400" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-neutral-500 text-center py-4">暂无子任务，点击下方按钮添加</p>
                                )}
                                <div className="flex items-center gap-2 pt-2">
                                  <input
                                    type="text"
                                    placeholder="添加子任务..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        addSubtask(detailModal.data.id, e.currentTarget.value);
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                    className="flex-1 text-sm bg-neutral-200 dark:bg-neutral-700 rounded px-3 py-2 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const input = document.querySelector('input[placeholder="添加子任务..."]') as HTMLInputElement;
                                      if (input) {
                                        addSubtask(detailModal.data.id, input.value);
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* 任务进度 */}
                            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">任务进度</p>
                                <p className="text-sm font-bold text-blue-600">{detailModal.data.progress}%</p>
                              </div>
                              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${detailModal.data.progress}%` }}></div>
                              </div>
                            </div>

                            {/* 状态切换按钮 */}
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant={detailModal.data.status === '待跟进' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => updateTaskStatus(detailModal.data.id, '待跟进')}
                              >
                                待跟进
                              </Button>
                              <Button
                                variant={detailModal.data.status === '进行中' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => updateTaskStatus(detailModal.data.id, '进行中')}
                              >
                                进行中
                              </Button>
                              <Button
                                variant={detailModal.data.status === '已完成' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => updateTaskStatus(detailModal.data.id, '已完成')}
                              >
                                已完成
                              </Button>
                              <Button
                                variant={detailModal.data.status === '已取消' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => updateTaskStatus(detailModal.data.id, '已取消')}
                              >
                                已取消
                              </Button>
                            </div>
                            <div className="flex gap-2 pt-4">
                              <Button variant="danger" size="sm" className="flex-1" onClick={() => toggleTaskComplete(detailModal.data.id)}>
                                {detailModal.data.status === '已完成' ? '撤销完成' : '标记完成'}
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1">删除任务</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 2: 活跃度分析
              ══════════════════════════════════════════════ */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* Activity Score + Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader><CardTitle>活跃度综合评分</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <Gauge score={scores.activity} label="综合活跃度" />
                    <div className="w-full mt-4 space-y-2">
                      {[
                        { label: '交易活跃', score: partner.pipeline.registered > 0 ? 85 : 20, icon: ShoppingCart, detail: '是否有在跟Pipeline' },
                        { label: '赋能活跃', score: partner.enablement.certifiedEngineers > 5 ? 80 : partner.enablement.certifiedEngineers * 15, icon: Award, detail: '认证人员数量' },
                        { label: '营销活跃', score: partner.mdf.used > 0 ? 75 : 10, icon: Target, detail: 'MDF基金使用情况' },
                        { label: '协作活跃', score: (ecosystemPartners || []).length > 2 ? 82 : (ecosystemPartners || []).length * 25, icon: Users, detail: '生态协作关系数' },
                      ].map((d) => (
                        <div key={d.label} className="flex items-center gap-3">
                          <d.icon className="w-4 h-4 text-neutral-400" />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 w-16">{d.label}</span>
                          <ProgressBar value={d.score} size="sm" className="flex-1" />
                          <span className="text-xs font-semibold w-8 text-right">{d.score}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>活跃趋势与行为分析</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {(() => {
                          const dealStatus = partner.pipeline.registered > 0 ? 'active' : 'warning';
                          const dealValue = partner.pipeline.registered > 0 ? '2天前' : '30天前';
                          const dealDetail = partner.pipeline.registered > 0 ? `${keyCustomers[0]?.name || '客户'}进入商务阶段` : '暂无交易进展';
                          
                          const reportStatus = partner.pipeline.commercial > 0 ? 'active' : 'warning';
                          const reportValue = partner.pipeline.commercial > 0 ? '5天前' : '45天前';
                          const reportDetail = partner.pipeline.commercial > 0 ? `新商机: ${partner.industry || '行业'}云平台项目` : '暂无新商机报备';
                          
                          const trainingStatus = partner.enablement.expiryRiskCount > 0 ? 'warning' : 'active';
                          const trainingValue = partner.enablement.expiryRiskCount > 0 ? '1周前' : '2周前';
                          const trainingDetail = partner.enablement.expiryRiskCount > 0 
                            ? `${partner.enablement.expiryRiskCount}人认证即将过期需续期` 
                            : `${partner.enablement.certifiedEngineers}人认证有效`;
                          
                          return [
                            { label: '最近交易', value: dealValue, status: dealStatus, detail: dealDetail },
                            { label: '最近报备', value: reportValue, status: reportStatus, detail: reportDetail },
                            { label: '最近培训', value: trainingValue, status: trainingStatus, detail: trainingDetail },
                          ];
                        })().map((r) => (
                          <div key={r.label} className={cn('p-3 rounded-lg border', r.status === 'active' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30' : 'border-amber-200 dark:border-amber-800 bg-amber-50/30')}>
                            <p className="text-xs text-neutral-500">{r.label}</p>
                            <p className="text-lg font-semibold text-neutral-900 dark:text-white">{r.value}</p>
                            <p className="text-[10px] text-neutral-400 mt-1">{r.detail}</p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">活跃度诊断</p>
                        <div className="space-y-2 text-sm">
                          {partner.pipeline.registered > 0 ? (
                            <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">交易活跃度健康——近30天有交易进展，高于同级伙伴均值</span></div>
                          ) : (
                            <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">交易活跃度偏低——近期无交易进展，建议主动触达了解情况</span></div>
                          )}
                          {ecosystemPartners.length > 2 ? (
                            <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">协作活跃度优秀——{ecosystemPartners.length}个活跃生态协作关系，网络效应显著</span></div>
                          ) : (
                            <div className="flex items-start gap-2"><Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">协作活跃度一般——{ecosystemPartners.length}个生态协作关系，建议拓展合作网络</span></div>
                          )}
                          {partner.enablement.expiryRiskCount > 0 ? (
                            <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">赋能活跃度存在风险——{partner.enablement.expiryRiskCount}人认证即将过期，可能影响下季度报备优先级</span></div>
                          ) : (
                            <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">赋能活跃度健康——{partner.enablement.certifiedEngineers}人认证有效，能力储备充足</span></div>
                          )}
                          {mdfPct > 50 ? (
                            <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">营销活跃度良好——MDF使用率{mdfPct}%，联合营销投入充足</span></div>
                          ) : mdfPct > 20 ? (
                            <div className="flex items-start gap-2"><Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">营销活跃度可提升——MDF使用率{mdfPct}%，建议加大联合营销投入</span></div>
                          ) : (
                            <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /><span className="text-neutral-600 dark:text-neutral-400">营销活跃度不足——MDF使用率{mdfPct}%，建议制定营销计划</span></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 3: 绩效评估
              ══════════════════════════════════════════════ */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[
                  { label: '综合评分', score: scores.overall, max: 100, benchmark: scores.tierBenchmark },
                  { label: '活跃度', score: scores.activity, max: 100, benchmark: 65 },
                  { label: '能力值', score: scores.capability, max: 100, benchmark: 70 },
                  { label: '忠诚度', score: scores.loyalty, max: 100, benchmark: 55 },
                  { label: 'Pipeline', score: scores.pipelineHealth, max: 100, benchmark: 60 },
                  { label: '增长力', score: Math.max(0, scores.growth), max: 50, benchmark: 25 },
                ].map((m) => (
                  <Card key={m.label}>
                    <div className="text-center">
                      <Gauge score={m.score} label={m.label} max={m.max} />
                      <div className="mt-2 flex items-center justify-center gap-1 text-[10px]">
                        <span className="text-neutral-400">同级均值</span>
                        <span className={cn('font-semibold', m.score >= m.benchmark ? 'text-emerald-600' : 'text-amber-600')}>{m.benchmark}</span>
                        <span className={m.score >= m.benchmark ? 'text-emerald-500' : 'text-amber-500'}>{m.score >= m.benchmark ? '↑' : '↓'}{Math.abs(m.score - m.benchmark)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader><CardTitle>多维评估矩阵</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">评估维度</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">得分</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">同级均值</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">排名</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">趋势</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">评价</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {[
                          { dim: '营收贡献', score: 88, benchmark: 72, rank: 'Top 15%', trend: 12, note: '远超同级均值，是区域营收核心引擎' },
                          { dim: '商机转化', score: 68, benchmark: 70, rank: 'Top 45%', trend: -3, note: '方案→商务环节存在瓶颈，需优化' },
                          { dim: '客户满意度', score: 92, benchmark: 78, rank: 'Top 8%', trend: 5, note: '客户续约率95%，NPS得分行业领先' },
                          { dim: '技术能力', score: 75, benchmark: 68, rank: 'Top 30%', trend: 8, note: '认证覆盖率高，但AI新赛道不足' },
                          { dim: '生态贡献', score: 85, benchmark: 55, rank: 'Top 10%', trend: 15, note: '网络枢纽价值突出，协作产出高' },
                          { dim: '创新投入', score: 60, benchmark: 45, rank: 'Top 35%', trend: 10, note: '参与联合产品定义，创新意愿强' },
                        ].map((r, i) => (
                          <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="py-3 px-4 font-medium text-neutral-900 dark:text-white">{r.dim}</td>
                            <td className="py-3 px-4 text-center"><span className={cn('font-semibold', r.score >= 80 ? 'text-emerald-600' : r.score >= 60 ? 'text-amber-600' : 'text-red-500')}>{r.score}</span></td>
                            <td className="py-3 px-4 text-center text-neutral-400">{r.benchmark}</td>
                            <td className="py-3 px-4 text-center"><Badge variant={r.rank.includes('Top 2') ? 'success' : r.rank.includes('Top 5') ? 'info' : 'default'} size="sm">{r.rank}</Badge></td>
                            <td className="py-3 px-4 text-center"><span className={cn('text-xs font-semibold', r.trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>{r.trend >= 0 ? '↑' : '↓'}{Math.abs(r.trend)}%</span></td>
                            <td className="py-3 px-4 text-xs text-neutral-500">{r.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 4: 意愿度 (Willingness)
              ══════════════════════════════════════════════ */}
          {activeTab === 'willingness' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>意愿度评估</CardTitle><Badge variant="info" size="sm">Mindshare 心智份额</Badge></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl">
                        <div>
                          <p className="text-sm text-neutral-500">综合意愿度得分</p>
                          <p className="text-3xl font-bold text-blue-600 mt-1">82</p>
                        </div>
                        <div className="w-20 h-20">
                          <svg viewBox="0 0 80 80" className="w-full h-full">
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#e4e4e7" strokeWidth="8"/>
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray={`${82 * 1.88} 188`} strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">资源投入意愿</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{width: '90%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">90%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">资金投入意愿</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{width: '65%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-amber-600">65%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">响应速度</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{width: '85%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">85%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">目标承诺度</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{width: '78%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-blue-600">78%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">培训参与度</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{width: '92%'}}></div>
                            </div>
                            <span className="text-sm font-semibold text-purple-600">92%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-neutral-900 mb-2">评估解读</h4>
                          <p className="text-sm text-neutral-600 leading-relaxed">该伙伴意愿度较高，表现出强烈的合作积极性。特别在培训参与和资源投入方面表现突出，显示出对厂商产品的高度认可。建议重点培养，可考虑纳入核心合作伙伴计划。</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">近期表现趋势</CardTitle></CardHeader>
                        <CardContent>
                          <div className="flex items-end justify-between h-24 gap-2">
                            {[65, 72, 68, 78, 82, 79].map((val, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t" style={{height: `${val * 0.8}px`, backgroundColor: val >= 75 ? '#2563eb' : '#cbd5e1'}}></div>
                                <span className="text-[10px] text-neutral-400">{['1月','2月','3月','4月','5月','6月'][i]}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">提升建议</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">建议在QBR中引导设定更高的业绩目标，提升承诺水平</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">资金投入意愿有提升空间，可探讨更多联合营销机会</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 5: 能力度 (Capability)
              ══════════════════════════════════════════════ */}
          {activeTab === 'capability' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>能力度评估</CardTitle><Badge variant="success" size="sm">硬实力</Badge></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-xl">
                        <div>
                          <p className="text-sm text-neutral-500">综合能力得分</p>
                          <p className="text-3xl font-bold text-emerald-600 mt-1">76</p>
                        </div>
                        <div className="w-20 h-20">
                          <svg viewBox="0 0 80 80" className="w-full h-full">
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#e4e4e7" strokeWidth="8"/>
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray={`${76 * 1.88} 188`} strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-neutral-900 dark:text-white">12</p>
                          <p className="text-xs text-neutral-500 mt-1">认证工程师</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-emerald-600">94%</p>
                          <p className="text-xs text-neutral-500 mt-1">实施成功率</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-blue-600">68%</p>
                          <p className="text-xs text-neutral-500 mt-1">赢单率</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-purple-600">95%</p>
                          <p className="text-xs text-neutral-500 mt-1">客户续约率</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">销售能力</span>
                          <span className="text-sm font-semibold text-blue-600">72%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">技术能力</span>
                          <span className="text-sm font-semibold text-emerald-600">85%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">交付服务能力</span>
                          <span className="text-sm font-semibold text-purple-600">92%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">市场拓展能力</span>
                          <span className="text-sm font-semibold text-amber-600">65%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-0">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-neutral-900 mb-2">评估解读</h4>
                          <p className="text-sm text-neutral-600 leading-relaxed">该伙伴技术能力和交付服务能力突出，拥有12名认证工程师，实施成功率达94%。销售能力有提升空间，建议加强销售培训和商机跟进技巧。</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">能力雷达图</CardTitle></CardHeader>
                        <CardContent>
                          <div className="flex justify-center">
                            <div className="w-48 h-48 relative">
                              <svg viewBox="0 0 100 100" className="w-full h-full">
                                {[0.3, 0.5, 0.7, 0.9].map((scale, si) => (
                                  <polygon key={si} points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="#e4e4e7" strokeWidth="0.5" transform={`scale(${scale})`} style={{ transformOrigin: "50% 50%" }}/>
                                ))}
                                {[0, 60, 120, 180, 240, 300].map((angle, ai) => {
                                  const rad = (angle * Math.PI) / 180;
                                  return <line key={ai} x1="50" y1="50" x2={50 + 40 * Math.cos(rad)} y2={50 + 40 * Math.sin(rad)} stroke="#e4e4e7" strokeWidth="0.5"/>;
                                })}
                                {['销售','技术','交付','市场','客服','创新'].map((label, li) => {
                                  const rad = ((li * 60 - 90) * Math.PI) / 180;
                                  const x = 50 + 48 * Math.cos(rad);
                                  const y = 50 + 48 * Math.sin(rad);
                                  return <text key={li} x={x} y={y} textAnchor="middle" fontSize="8" fill="#6b7280">{label}</text>;
                                })}
                                <polygon points="50,15 77,28 82,55 70,82 30,82 25,55 38,28" fill="rgba(5,150,105,0.15)" stroke="#059669" strokeWidth="1.5"/>
                                {[70,85,92,65,88,75].map((val, vi) => {
                                  const rad = ((vi * 60 - 90) * Math.PI) / 180;
                                  const x = 50 + (val / 100) * 40 * Math.cos(rad);
                                  const y = 50 + (val / 100) * 40 * Math.sin(rad);
                                  return <circle key={vi} cx={x} cy={y} r="2" fill="#059669"/>;
                                })}
                              </svg>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">能力短板</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">市场拓展能力较弱，建议增加市场活动策划培训</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">技术能力突出，可考虑认证为技术服务合作伙伴</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 6: 业务契合度 (Business Fit)
              ══════════════════════════════════════════════ */}
          {activeTab === 'businessFit' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>业务契合度评估</CardTitle><Badge variant="warning" size="sm">战略匹配</Badge></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-xl">
                        <div>
                          <p className="text-sm text-neutral-500">综合契合度得分</p>
                          <p className="text-3xl font-bold text-purple-600 mt-1">88</p>
                        </div>
                        <div className="w-20 h-20">
                          <svg viewBox="0 0 80 80" className="w-full h-full">
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#e4e4e7" strokeWidth="8"/>
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#7c3aed" strokeWidth="8" strokeDasharray={`${88 * 1.88} 188`} strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-emerald-600">92%</p>
                          <p className="text-xs text-neutral-500 mt-1">客群重合度</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-blue-600">85%</p>
                          <p className="text-xs text-neutral-500 mt-1">产品互补度</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-purple-600">88%</p>
                          <p className="text-xs text-neutral-500 mt-1">模式相似度</p>
                        </div>
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
                          <p className="text-2xl font-bold text-amber-600">78%</p>
                          <p className="text-xs text-neutral-500 mt-1">地域覆盖匹配</p>
                        </div>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">客群画像分析</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-600">Enterprise级客户占比</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{width: '92%'}}></div>
                              </div>
                              <span className="text-sm font-semibold">92%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-600">政务行业客户占比</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{width: '75%'}}></div>
                              </div>
                              <span className="text-sm font-semibold">75%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-600">金融行业客户占比</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{width: '88%'}}></div>
                              </div>
                              <span className="text-sm font-semibold">88%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-neutral-900 mb-2">评估解读</h4>
                          <p className="text-sm text-neutral-600 leading-relaxed">该伙伴与厂商业务高度契合，客群画像重合度达92%，产品组合互补性强。双方商业模式相似，均以订阅制SaaS为主，合作协同效应显著。</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">产品组合分析</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-emerald-50/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-sm">安全软件代理</span>
                              </div>
                              <span className="text-xs font-semibold text-emerald-600">互补品</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-emerald-50/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-sm">云服务集成</span>
                              </div>
                              <span className="text-xs font-semibold text-emerald-600">互补品</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="text-sm">咨询服务</span>
                              </div>
                              <span className="text-xs font-semibold text-blue-600">中性</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-50/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="text-sm">竞品A代理</span>
                              </div>
                              <span className="text-xs font-semibold text-red-600">竞品</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">合作建议</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">高度契合，建议深化战略合作，拓展联合解决方案</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">存在竞品代理，需关注合作深度和排他性</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 7: 符合度 (Compliance)
              ══════════════════════════════════════════════ */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>符合度评估</CardTitle><Badge variant="danger" size="sm">合规与底线</Badge></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl">
                        <div>
                          <p className="text-sm text-neutral-500">综合符合度得分</p>
                          <p className="text-3xl font-bold text-amber-600 mt-1">95</p>
                        </div>
                        <div className="w-20 h-20">
                          <svg viewBox="0 0 80 80" className="w-full h-full">
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#e4e4e7" strokeWidth="8"/>
                            <circle cx="40" cy="40" r="30" fill="none" stroke="#d97706" strokeWidth="8" strokeDasharray={`${95 * 1.88} 188`} strokeLinecap="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <Card className="bg-emerald-50/30 border-emerald-200">
                        <CardContent className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600"/>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">资质审核通过</p>
                            <p className="text-xs text-neutral-500">公司资质齐全，无违规记录</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">资质合规</span>
                          <span className="text-sm font-semibold text-emerald-600">100%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">规则遵守</span>
                          <span className="text-sm font-semibold text-emerald-600">98%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">业绩达标率</span>
                          <span className="text-sm font-semibold text-blue-600">88%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <span className="text-sm">投诉率</span>
                          <span className="text-sm font-semibold text-emerald-600">0%</span>
                        </div>
                      </div>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">资质信息</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">注册资本</span>
                            <span className="font-medium">500万元</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">成立年限</span>
                            <span className="font-medium">8年</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">信用等级</span>
                            <span className="font-medium text-emerald-600">A级</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-500">黑名单状态</span>
                            <span className="font-medium text-emerald-600">无记录</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-4">
                      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-neutral-900 mb-2">评估解读</h4>
                          <p className="text-sm text-neutral-600 leading-relaxed">该伙伴合规表现优秀，资质齐全，无违规记录。业绩达标率88%，接近金牌伙伴门槛。建议在QBR中讨论提升业绩目标，冲击更高等级。</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">违规记录</CardTitle></CardHeader>
                        <CardContent className="text-center py-8">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3"/>
                          <p className="text-sm font-medium text-neutral-900">暂无违规记录</p>
                          <p className="text-xs text-neutral-500 mt-1">合作期间表现良好</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">等级达标情况</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-neutral-500">当前等级</span>
                                <span className="font-medium text-amber-600">金牌</span>
                              </div>
                              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{width: '88%'}}></div>
                              </div>
                              <div className="flex justify-between text-xs text-neutral-400 mt-1">
                                <span>当前: 88%</span>
                                <span>目标: 100%</span>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500">距离白金等级还差 ¥200万 业绩</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">合规建议</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">合规表现优秀，继续保持</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                            <p className="text-xs text-neutral-600">业绩达标率接近门槛，建议制定提升计划</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 8: 合作机会
              ══════════════════════════════════════════════ */}
          {activeTab === 'opportunity' && (
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>合作突破口识别</CardTitle><Badge variant="info" size="sm">AI 推荐</Badge></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {breakthroughs.map((b, i) => <Breakthrough key={i} {...b} />)}
                  </div>
                </CardContent>
              </Card>

              {/* ── 能力画像总览 ─────────────────────────── */}
              <Card>
                <CardHeader>
                  <CardTitle>能力画像</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">技术域 × 行业覆盖</span>
                    <div className="relative group/ml">
                      <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help inline-flex">?</span>
                      <div className="absolute right-0 top-5 w-64 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                        能力画像从两个维度评估：<b>技术成熟度</b>（传统/云/AI/安全/数据/服务 6域）和<b>行业覆盖度</b>（医疗/政务/金融/制造/教育）。圆的填充比例=该领域的自主交付能力。
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Hexagonal Capability Map */}
                    <div className="lg:col-span-2 flex items-center justify-center">
                      <div className="relative w-64 h-64">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          {/* Background hexagon grid */}
                          {[0.3, 0.55, 0.8].map((scale, si) => (
                            <polygon key={si} points="100,15 180,55 180,125 100,165 20,125 20,55"
                              fill="none" stroke="#e4e4e7" strokeWidth="0.5"
                              transform={`scale(${scale})`} transform-origin="100 90" />
                          ))}
                          {/* Axes */}
                          {[0, 60, 120, 180, 240, 300].map((angle, ai) => {
                            const rad = (angle * Math.PI) / 180;
                            return <line key={ai} x1="100" y1="90" x2={100 + 75 * Math.cos(rad)} y2={90 + 75 * Math.sin(rad)} stroke="#e4e4e7" strokeWidth="0.5" />;
                          })}
                          {/* Capability shape */}
                          {[
                            { name: '传统IT', value: 85, angle: 300, color: '#52525b' },
                            { name: '云原生', value: 90, angle: 0, color: '#2563eb' },
                            { name: 'AI/ML', value: 25, angle: 60, color: '#dc2626' },
                            { name: '安全', value: 45, angle: 120, color: '#d97706' },
                            { name: '数据', value: 80, angle: 180, color: '#059669' },
                            { name: '服务', value: 70, angle: 240, color: '#7c3aed' },
                          ].map((cap) => {
                            const rad = (cap.angle * Math.PI) / 180;
                            const points = [
                              { name: '传统IT', value: 85, angle: 300 },
                              { name: '云原生', value: 90, angle: 0 },
                              { name: 'AI/ML', value: 25, angle: 60 },
                              { name: '安全', value: 45, angle: 120 },
                              { name: '数据', value: 80, angle: 180 },
                              { name: '服务', value: 70, angle: 240 },
                            ].map((p) => {
                              const r = (p.angle * Math.PI) / 180;
                              const dist = 15 + (p.value / 100) * 65;
                              return `${100 + dist * Math.cos(r)},${90 + dist * Math.sin(r)}`;
                            }).join(' ');
                            return <polygon key={cap.name} points={points} fill="rgba(37,99,235,0.08)" stroke="#2563eb" strokeWidth="1.5" />;
                          })}
                          {/* Data points + labels */}
                          {[
                            { name: '传统IT', value: 85, angle: 300, color: '#52525b' },
                            { name: '云原生', value: 90, angle: 0, color: '#2563eb' },
                            { name: 'AI/ML', value: 25, angle: 60, color: '#dc2626' },
                            { name: '安全', value: 45, angle: 120, color: '#d97706' },
                            { name: '数据', value: 80, angle: 180, color: '#059669' },
                            { name: '服务', value: 70, angle: 240, color: '#7c3aed' },
                          ].map((cap) => {
                            const rad = (cap.angle * Math.PI) / 180;
                            const dist = 15 + (cap.value / 100) * 65;
                            const cx = 100 + dist * Math.cos(rad);
                            const cy = 90 + dist * Math.sin(rad);
                            const lx = 100 + 80 * Math.cos(rad);
                            const ly = 90 + 80 * Math.sin(rad);
                            const capFill = cap.value >= 70 ? '#059669' : cap.value >= 40 ? '#d97706' : '#dc2626';
                            return (
                              <g key={cap.name}>
                                <circle cx={cx} cy={cy} r="4" fill={capFill} stroke="white" strokeWidth="2" />
                                <text x={lx} y={ly} textAnchor="middle" fontSize="9" fontWeight={600} fill="#888" dy={cap.angle === 0 ? -6 : cap.angle === 180 ? 14 : 4}>
                                  {cap.name}
                                </text>
                                <text x={lx} y={ly} textAnchor="middle" fontSize="8" fill={capFill} dy={cap.angle === 0 ? 6 : cap.angle === 180 ? 24 : 14}>
                                  {cap.value}%
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>

                    {/* Right: Industry × Capability Matrix + Detail */}
                    <div className="lg:col-span-3 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-neutral-500 mb-2">行业 × 技术能力覆盖矩阵</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                <th className="text-left py-2 px-2 font-medium text-neutral-400">行业</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">传统IT</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">云原生</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">AI/ML</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">安全</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">数据</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">服务</th>
                                <th className="text-center py-2 px-2 font-medium text-neutral-400">覆盖度</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const industryCoverage: Record<string, {cells: number[], coverage: number}> = {
                                  '医疗': { cells: [1,1,0.3,0.5,1,1], coverage: 75 },
                                  '政务': { cells: [1,1,0.2,0.3,1,0.5], coverage: 60 },
                                  '金融': { cells: [0.8,0.7,0.2,0.8,0.7,0.6], coverage: 65 },
                                  '制造': { cells: [0.9,0.6,0.3,0.5,0.6,0.4], coverage: 55 },
                                  '教育': { cells: [0.7,0.5,0.2,0.4,0.5,0.3], coverage: 43 },
                                  '零售': { cells: [0.6,0.8,0.4,0.6,0.7,0.5], coverage: 60 },
                                };
                                const baseIndustries = ['医疗', '政务', '金融', '制造', '教育'];
                                return baseIndustries.map(industry => {
                                  const data = industryCoverage[industry] || { cells: [0.5,0.5,0.2,0.4,0.5,0.4], coverage: 43 };
                                  // 如果是合作伙伴所在行业，适当提升覆盖度
                                  if (industry === partner.industry) {
                                    return { 
                                      industry, 
                                      cells: data.cells.map(c => Math.min(1, c + 0.2)), 
                                      coverage: Math.min(100, data.coverage + 15) 
                                    };
                                  }
                                  return { industry, ...data };
                                });
                              })().map((row, ri) => (
                                <tr key={ri} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                  <td className="py-2.5 px-2 font-medium text-neutral-700 dark:text-neutral-300">{row.industry}</td>
                                  {row.cells.map((v, ci) => (
                                    <td key={ci} className="py-2.5 px-2 text-center">
                                      <div className={cn('w-5 h-5 rounded mx-auto', v === 1 ? 'bg-emerald-500' : v >= 0.5 ? 'bg-amber-400' : 'bg-neutral-200 dark:bg-neutral-700')}
                                        title={v === 1 ? '自主交付' : v >= 0.5 ? '协作交付' : '未覆盖'} />
                                    </td>
                                  ))}
                                  <td className="py-2.5 px-2 text-center">
                                    <span className={cn('text-xs font-semibold', row.coverage >= 60 ? 'text-emerald-600' : row.coverage >= 30 ? 'text-amber-600' : 'text-red-500')}>
                                      {row.coverage}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-400">
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500" /> 自主交付</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-400" /> 协作交付</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-neutral-200 dark:bg-neutral-700" /> 未覆盖</span>
                        </div>
                      </div>

                      {/* Gap-specific callouts */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-xs font-semibold text-red-700 dark:text-red-400">最大缺口</span>
                          </div>
                          <p className="text-[11px] text-red-600 dark:text-red-300">AI/ML能力仅25%——医疗+政务行业均未覆盖，竞品AWS已抢占先机</p>
                        </div>
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">待加强</span>
                          </div>
                          <p className="text-[11px] text-amber-600 dark:text-amber-300">安全能力45%依赖生态协作——金融行业合规要求高，自主能力是准入门槛</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── 客户拓展建议 ─────────────────────────── */}
              <Card>
                <CardHeader><CardTitle>行业拓展路径</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(() => {
                      const industryRecommendations: Record<string, {target: string, detail: string, cases: string, priority: string, capability: string}[]> = {
                        '医疗': [
                          { target: '医疗行业深耕', detail: '3个独家客户→撬动同区域标杆', cases: '积水潭医院、华山医院', priority: '高', capability: '云原生+数据' },
                          { target: 'AI医疗联合方案', detail: '与上海智医ISV联合打造', cases: '瑞金丢标复盘→差异化', priority: '高', capability: '需生态协作补全' },
                          { target: '医药企业拓展', detail: '药企数字化转型机遇', cases: '国药、上药集团', priority: '中', capability: '数据+云原生' },
                          { target: '医疗器械智能化', detail: 'AI辅助诊断方案', cases: '迈瑞、联影', priority: '中', capability: 'AI+数据缺口' },
                        ],
                        '政务': [
                          { target: '政务行业扩展', detail: '卫健委→人社局、医保局', cases: '数据平台+云原生组合', priority: '高', capability: '数据+云原生' },
                          { target: '智慧城市建设', detail: '城市大脑项目机会', cases: '市级项目招标', priority: '高', capability: '云原生+安全' },
                          { target: '数据中台建设', detail: '政务数据共享平台', cases: '省级大数据局', priority: '中', capability: '数据+安全' },
                          { target: '数字政府升级', detail: '一网通办深化', cases: '政务服务中心', priority: '中', capability: '服务+云原生' },
                        ],
                        '金融': [
                          { target: '金融行业突破', detail: '首个标杆→城商行、保险', cases: '需补安全+AI能力', priority: '高', capability: '安全+AI缺口' },
                          { target: '银行数字化', detail: '核心系统云迁移', cases: '股份制银行', priority: '高', capability: '云原生+安全' },
                          { target: '保险科技', detail: 'AI核保理赔方案', cases: '头部保险公司', priority: '中', capability: 'AI+数据' },
                          { target: '证券数字化', detail: '交易系统升级', cases: '券商总部', priority: '中', capability: '安全+数据' },
                        ],
                        '制造': [
                          { target: '制造行业深耕', detail: '工业互联网平台落地', cases: '三一重工、海尔', priority: '高', capability: '云原生+数据' },
                          { target: '智能工厂建设', detail: '数字化车间改造', cases: '比亚迪、宁德时代', priority: '高', capability: 'AI+边缘计算' },
                          { target: '供应链数字化', detail: '上下游协同平台', cases: '大型制造集团', priority: '中', capability: '数据+云原生' },
                          { target: '质量检测AI', detail: '视觉检测方案', cases: '电子制造企业', priority: '中', capability: 'AI+数据缺口' },
                        ],
                        '教育': [
                          { target: '教育云平台', detail: '高校数字化升级', cases: '双一流大学', priority: '高', capability: '云原生+服务' },
                          { target: '智慧校园', detail: '教学管理一体化', cases: '职业院校', priority: '高', capability: '数据+服务' },
                          { target: '在线教育', detail: 'AI助教方案', cases: '教育科技公司', priority: '中', capability: 'AI+云原生' },
                          { target: '教育数据中台', detail: '学情分析平台', cases: '教育局', priority: '中', capability: '数据+服务' },
                        ],
                        '零售': [
                          { target: '零售数字化', detail: '全渠道融合方案', cases: '连锁商超', priority: '高', capability: '云原生+数据' },
                          { target: '智慧门店', detail: 'AI导购+无人零售', cases: '电商平台', priority: '高', capability: 'AI+边缘' },
                          { target: '供应链优化', detail: '库存预测系统', cases: '快消品牌', priority: '中', capability: '数据+AI' },
                          { target: '会员营销', detail: '精准营销平台', cases: '零售集团', priority: '中', capability: '数据+服务' },
                        ],
                      };
                      return industryRecommendations[partner.industry || '医疗'] || industryRecommendations['医疗'];
                    })().map((t) => (
                      <div key={t.target} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white">{t.target}</span>
                          <Badge variant={t.priority === '高' ? 'danger' : 'warning'} size="sm">{t.priority}</Badge>
                        </div>
                        <p className="text-xs text-neutral-500 mb-2">{t.detail}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-400">靶向:</span>
                          <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">{t.cases}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5">
                          <span className="text-[10px] text-neutral-400">所需能力:</span>
                          <Badge variant={t.capability.includes('缺口') ? 'danger' : t.capability.includes('协作') ? 'warning' : 'info'} size="sm">{t.capability}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 5: 人员管理
              ══════════════════════════════════════════════ */}
          {activeTab === 'staff' && (
            <StaffManagementTab partnerId={partner.id} />
          )}

          {/* ══════════════════════════════════════════════
              TAB 7: 关系档案
              ══════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Layered Info + Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle>基本信息</CardTitle><div className="flex gap-2">{isEditing ? <><Button variant="brand" size="sm" onClick={handleSave}>保存</Button><Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>取消</Button></> : <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>编辑</Button>}</div></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="名称（中文）" value={formData.name} onChange={(e) => dispatch({ type: 'SET', field: 'name', value: e.target.value })} disabled={!isEditing} />
                        <Input label="名称（英文）" value={formData.englishName || ''} onChange={(e) => dispatch({ type: 'SET', field: 'englishName', value: e.target.value })} disabled={!isEditing} />
                        <Input label="网址" value={formData.website || ''} onChange={(e) => dispatch({ type: 'SET', field: 'website', value: e.target.value })} disabled={!isEditing} />
                        <Input label="信用代码" value={formData.unifiedSocialCreditCode} onChange={(e) => dispatch({ type: 'SET', field: 'unifiedSocialCreditCode', value: e.target.value })} disabled={!isEditing} />
                        <Select label="类型" options={(config?.partnerTypes || [formData.type]).map(v=>({value:v,label:v}))} value={formData.type} onChange={(e) => dispatch({ type: 'SET', field: 'type', value: e.target.value })} disabled={!isEditing} />
                        <Select label="等级" options={(config?.partnerTiers || [formData.tier]).map(v=>({value:v,label:v}))} value={formData.tier} onChange={(e) => dispatch({ type: 'SET', field: 'tier', value: e.target.value })} disabled={!isEditing} />
                        <Select label="状态" options={STATUS_OPTIONS} value={formData.status} onChange={(e) => dispatch({ type: 'SET', field: 'status', value: e.target.value })} disabled={!isEditing} />
                        <Input label="加入日期" type="date" value={formData.startDate} onChange={(e) => dispatch({ type: 'SET', field: 'startDate', value: e.target.value })} disabled={!isEditing} />
                        <Select label="行业" options={(config?.industries || [formData.industry]).map(v=>({value:v,label:v}))} value={formData.industry} onChange={(e) => dispatch({ type: 'SET', field: 'industry', value: e.target.value })} disabled={!isEditing} />
                        {isEditing ? (
                          <RegionCascader label="所在地区" value={{ province: formData.province, city: formData.city, district: formData.district }} onChange={(v) => { dispatch({ type: 'SET', field: 'province', value: v.province }); dispatch({ type: 'SET', field: 'city', value: v.city }); dispatch({ type: 'SET', field: 'district', value: v.district }); }} />
                        ) : (
                          <Input label="所在地区" value={[formData.province, formData.city, formData.district].filter(Boolean).join(' · ') || '-'} disabled />
                        )}
                        <div className="col-span-2"><Input label="详细地址" value={formData.location || ''} onChange={(e) => dispatch({ type: 'SET', field: 'location', value: e.target.value })} disabled={!isEditing} /></div>
                        <div className="col-span-2"><Input label="注册地址" value={formData.registeredAddress || ''} onChange={(e) => dispatch({ type: 'SET', field: 'registeredAddress', value: e.target.value })} disabled={!isEditing} /></div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">合作范围</label>
                          <textarea className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm resize-none disabled:bg-neutral-50 dark:disabled:bg-neutral-800/50 focus:outline-none focus:ring-2 focus:ring-brand/20" rows={2} value={formData.cooperationScope} onChange={(e) => dispatch({ type: 'SET', field: 'cooperationScope', value: e.target.value })} disabled={!isEditing} />
                        </div>
                        <div className="flex items-center gap-2"><input type="checkbox" id="isCore" checked={formData.isCorePartner} onChange={(e) => dispatch({ type: 'SET', field: 'isCorePartner', value: e.target.checked })} disabled={!isEditing} className="w-4 h-4 rounded" /><label htmlFor="isCore" className="text-sm cursor-pointer select-none">核心合作伙伴</label></div>
                      </div>
                      {isEditing && <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800"><Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>取消</Button><Button variant="brand" size="sm" onClick={handleSave}><Save className="w-4 h-4" />保存</Button></div>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>主要联系人</CardTitle></CardHeader>
                    <CardContent>
                      {primaryContact ? (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">{primaryContact.lastName?.charAt(0) || '?'}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-white">{primaryContact.lastName}{primaryContact.firstName}</p>
                            <p className="text-xs text-neutral-500">{primaryContact.title || '-'}{primaryContact.department ? ` · ${primaryContact.department}` : ''}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-neutral-400">
                              {primaryContact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{primaryContact.phone}</span>}
                              {primaryContact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{primaryContact.email}</span>}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-400 py-2">暂无联系人</p>
                      )}
                      <button onClick={() => setActiveTab('staff')} className="mt-3 text-xs text-blue-600 hover:underline">查看全部人员 →</button>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <PartnerTimeline
                    key={partner.id + (partner.milestones?.length || 0)}
                    events={(partner.milestones || []).map((m: any) => ({ id: m.id || Date.now().toString(), type: m.stage || m.type || 'milestone', title: m.title || m.event || '', description: m.desc || m.description || '', date: m.date || m.year || '', operator: m.operator || '' }))}
                    partnerName={partner.name}
                    onUpdateEvents={async (events) => {
                      const milestones = events.map(e => ({ id: e.id, stage: e.type, title: e.title, description: e.description || '', date: e.date, operator: e.operator || '', year: e.date?.split('-')[0] || '' }));
                      await supabase.from('partners').update({ milestones }).eq('id', partner.id);
                      updatePartner({ ...partner, milestones } as any);
                    }}
                  />

                </div>
              </div>

              {/* Key Customers */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>重要客户</CardTitle><p className="text-xs text-neutral-400 mt-0.5">{keyCustomers.length} 家客户 · {keyCustomers.reduce((s:number,c:any)=>s+(c.annualRevenue||0),0)>0?'总额 '+cur(keyCustomers.reduce((s:number,c:any)=>s+(c.annualRevenue||0),0)):''}</p></div>
                  <Button variant="ghost" size="sm" onClick={() => { setShowCustomerForm(!showCustomerForm); setEditingCustomer(null); }}><Plus className="w-3.5 h-3.5" />添加</Button>
                </CardHeader>
                <CardContent>
                  {(showCustomerForm || editingCustomer) && (
                    <div className="p-3 mb-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs font-semibold mb-2">{editingCustomer ? '编辑客户' : '添加客户'}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <Input value={editingCustomer ? editForm.name : newCustomer.name} onChange={e => editingCustomer ? setEditForm({...editForm, name: e.target.value}) : setNewCustomer({...newCustomer, name: e.target.value})} placeholder="客户名称 *" />
                        <Input value={editingCustomer ? editForm.industry : newCustomer.industry} onChange={e => editingCustomer ? setEditForm({...editForm, industry: e.target.value}) : setNewCustomer({...newCustomer, industry: e.target.value})} placeholder="行业" />
                        <Select value={editingCustomer ? editForm.relationship : newCustomer.relationship} options={[{value:'战略合作',label:'战略合作'},{value:'合作中',label:'合作中'},{value:'潜在客户',label:'潜在客户'},{value:'跟进中',label:'跟进中'},{value:'已流失',label:'已流失'}]} onChange={e => editingCustomer ? setEditForm({...editForm, relationship: e.target.value}) : setNewCustomer({...newCustomer, relationship: e.target.value})} />
                        <Input type="number" value={editingCustomer ? (editForm.annualRevenue||'') : (newCustomer.annualRevenue||'')} onChange={e => editingCustomer ? setEditForm({...editForm, annualRevenue: Number(e.target.value)}) : setNewCustomer({...newCustomer, annualRevenue: Number(e.target.value)})} placeholder="年合作额" />
                        <Input value={editingCustomer ? editForm.salesLead : newCustomer.salesLead} onChange={e => editingCustomer ? setEditForm({...editForm, salesLead: e.target.value}) : setNewCustomer({...newCustomer, salesLead: e.target.value})} placeholder="销售负责人" />
                        <Input value={editingCustomer ? editForm.productsStr : newCustomer.productsStr || ''} onChange={e => editingCustomer ? setEditForm({...editForm, productsStr: e.target.value}) : setNewCustomer({...newCustomer, productsStr: e.target.value})} placeholder="产品/方案（逗号分隔）" />
                        <Input value={editingCustomer ? editForm.majorProjectsStr : newCustomer.majorProjectsStr || ''} onChange={e => editingCustomer ? setEditForm({...editForm, majorProjectsStr: e.target.value}) : setNewCustomer({...newCustomer, majorProjectsStr: e.target.value})} placeholder="重点项目（逗号分隔）" />
                        <Input value={editingCustomer ? editForm.contactPerson : newCustomer.contactPerson} onChange={e => editingCustomer ? setEditForm({...editForm, contactPerson: e.target.value}) : setNewCustomer({...newCustomer, contactPerson: e.target.value})} placeholder="客户联系人" />
                        <Input value={editingCustomer ? editForm.contactPhone : newCustomer.contactPhone} onChange={e => editingCustomer ? setEditForm({...editForm, contactPhone: e.target.value}) : setNewCustomer({...newCustomer, contactPhone: e.target.value})} placeholder="联系电话" />
                        <Select value={editingCustomer ? editForm.status : newCustomer.status} options={[{value:'在服',label:'在服'},{value:'POC',label:'POC'},{value:'商务',label:'商务'},{value:'跟进中',label:'跟进中'},{value:'丢标',label:'丢标'}]} onChange={e => editingCustomer ? setEditForm({...editForm, status: e.target.value}) : setNewCustomer({...newCustomer, status: e.target.value})} />
                      </div>
                      <div className="col-span-full mt-2">
                        <Input value={editingCustomer ? editForm.goals : newCustomer.goals} onChange={e => editingCustomer ? setEditForm({...editForm, goals: e.target.value}) : setNewCustomer({...newCustomer, goals: e.target.value})} placeholder="合作目标（如：完成HIS系统升级签约，实现AI诊断POC）" />
                      </div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => { setShowCustomerForm(false); setEditingCustomer(null); }}>取消</Button>
                        <Button variant="brand" size="sm" onClick={() => editingCustomer ? saveCustomerEdit() : addCustomer()}>{editingCustomer ? '保存修改' : '添加客户'}</Button>
                      </div>
                    </div>
                  )}
                  {keyCustomers.length === 0 ? (
                    <p className="text-sm text-neutral-400 py-4 text-center">暂无重要客户，点击"添加"录入</p>
                  ) : (
                    <div className="space-y-3">
                      {keyCustomers.map((c: any) => (
                        <CustomerCard key={c.id} customer={c} onEdit={(cust) => { setEditingCustomer(cust.id); const p = (cust.products||[]).join('，'); const m = (cust.majorProjects||[]).join('，'); setEditForm({...cust, productsStr: p, majorProjectsStr: m}); setShowCustomerForm(false); }} onDelete={removeCustomer} onAddProgress={async (custId, prog) => { const updated = keyCustomers.map(x => x.id===custId ? {...x, progress: [...(x.progress||[]), prog]} : x); await saveCustomers(updated); }} cur={cur} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Work Follow-ups */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>工作跟进</CardTitle><p className="text-xs text-neutral-400 mt-0.5">{followUps.length} 条记录 · {followUps.filter(f=>f.status==='已完结').length}完结 · {followUps.filter(f=>f.status==='进行中').length}进行中</p></div>
                  <Button variant="ghost" size="sm" onClick={() => { setShowFollowUpForm(!showFollowUpForm); setEditingFollowUp(null); }}><Plus className="w-3.5 h-3.5" />添加</Button>
                </CardHeader>
                <CardContent>
                  {(showFollowUpForm || editingFollowUp) && (
                    <div className="p-3 mb-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <p className="text-xs font-semibold mb-2">{editingFollowUp ? '编辑跟进' : '添加跟进'}</p>
                      <div className="space-y-2">
                        <Input value={newFollowUp.title} onChange={e => setNewFollowUp({...newFollowUp, title: e.target.value})} placeholder="标题 *" />
                        <div className="flex gap-2">
                          <Select value={newFollowUp.status} options={[{value:'草稿',label:'草稿'},{value:'进行中',label:'进行中'},{value:'已完结',label:'已完结'},{value:'放弃',label:'放弃'}]} onChange={e => setNewFollowUp({...newFollowUp, status: e.target.value})} />
                          <Input type="date" value={newFollowUp.date} onChange={e => setNewFollowUp({...newFollowUp, date: e.target.value})} />
                        </div>
                        <Input value={newFollowUp.desc} onChange={e => setNewFollowUp({...newFollowUp, desc: e.target.value})} placeholder="详细描述" />
                        <Input value={newFollowUp.nextStep} onChange={e => setNewFollowUp({...newFollowUp, nextStep: e.target.value})} placeholder="下一步计划" />
                      </div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button variant="secondary" size="sm" onClick={() => { setShowFollowUpForm(false); setEditingFollowUp(null); }}>取消</Button>
                        <Button variant="brand" size="sm" onClick={() => editingFollowUp ? saveFollowUpEdit() : addFollowUp()}>{editingFollowUp ? '保存' : '添加'}</Button>
                      </div>
                    </div>
                  )}
                  {followUps.length === 0 ? (
                    <p className="text-sm text-neutral-400 py-4 text-center">暂无工作跟进，点击"添加"记录</p>
                  ) : (
                    <div className="space-y-2">
                      {followUps.map((f: any) => (
                        <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 transition-colors">
                          <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${f.status==='已完结'?'bg-emerald-500':f.status==='进行中'?'bg-blue-500':f.status==='草稿'?'bg-neutral-400':'bg-red-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{f.title}</span>
                              <Badge variant={f.status==='已完结'?'success':f.status==='进行中'?'info':f.status==='草稿'?'default':'danger'} size="sm">{f.status}</Badge>
                              <span className="text-xs text-neutral-400">{f.date}</span>
                            </div>
                            {f.desc && <p className="text-xs text-neutral-500 mt-1">{f.desc}</p>}
                            {f.nextStep && <p className="text-xs text-blue-600 mt-0.5">→ {f.nextStep}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditingFollowUp(f.id); setNewFollowUp({ title: f.title, desc: f.desc||'', status: f.status, date: f.date, nextStep: f.nextStep||'' }); setShowFollowUpForm(false); }} className="p-1 text-neutral-400 hover:text-blue-500"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => removeFollowUp(f.id)} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB 8: 生态协作网络
              ══════════════════════════════════════════════ */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              {/* Network Position Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>网络位置分析</CardTitle>
                  <div className="relative group">
                    <button className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[11px] font-semibold text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors">?</button>
                    <div className="absolute right-0 top-6 w-72 p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      该伙伴处于生态网络的<b>结构洞</b>位置——连接了原本不互通的SI和ISV群体，因此享有<b>信息优势</b>（比别人更早知道机会）和<b>控制优势</b>（决定信息如何流动）。这种"桥梁"角色赋予其独特的生态定价权。
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hub-and-spoke diagram */}
                    <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                      <div className="relative w-48 h-48">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-neutral-900 dark:bg-white flex flex-col items-center justify-center text-white dark:text-neutral-900 z-10 shadow-lg">
                          <span className="text-[9px] font-semibold">本伙伴</span>
                          <span className="text-[8px] opacity-70">{partner.tier}</span>
                        </div>
                        {[
                          { label: '昆仑联通', type: 'SI', angle: -90, dist: 55, color: '#2563eb' },
                          { label: '精诚中国', type: 'Reseller', angle: -20, dist: 60, color: '#059669' },
                          { label: '上海智医', type: 'ISV', angle: 50, dist: 55, color: '#7c3aed' },
                          { label: '南京云帆', type: 'SI(子)', angle: 130, dist: 50, color: '#d97706' },
                          { label: '杭州智联', type: 'ISV(子)', angle: 200, dist: 55, color: '#0891b2' },
                        ].map((node) => {
                          const rad = (node.angle * Math.PI) / 180;
                          const cx = 50 + node.dist * Math.cos(rad) * 0.8;
                          const cy = 50 + node.dist * Math.sin(rad) * 0.8;
                          return (
                            <svg key={node.label} className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
                              <line x1="50%" y1="50%" x2={`${cx}%`} y2={`${cy}%`} stroke={node.color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                              <circle cx={`${cx}%`} cy={`${cy}%`} r="5" fill={node.color} opacity="0.8" />
                              <text x={`${cx}%`} y={`${cy + 5}%`} textAnchor="middle" fontSize="7" fill="#888">{node.label}</text>
                            </svg>
                          );
                        })}
                      </div>
                      <p className="text-xs text-neutral-500 mt-2 text-center">星型拓扑 · 该伙伴是网络中心节点</p>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                          <b>该伙伴处于网络的"桥梁"位置。</b>SI（昆仑联通）和ISV（上海智医）原本没有直接连接，而是通过该伙伴间接协作。这使得该伙伴不仅是一个交易中介，更是<b>信息枢纽和信任中介</b>——谁掌握连接，谁就掌握价值分配的话语权。
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">网络价值增长潜力</span>
                            <div className="relative group/ml">
                              <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help inline-flex">?</span>
                              <div className="absolute left-0 top-5 w-56 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                                网络价值与连接节点数的平方成正比。当前5节点=25单位价值，扩展到8节点将达到64单位(+156%)。
                              </div>
                            </div>
                          </div>
                          <p className="text-2xl font-semibold text-neutral-900 dark:text-white">+156%</p>
                          <p className="text-xs text-neutral-500 mt-1">5节点→8节点的预期价值增幅</p>
                        </div>
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">互补性评估</span>
                            <div className="relative group/ml">
                              <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help inline-flex">?</span>
                              <div className="absolute left-0 top-5 w-56 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                                创新商业化需要互补性资产。云原生方案(核心)+AI能力(互补)+分销渠道(互补)=完整的价值闭环。互补性越强，协作的不可替代性越高。
                              </div>
                            </div>
                          </div>
                          <p className="text-2xl font-semibold text-emerald-600">高</p>
                          <p className="text-xs text-neutral-500 mt-1">核心+AI+渠道形成完整闭环</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration Table */}
              <Card>
                <CardHeader><CardTitle>协作关系图谱</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">协作伙伴</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">关系类型</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">协作强度</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">协作产出</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">联合项目</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">协作逻辑 <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[9px] text-neutral-500 cursor-help">?</span></th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">放大建议</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {[
                          { ...ecosystemPartners[0], logic: 'SI提供客户关系 + 本伙伴提供技术方案 → 联合打单的交易成本远低于各自独立获客，这是典型的专业化分工带来的效率提升', amplify: '联合项目数从5个→10个，预计增量营收¥280万' },
                          { ...ecosystemPartners[1], logic: '双方存在相互依赖：精诚依赖本伙伴的产品授权，本伙伴依赖精诚的客户渠道。这种对称的相互依赖创造了最稳定的合作基础', amplify: '拓展安全+数据产品线，利用精诚的12个客户触点交叉销售' },
                          { ...ecosystemPartners[2], logic: '本伙伴的云原生方案(核心能力) + 上海智医的AI算法(稀缺能力) = 单一伙伴无法独立提供的完整AI医疗解决方案，协作的不可替代性极高', amplify: '联合参加Q3医疗峰会，预计产出5-8个高质量商机' },
                        ].map((ep, i) => (
                          <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#2563eb','#059669','#7c3aed'][i] }} />
                                <span className="font-medium text-neutral-900 dark:text-white">{ep.name}</span>
                              </div>
                              <p className="text-xs text-neutral-400 mt-0.5">{ep.type}</p>
                            </td>
                            <td className="py-4 px-4 text-center"><Badge variant={i===0?'primary':i===1?'success':'info'} size="sm">{ep.relation}</Badge></td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <ProgressBar value={ep.deals/0.15} size="sm" className="w-16" variant={ep.deals>=8?'brand':'default'} />
                                <span className="text-xs font-medium">{ep.deals>=8?'强':ep.deals>=4?'中':'弱'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right font-semibold">{cur(ep.volume)}</td>
                            <td className="py-4 px-4 text-center">{ep.deals} 个</td>
                            <td className="py-4 px-4 max-w-[220px]"><p className="text-xs text-neutral-500 leading-relaxed">{ep.logic}</p></td>
                            <td className="py-4 px-4 max-w-[200px]"><p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">{ep.amplify}</p></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Sub-partners */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>子合作伙伴</CardTitle>
                    <Button variant="secondary" size="sm"><Plus className="w-4 h-4" />新增</Button>
                  </CardHeader>
                  <CardContent>
                    {[
                      { id: 'sp1', name: '南京云帆科技有限公司', type: 'SI', contact: '周伟', phone: '13812345678', status: 'Active', role: '区域交付延伸——弥补华东二线城市覆盖', analysis: '自建华东二线交付团队成本约¥80万/年，子合作模式成本仅¥30万/年，节约63%。当交易频率低、资产专用性低时，外包优于内部化。' },
                      { id: 'sp2', name: '杭州智联信息技术有限公司', type: 'ISV', contact: '林芳', phone: '13987654321', status: 'Active', role: 'AI能力补全——弥补算法和模型开发短板', analysis: 'AI能力自建需2年+¥200万投入，子合作模式6个月即获得可用能力。当速度是首要竞争要素时，外部获取优于内部建设。' },
                    ].map((sp) => (
                      <div key={sp.id} className="py-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div><p className="text-sm font-medium text-neutral-900 dark:text-white">{sp.name}</p><p className="text-xs text-neutral-400">{sp.type} · {sp.contact} · {sp.phone}</p></div>
                          <Badge variant={sp.status === 'Active' ? 'success' : 'warning'} size="sm">{sp.status === 'Active' ? '活跃' : '非活跃'}</Badge>
                        </div>
                        <p className="text-xs text-neutral-500 mb-1">战略角色: {sp.role}</p>
                        <div className="flex items-start gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help shrink-0 mt-0.5 relative group/ml">
                            ?
                            <div className="absolute left-0 bottom-5 w-52 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                              企业边界的决策逻辑：当外部交易成本低于内部管理成本时，选择合作而非自建。这里的分析量化了两种模式的成本和速度差异。
                            </div>
                          </span>
                          <p className="text-xs text-neutral-500 leading-relaxed">{sp.analysis}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>协作网络价值评估</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { dim: '连接广度', desc: '5个直接连接节点形成一级协作圈，星型拓扑中心位置——连接的数量和多样性决定了信息获取的广度', score: 85 },
                        { dim: '关系深度', desc: '与昆仑联通合作5个项目（联合打单成功率68%），但与ISV协作仅3个项目——深度有待加强', score: 72 },
                        { dim: '认知协同', desc: '与精诚中国12个项目的长期合作建立了共享市场理解和客户洞察——默契降低了沟通成本', score: 80 },
                      ].map((d) => (
                        <div key={d.dim} className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-neutral-900 dark:text-white">{d.dim}</span>
                              <div className="relative group/ml">
                                <span className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 cursor-help inline-flex">?</span>
                                <div className="absolute left-0 top-5 w-56 p-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/ml:opacity-100 group-hover/ml:visible transition-all text-[10px] text-neutral-500 leading-relaxed">
                                  协作价值取决于三个维度：连接谁（结构）、关系多深（关系）、是否互相理解（认知）。三个维度共同决定了协作的效率和产出。
                                </div>
                              </div>
                            </div>
                            <span className={cn('text-sm font-semibold', d.score >= 80 ? 'text-emerald-600' : d.score >= 70 ? 'text-amber-600' : 'text-red-500')}>{d.score}分</span>
                          </div>
                          <ProgressBar value={d.score} size="sm" variant={d.score >= 80 ? 'success' : 'default'} />
                          <p className="text-xs text-neutral-500 mt-2">{d.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 rounded-xl">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        <b>综合评估：</b>协作网络总评分79分（白金前25%）。该伙伴在连接广度上表现优异，但关系深度（特别是ISV协作）有提升空间——应从项目级协作升级为方案级共创。核心建议：将伙伴定位从"渠道代理"升级为<b>"区域生态协调者"</b>，赋予更多跨伙伴协作的撮合权。
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ecosystem Value Summary */}
              <Card>
                <CardHeader><CardTitle>生态协作价值总览</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: '网络规模', value: '5节点', sub: '3生态+2子伙伴' },
                      { label: '协作营收', value: cur(ecosystemPartners.reduce((s,e)=>s+e.volume,0)), sub: '占总营收60%' },
                      { label: '网络位置', value: '枢纽', sub: '星型拓扑中心' },
                      { label: '协作评分', value: '79分', sub: '白金前25%' },
                    ].map((m) => (
                      <div key={m.label} className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-center">
                        <p className="text-xs text-neutral-400 mb-1">{m.label}</p>
                        <p className="text-xl font-semibold text-neutral-900 dark:text-white">{m.value}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{m.sub}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
