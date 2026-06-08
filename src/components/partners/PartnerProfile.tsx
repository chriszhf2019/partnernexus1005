import { ProfileTabProvider, ProfileTabs } from './profile/ProfileTabsIndex';
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
import { Gauge, StatCard, Breakthrough } from './profile/ProfileComponents';
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
          roi: a.budget > 0 ? Math.round((a.leadsGenerated || 0) * 85000 / a.budget * 100) / 100 : 0,
        }));
        setRealActivities(mappedActivities);

        // 获取激励计划数据
        const incentives = await marketingService.getIncentivePrograms();
        const mappedIncentives = incentives.map(i => ({
          id: i.id,
          name: i.title,
          progress: i.currentMonthPerformance?.rate || i.conversionRate || 0,
          target: i.totalBudget || i.budget || 0,
          current: i.claimedAmount || 0,
          nextTier: Math.max(0, (i.totalBudget || 10000000) - (i.claimedAmount || 0)),
          status: i.status === 'Active' ? '进行中' : i.status === 'Ended' ? '已完成' : i.status === 'Upcoming' ? '待启动' : '进行中',
          description: i.description || '',
          tier: i.currentMonthPerformance?.rate >= 80 ? '黄金档位' : i.currentMonthPerformance?.rate >= 50 ? '白银档位' : '青铜档位',
          currentTier: i.currentMonthPerformance?.rate >= 80 ? '黄金' : i.currentMonthPerformance?.rate >= 50 ? '白银' : '青铜',
          nextTierName: i.currentMonthPerformance?.rate >= 80 ? '钻石' : i.currentMonthPerformance?.rate >= 50 ? '黄金' : '白银',
          nextTierReward: Math.max(0, Math.round((i.totalBudget || 0) * 0.15)),
          reward: (i.currentMonthPerformance?.rate || i.conversionRate || 0) >= 50 ? Math.round((i.totalBudget || 0) * 0.1) : undefined,
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
        volume: p.volume || 0,
        deals: p.deals || 0,
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
      volume: 0 + 500000,
      deals: 0,
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
{/* ── Tabs (extracted to ProfileTabs) ── */}
      <ProfileTabProvider value={{
        partner, t, cur, config, activities,
        realDeals, realActivities, realIncentives,
        isEditing, setIsEditing,
        activeTab, setActiveTab,
        formData, dispatch,
        scores, breakthroughs,
        ecosystemPartners: ecosystemPartners || [],
        milestones: (partner as any).milestones || [],
        industryCoverage: (partner as any).industryCoverage || [],
        tasks, setTasks, taskFilter, setTaskFilter,
        toggleTaskComplete, updateTaskStatus, updateTaskDetail,
        addSubtask, deleteSubtask, updateSubtaskStatus,
        createNewTask, updatePartner,
        followUps, addFollowUp, removeFollowUp,
        saveFollowUpEdit, saveFollowUps,
        customers: (partner as any).customerPortfolio || [],
        saveCustomers, addCustomer, removeCustomer, saveCustomerEdit,
        closeDetail, openDetail, detailModal,
        capFill: (scores as any).capFill || 0,
        winRate: partner.winRate || 0,
        marketingScore: (scores as any).marketingScore || 0,
        mdfPct: (scores as any).mdfPct || 0,
        pipelineHealth: String((scores as any).pipelineHealth >= 60 ? 'healthy' : 'warning'),
        primaryContact: contacts.find(c => c.isPrimary) || contacts[0] || null,
        loading,
        handleSave,
        keyCustomers: keyCustomers || [],
        editingCustomer, setEditingCustomer,
        showCustomerForm, setShowCustomerForm,
      }}>
        <ProfileTabs />
      </ProfileTabProvider>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
