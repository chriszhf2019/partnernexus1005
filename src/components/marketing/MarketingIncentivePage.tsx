import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useMarketingData } from '../../hooks/useData';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { SearchableSelect } from '../ui/SearchableSelect';
import { cn, formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import {
  Plus, TrendingUp, Users, Calendar, Target, Activity, DollarSign, BarChart3, PieChart,
  ExternalLink, X, Filter, ChevronRight, Trophy, Flame, Award, Zap, Building2,
  Handshake, MapPin, Phone, User, FileText, Gift, MessageCircle, CheckSquare,
  QrCode, Share2, Copy, Eye, Image, Tag, MessageSquare, CalendarDays, Info, Receipt,
  Package, UserCheck, Wrench, Clock, Lightbulb, ArrowRight, AlertTriangle, Bell,
  Send, CheckCircle2, Download, ArrowUpRight, TrendingDown, Minus, RefreshCw,
  Megaphone, ListChecks, ClipboardCheck, AlertCircle, ArrowDownRight
} from 'lucide-react';
import { MDFClaimsPanel } from './MDFClaimsPanel';
import { CampaignROIPanel } from './CampaignROIPanel';
import { MarketingAssetLibrary } from './MarketingAssetLibrary';
import { MarketingCalendarPanel } from './MarketingCalendarPanel';
import { LeadNurturingPanel } from './LeadNurturingPanel';
import { ResourceMarketplace } from './ResourceMarketplace';
import { DigitalCheckinDashboard } from './DigitalCheckinDashboard';
import { SOPTaskChecklist } from './SOPTaskChecklist';
import { AutoReportGenerator } from './AutoReportGenerator';
import { BenchmarkSquare } from './BenchmarkSquare';
import { KPIIncentivePanel } from './KPIIncentivePanel';

// 颜色状态辅助函数
const getStatusColor = (rate: number, thresholds: { red?: number; yellow?: number } = {}) => {
  const { red = 30, yellow = 60 } = thresholds;
  if (rate >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
  if (rate >= yellow) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
  if (rate >= red) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
  return 'text-red-600 bg-red-50 dark:bg-red-900/20';
};

const getStatusDot = (rate: number, thresholds: { red?: number; yellow?: number } = {}) => {
  const { red = 30, yellow = 60 } = thresholds;
  if (rate >= 80) return 'bg-emerald-500';
  if (rate >= yellow) return 'bg-amber-500';
  if (rate >= red) return 'bg-orange-500';
  return 'bg-red-500';
};

// 安全数字格式化
const safeNum = (val: number | undefined | null, fallback: number = 0): number => {
  if (val === undefined || val === null || isNaN(val)) return fallback;
  return val;
};

// 安全百分比
const safePercent = (val: number | undefined | null, fallback: number = 0): number => {
  const num = safeNum(val, fallback);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.round(num);
};

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

  // 新增：诊断层交互状态
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // New panel states
  const [showMDFClaims, setShowMDFClaims] = useState(false);
  const [showROIPanel, setShowROIPanel] = useState(false);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLeadNurturing, setShowLeadNurturing] = useState(false);
  const [showResourceMarket, setShowResourceMarket] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const [showSOP, setShowSOP] = useState(false);
  const [showAutoReport, setShowAutoReport] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showKPIIncentive, setShowKPIIncentive] = useState(false);

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

  const qActivities = useMemo(() => {
    return mdfActivities.filter((a: any) => {
      const d = a.event_date || a.date || '';
      const m = parseInt(d.split('-')[1] || '0');
      const quarterNum = parseInt(currentQuarter.replace('Q', ''));
      const quarterStart = (quarterNum - 1) * 3 + 1;
      return m >= quarterStart && m <= quarterStart + 2;
    });
  }, [mdfActivities, currentQuarter]);

  const filteredActivities = qActivities.filter((a: any) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const activeCount = qActivities.filter((a: any) => a.status !== 'Completed').length;
  const completedCount = qActivities.filter((a: any) => a.status === 'Completed').length;
  const totalLeads = qActivities.reduce((s: number, a: any) => s + safeNum(a.leadsGenerated), 0);
  const totalBudget = q2Plans.reduce((s: number, p: any) => s + safeNum(Number(p.approved_amount || 0)), 0);
  const totalSpend = qActivities.reduce((s: number, a: any) => s + safeNum(a.actualSpend), 0);
  const totalParticipants = qActivities.reduce((s: number, a: any) => s + safeNum(a?.['expected_attendees']), 0);

  // ========== 第一部分：三大复合看板计算 ==========

  // 1. 执行进度看板 - 钱与事的进度
  const executionProgressData = useMemo(() => {
    const execRate = totalBudget > 0 ? safePercent((totalSpend / totalBudget) * 100) : 0;
    const now = new Date();
    const monthIndex = now.getMonth();
    const quarterNum = parseInt(currentQuarter.replace('Q', ''));
    const quarterStartMonth = (quarterNum - 1) * 3;
    const monthsIntoQuarter = Math.max(0, Math.min(3, monthIndex - quarterStartMonth + 1));
    const timeProgress = safePercent((monthsIntoQuarter / 3) * 100);

    // 活动完成率
    const totalActivities = qActivities.length;
    const completionRate = totalActivities > 0 ? safePercent((completedCount / totalActivities) * 100) : 0;

    // 区域覆盖情况
    const regionData: Record<string, number> = {};
    qActivities.forEach((a: any) => {
      const region = a.province || a.region || '未知';
      regionData[region] = (regionData[region] || 0) + 1;
    });
    const regionDistribution = Object.entries(regionData)
      .map(([region, count]) => ({ region, count, percentage: totalActivities > 0 ? safePercent((count / totalActivities) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // 资金构成：MDF vs 自办活动
    const mdfBudget = qActivities.filter((a: any) => a.hostType === 'partner').reduce((s: number, a: any) => s + safeNum(a.budget), 0);
    const selfBudget = qActivities.filter((a: any) => a.hostType === 'vendor').reduce((s: number, a: any) => s + safeNum(a.budget), 0);
    const totalActivityBudget = mdfBudget + selfBudget || 1;

    // 活动类型分布
    const activityTypes: Record<string, number> = {};
    qActivities.forEach((a: any) => {
      const type = a.type || '其他';
      activityTypes[type] = (activityTypes[type] || 0) + 1;
    });

    return {
      execRate,
      timeProgress,
      completionRate,
      isLagging: execRate < timeProgress - 10,
      regionDistribution,
      mdfBudget,
      selfBudget,
      mdfPercentage: safePercent((mdfBudget / totalActivityBudget) * 100),
      selfPercentage: safePercent((selfBudget / totalActivityBudget) * 100),
      activityTypes,
      totalActivities,
    };
  }, [qActivities, totalBudget, totalSpend, completedCount, currentQuarter]);

  // 2. 执行效果看板 - 人与场的温度
  const executionQualityData = useMemo(() => {
    // 累计参与人数
    const cumulativeParticipants = totalParticipants;

    // 场均获客数
    const avgLeadsPerActivity = qActivities.length > 0 ? safePercent(totalLeads / qActivities.length) : 0;

    // 过去30天参与人数走势（模拟数据）
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dayStr = date.toISOString().split('T')[0];
      const dayActivities = qActivities.filter((a: any) => (a.event_date || a.date || '').startsWith(dayStr));
      const participants = dayActivities.reduce((s: number, a: any) => s + safeNum(a?.['expected_attendees']), 0);
      return { date: dayStr, day: i + 1, participants, leads: dayActivities.reduce((s: number, a: any) => s + safeNum(a.leadsGenerated), 0) };
    });

    // 热门活动排行 Top 5（基于参与人数+商机数综合权重）
    const topActivities = [...qActivities]
      .map((a: any) => {
        const participants = safeNum(a?.['expected_attendees']);
        const leads = safeNum(a.leadsGenerated);
        const deals = safeNum(a?.['dealsCreated'] || 0);
        // 综合权重得分 = 参与人数*1 + 线索数*3 + 商机数*5
        const score = participants * 1 + leads * 3 + deals * 5;
        return { ...a, score, participants, leads, deals };
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);

    // 热力分布：活动类型热度
    const activityHeatmap = Object.entries(executionProgressData.activityTypes)
      .map(([type, count]) => {
        const typeActivities = qActivities.filter((a: any) => a.type === type);
        const avgParticipants = typeActivities.length > 0
          ? typeActivities.reduce((s: number, a: any) => s + safeNum(a?.['expected_attendees']), 0) / typeActivities.length
          : 0;
        const avgLeads = typeActivities.length > 0
          ? typeActivities.reduce((s: number, a: any) => s + safeNum(a.leadsGenerated), 0) / typeActivities.length
          : 0;
        return { type, count, avgParticipants: Math.round(avgParticipants), avgLeads: Math.round(avgLeads) };
      })
      .sort((a, b) => b.avgLeads - a.avgLeads);

    return {
      cumulativeParticipants,
      avgLeadsPerActivity,
      last30Days,
      topActivities,
      activityHeatmap,
    };
  }, [qActivities, totalParticipants, totalLeads, executionProgressData]);

  // 3. 转化价值看板 - 商机与新客的厚度
  const conversionData = useMemo(() => {
    // 商机转化率 ROI
    const roiRatio = totalBudget > 0 ? safeNum((totalLeads * 50000) / totalBudget, 0).toFixed(1) : '0.0';

    // 新客户(New Logo)占比
    const newLogoCount = qActivities.reduce((s: number, a: any) => s + safeNum(a.newLogoCount || 0), 0);
    const newLogoPercentage = totalLeads > 0 ? safePercent((newLogoCount / totalLeads) * 100) : 0;

    // 线索质量分布 - A/B/C三类
    const totalLeadsSafe = totalLeads || 1;
    const gradeA = Math.round(totalLeadsSafe * 0.2);
    const gradeB = Math.round(totalLeadsSafe * 0.35);
    const gradeC = Math.round(totalLeadsSafe * 0.45);

    // 转化周期与跟进率
    const avgConversionDays = qActivities.length > 0
      ? Math.round(qActivities.reduce((s: number, a: any) => s + safeNum(a.conversionDays || 30), 0) / qActivities.length)
      : 0;
    const followUpRate = qActivities.length > 0
      ? safePercent(qActivities.reduce((s: number, a: any) => s + safeNum(a.followUpRate || 0), 0) / qActivities.length)
      : 0;

    // 新客户订单总额
    const newLogoOrderAmount = qActivities.reduce((s: number, a: any) => s + safeNum(a.newLogoAmount || 0), 0);

    return {
      roiRatio,
      newLogoCount,
      newLogoPercentage,
      gradeA,
      gradeB,
      gradeC,
      avgConversionDays,
      followUpRate,
      newLogoOrderAmount,
    };
  }, [qActivities, totalBudget, totalLeads]);

  // ========== 第二部分：诊断层计算 ==========

  const diagnosticData = useMemo(() => {
    // 诊断A：执行与预算错配
    // 某区域MDF领用很高，但活动执行总数很低
    const diagnosisA = (() => {
      const regionBudgetMap: Record<string, number> = {};
      const regionActivityMap: Record<string, number> = {};

      qActivities.forEach((a: any) => {
        const region = a.province || a.region || '未知';
        regionBudgetMap[region] = (regionBudgetMap[region] || 0) + safeNum(a.budget);
        regionActivityMap[region] = (regionActivityMap[region] || 0) + 1;
      });

      const mismatchRegions = Object.entries(regionBudgetMap)
        .filter(([region, budget]) => {
          const activities = regionActivityMap[region] || 0;
          // 预算高(>50000)但活动少(<=1)
          return budget > 50000 && activities <= 1;
        })
        .map(([region, budget]) => ({
          region,
          budget,
          activities: regionActivityMap[region] || 0,
        }));

      return {
        hasIssue: mismatchRegions.length > 0,
        regions: mismatchRegions,
        summary: mismatchRegions.length > 0
          ? `发现 ${mismatchRegions.length} 个区域存在预算领用未执行问题`
          : '未发现明显错配',
      };
    })();

    // 诊断B：线索"肠梗阻"分析
    // 活动参与人数爆满，但转化周期极长、跟进率极低
    const diagnosisB = (() => {
      const highTrafficLowConversion = qActivities
        .filter((a: any) => {
          const participants = safeNum(a?.['expected_attendees']);
          const conversionDays = safeNum(a.conversionDays || 30);
          const followUpRate = safeNum(a.followUpRate || 0);
          // 参与人数>50 但转化周期>45天 且 跟进率<50%
          return participants > 50 && conversionDays > 45 && followUpRate < 50;
        })
        .map((a: any) => ({
          ...a,
          participants: safeNum(a?.['expected_attendees']),
          conversionDays: safeNum(a.conversionDays || 30),
          followUpRate: safeNum(a.followUpRate || 0),
        }));

      return {
        hasIssue: highTrafficLowConversion.length > 0,
        activities: highTrafficLowConversion,
        summary: highTrafficLowConversion.length > 0
          ? `发现 ${highTrafficLowConversion.length} 场活动存在线索流转瓶颈`
          : '未发现明显瓶颈',
      };
    })();

    // 诊断C：高产出活动复刻分析
    // 某类活动（如"行业闭门会"）的新客户转化率极高
    const diagnosisC = (() => {
      const typePerformance: Record<string, { total: number; newLogo: number; newLogoAmount: number }> = {};

      qActivities.forEach((a: any) => {
        const type = a.type || '其他';
        if (!typePerformance[type]) {
          typePerformance[type] = { total: 0, newLogo: 0, newLogoAmount: 0 };
        }
        typePerformance[type].total += safeNum(a.leadsGenerated);
        typePerformance[type].newLogo += safeNum(a.newLogoCount || 0);
        typePerformance[type].newLogoAmount += safeNum(a.newLogoAmount || 0);
      });

      const topTypes = Object.entries(typePerformance)
        .map(([type, data]) => ({
          type,
          ...data,
          conversionRate: data.total > 0 ? safePercent((data.newLogo / data.total) * 100) : 0,
        }))
        .filter(t => t.total > 0)
        .sort((a, b) => b.conversionRate - a.conversionRate);

      const bestType = topTypes[0];
      const sopDownloadCount = bestType ? Math.round(bestType.newLogo * 2.5) : 0; // 模拟SOP下载量

      return {
        hasIssue: topTypes.length > 0,
        topTypes,
        bestType,
        sopDownloadCount,
        summary: bestType
          ? `"${bestType.type}"新客转化率最高，达${bestType.conversionRate}%`
          : '暂无高产出活动数据',
      };
    })();

    return { diagnosisA, diagnosisB, diagnosisC };
  }, [qActivities]);

  // 选中活动的漏斗数据
  const selectedActivityFunnel = useMemo(() => {
    if (!selectedActivityId) return null;

    const activity = qActivities.find((a: any) => a.id === selectedActivityId);
    if (!activity) return null;

    const participants = safeNum(activity?.['expected_attendees']);
    const leads = safeNum(activity.leadsGenerated);
    const mql = Math.round(leads * 0.6);
    const sql = Math.round(mql * 0.4);
    const opportunities = Math.round(sql * 0.3);
    const deals = safeNum(activity?.['dealsCreated'] || 0);

    return {
      activityName: activity.name,
      type: activity.type,
      stages: [
        { label: '报名参会', value: participants, color: 'bg-blue-500' },
        { label: '产生线索', value: leads, color: 'bg-cyan-500' },
        { label: 'MQL筛选', value: mql, color: 'bg-teal-500' },
        { label: 'SQL筛选', value: sql, color: 'bg-amber-500' },
        { label: '商机转化', value: opportunities, color: 'bg-orange-500' },
        { label: '赢单成交', value: deals, color: 'bg-emerald-500' },
      ],
    };
  }, [selectedActivityId, qActivities]);

  // ========== 第三部分：行动中心计算 ==========

  const actionCards = useMemo(() => {
    const cards = [];

    // 督办卡片：进度落后预警
    if (executionProgressData.isLagging) {
      cards.push({
        type: 'supervision',
        icon: AlertTriangle,
        color: 'orange',
        title: '进度落后预警',
        content: `华北区活动进度仅 ${executionProgressData.execRate}%，低于时间进度 ${executionProgressData.timeProgress}%。建议【督办区域负责人】或【回收未用预算】。`,
        priority: 'high' as const,
        actions: [
          { label: '督办负责人', icon: Bell },
          { label: '回收预算', icon: DollarSign },
        ],
      });
    }

    // 促活卡片：高价值线索未跟进
    const staleLeads = qActivities.reduce((s: number, a: any) => {
      const stale = a.staleLeads || 0;
      return s + safeNum(stale);
    }, 0);
    if (staleLeads > 0) {
      cards.push({
        type: 'activation',
        icon: RefreshCw,
        color: 'blue',
        title: '跟进效率干预',
        content: `有 ${staleLeads} 条高价值线索 48 小时未跟进。建议【一键催办伙伴】或【系统自动收回重分】。`,
        priority: 'medium' as const,
        actions: [
          { label: '一键催办', icon: Send },
          { label: '收回重分', icon: RefreshCw },
        ],
      });
    }

    // 赋能卡片：标杆经验推广
    if (diagnosticData.diagnosisC.bestType) {
      cards.push({
        type: 'empowerment',
        icon: Lightbulb,
        color: 'green',
        title: '标杆经验推广',
        content: `本月'${diagnosticData.diagnosisC.bestType.type}'新客产出最高。建议【一键将该活动 SOP 推送至全员】。`,
        priority: 'low' as const,
        actions: [
          { label: '推送SOP', icon: Send },
          { label: '查看详情', icon: ArrowRight },
        ],
      });
    }

    // 审批卡片：MDF快速核销
    const pendingApprovals = 5; // 模拟数据
    const pendingAmount = 200000; // 模拟数据
    if (pendingApprovals > 0) {
      cards.push({
        type: 'approval',
        icon: ClipboardCheck,
        color: 'purple',
        title: 'MDF快速核销',
        content: `当前有 ${pendingApprovals} 个活动待结项核销，涉及金额 ${cur(pendingAmount)}。建议【前往一键审批】。`,
        priority: 'medium' as const,
        actions: [
          { label: '前往审批', icon: CheckCircle2 },
        ],
      });
    }

    return cards;
  }, [executionProgressData, diagnosticData, qActivities, cur]);

  // ========== 活动类型分布图 ==========

  const PieSVG = ({ data, size = 50, colors }: { data: number[]; size?: number; colors?: string[] }) => {
    const defaultColors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
    const colorList = colors || defaultColors;
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
          return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={colorList[i % colorList.length]} />;
        })}
      </svg>
    );
  };

  const activityTypes = executionProgressData.activityTypes;
  const topActivities = executionQualityData.topActivities;

  const hostTypeOptions = [
    { id: 'vendor', label: '厂商自办', icon: Building2, color: 'text-blue-600' },
    { id: 'partner', label: '代理商合办', icon: Handshake, color: 'text-emerald-600' },
  ];

  // --- Growth Lab derived state ---
  const activitiesWithROI = useMemo(() => {
    return qActivities
      .filter((a: any) => safeNum(a.budget) > 0 || a.status !== 'Planning')
      .map((a: any) => {
        const roi = safeNum(a.budget) > 0 ? safeNum((safeNum(a.leadsGenerated) / (safeNum(a.budget) / 10000))) : 0;
        let alertStatus: string;
        if (a.status === 'In Progress' && safeNum(a.actualSpend) > safeNum(a.budget) * 0.9) alertStatus = 'over-budget';
        else if (a.status === 'Completed' && safeNum(a.leadsGenerated) === 0) alertStatus = 'no-leads';
        else if (a.status === 'In Progress' && safeNum(a.actualSpend) === 0) alertStatus = 'not-started';
        else alertStatus = 'normal';
        return { ...a, roi, alertStatus };
      })
      .sort((a: any, b: any) => {
        const order: Record<string, number> = { 'over-budget': 0, 'no-leads': 1, 'not-started': 2, 'normal': 3 };
        const aO = order[a.alertStatus] ?? 3;
        const bO = order[b.alertStatus] ?? 3;
        if (aO !== bO) return aO - bO;
        return (b.roi || 0) - (a.roi || 0);
      });
  }, [qActivities]);

  const tierDistribution = useMemo(() => {
    const tiers: { l1: number; l2: number; l3: number } = { l1: 0, l2: 0, l3: 0 };
    partners.forEach((p: any) => {
      if (['Platinum', 'Diamond'].includes(p.tier)) tiers.l3++;
      else if (['Gold', 'Premier'].includes(p.tier)) tiers.l2++;
      else tiers.l1++;
    });
    const total = tiers.l1 + tiers.l2 + tiers.l3 || 1;
    return {
      l1: tiers.l1,
      l2: tiers.l2,
      l3: tiers.l3,
      pct1: safePercent((tiers.l1 / total) * 100),
      pct2: safePercent((tiers.l2 / total) * 100),
      pct3: safePercent((tiers.l3 / total) * 100)
    };
  }, [partners]);

  const medianROI = useMemo(() => {
    const rois = activitiesWithROI.filter((a: any) => a.roi > 0).map((a: any) => a.roi);
    if (rois.length === 0) return 0;
    rois.sort((a: number, b: number) => a - b);
    return rois[Math.floor(rois.length / 2)];
  }, [activitiesWithROI]);

  // ========== 事件处理 ==========

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('marketing.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('marketing.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/marketing/plan')}><Target className="w-4 h-4" />{t('gl.marketing.annualPlan')}</Button>
          <Button variant="brand" size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" />{t('gl.marketing.newActivity')}</Button>
        </div>
      </div>

      {/* ========== 第一部分：顶层战略展示层（三大复合看板） ========== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">战略展示层</h2>
          <Badge variant="info" size="sm">做的进度 · 做的效果 · 做的价值</Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 1. 执行进度看板 - 钱与事的进度 */}
          <Card className="relative overflow-hidden border-t-4 border-t-blue-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-xs font-medium text-neutral-500">执行进度</span>
                  <p className="text-xs text-neutral-400">钱与事的进度</p>
                </div>
              </div>
              <Badge className={getStatusColor(executionProgressData.execRate)} size="sm">
                {executionProgressData.isLagging ? '进度滞后' : '正常'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{executionProgressData.completionRate}%</p>
                <p className="text-xs text-neutral-500">活动完成率</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{executionProgressData.execRate}%</p>
                <p className="text-xs text-neutral-500">预算执行率</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-500">时间进度</span>
                <span className="font-medium">{executionProgressData.timeProgress}%</span>
              </div>
              <ProgressBar value={executionProgressData.timeProgress} max={100} size="sm" variant="default" />
            </div>

            {/* 区域覆盖 - 水平条形图 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-neutral-500 mb-2">区域覆盖情况</p>
              <div className="space-y-1.5">
                {executionProgressData.regionDistribution.slice(0, 4).map((r: any) => (
                  <div key={r.region} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 w-12 truncate">{r.region}</span>
                    <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-8 text-right">{r.count}场</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 资金构成 - 环形图 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-neutral-500 mb-2">资金构成</p>
              <div className="flex items-center gap-3">
                <PieSVG data={[executionProgressData.mdfBudget, executionProgressData.selfBudget]} size={60} colors={['#059669', '#2563eb']} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-neutral-600 dark:text-neutral-400">MDF领用</span>
                    <span className="font-medium">{executionProgressData.mdfPercentage}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-neutral-600 dark:text-neutral-400">自办活动</span>
                    <span className="font-medium">{executionProgressData.selfPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 活动类型 - 堆叠进度条 */}
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">活动类型分布</p>
              <div className="space-y-1">
                {Object.entries(activityTypes).slice(0, 3).map(([type, count]) => {
                  const pct = safePercent((count / executionProgressData.totalActivities) * 100);
                  return (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 truncate flex-1">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-neutral-400 w-12 text-right">{count}场</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* 2. 执行效果看板 - 人与场的温度 */}
          <Card className="relative overflow-hidden border-t-4 border-t-emerald-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-xs font-medium text-neutral-500">执行效果</span>
                  <p className="text-xs text-neutral-400">人与场的温度</p>
                </div>
              </div>
              <Badge variant="brand" size="sm">热度良好</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {safeNum(executionQualityData.cumulativeParticipants).toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500">累计参与人数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{executionQualityData.avgLeadsPerActivity}</p>
                <p className="text-xs text-neutral-500">场均获客数</p>
              </div>
            </div>

            {/* 流量走势 - 30天波动图 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-neutral-500 mb-2">近30天参与人数走势</p>
              <div className="flex items-end justify-between h-12 gap-0.5">
                {executionQualityData.last30Days.slice(-14).map((d: any) => {
                  const maxVal = Math.max(...executionQualityData.last30Days.map((x: any) => x.participants), 1);
                  const height = Math.max(2, (d.participants / maxVal) * 48);
                  return (
                    <div
                      key={d.day}
                      className="flex-1 bg-emerald-400 rounded-t transition-all hover:bg-emerald-500"
                      style={{ height: `${height}px` }}
                      title={`${d.date}: ${d.participants}人`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>14天前</span>
                <span>今天</span>
              </div>
            </div>

            {/* 热门活动排行 Top 5 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-neutral-500 mb-2">热门活动排行 Top 5</p>
              <div className="space-y-2">
                {topActivities.map((a: any, i: number) => (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      selectedActivityId === a.id
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                        : "bg-neutral-50/50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                    onClick={() => setSelectedActivityId(selectedActivityId === a.id ? null : a.id)}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-neutral-400 text-white" : "bg-amber-700 text-white"
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.name}</p>
                      <p className="text-[10px] text-neutral-400">
                        {a.participants}人 · {a.leads}线索 · {a.deals}商机
                      </p>
                    </div>
                    {selectedActivityId === a.id && <ChevronRight className="w-3 h-3 text-emerald-500" />}
                  </div>
                ))}
                {topActivities.length === 0 && (
                  <p className="text-xs text-neutral-400 text-center py-2">暂无数据</p>
                )}
              </div>
            </div>

            {/* 热力分布 */}
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">活动类型热度</p>
              <div className="flex flex-wrap gap-1">
                {executionQualityData.activityHeatmap.slice(0, 4).map((h: any) => (
                  <span
                    key={h.type}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full",
                      h.avgLeads > 10 ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
                      h.avgLeads > 5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    )}
                  >
                    {h.type} ({h.avgLeads})
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* 3. 转化价值看板 - 商机与新客的厚度 */}
          <Card className="relative overflow-hidden border-t-4 border-t-purple-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-xs font-medium text-neutral-500">转化价值</span>
                  <p className="text-xs text-neutral-400">商机与新客的厚度</p>
                </div>
              </div>
              <Badge variant="brand" size="sm">ROI优秀</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">1:{safeNum(Number(conversionData.roiRatio))}</p>
                <p className="text-xs text-neutral-500">商机转化率 ROI</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{conversionData.newLogoPercentage}%</p>
                <p className="text-xs text-neutral-500">新客户占比</p>
              </div>
            </div>

            {/* 线索质量分布 - 漏斗图 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-neutral-500 mb-2">线索质量分布</p>
              <div className="space-y-1.5">
                {[
                  { label: 'A类(优质)', value: conversionData.gradeA, color: 'bg-emerald-500' },
                  { label: 'B类(中等)', value: conversionData.gradeB, color: 'bg-amber-500' },
                  { label: 'C类(潜在线索)', value: conversionData.gradeC, color: 'bg-blue-500' },
                ].map((item) => {
                  const maxVal = Math.max(conversionData.gradeA, conversionData.gradeB, conversionData.gradeC, 1);
                  const width = Math.max(4, (item.value / maxVal) * 100);
                  return (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-500 w-16">{item.label}</span>
                      <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-3">
                        <div
                          className={cn("h-full rounded-full flex items-center justify-end pr-1", item.color)}
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-[9px] text-white font-medium leading-none">{item.value}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 效率指标 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span className="text-[10px] text-neutral-500">转化周期</span>
                </div>
                <p className="text-sm font-semibold">{safeNum(conversionData.avgConversionDays)}天</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <UserCheck className="w-3 h-3 text-neutral-400" />
                  <span className="text-[10px] text-neutral-500">跟进率</span>
                </div>
                <p className={cn(
                  "text-sm font-semibold",
                  getStatusColor(conversionData.followUpRate).split(' ')[0]
                )}>
                  {safeNum(conversionData.followUpRate)}%
                </p>
                <div className={cn("w-2 h-2 rounded-full mt-1", getStatusDot(conversionData.followUpRate))} />
              </div>
            </div>

            {/* 价值沉淀 */}
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-2">价值沉淀</p>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-3">
                <p className="text-xs text-neutral-500">活动获取新客户订单总额</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{cur(safeNum(conversionData.newLogoOrderAmount))}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ========== 第二部分：诊断层（智能诊断层） ========== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">智能诊断层</h2>
          <Badge variant="secondary" size="sm">瓶颈深挖</Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 诊断A：执行与预算错配 */}
          <Card className={cn(
            "border-2 transition-colors",
            diagnosticData.diagnosisA.hasIssue ? "border-orange-200 dark:border-orange-800" : "border-transparent"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-sm">诊断A：执行与预算错配</CardTitle>
                <p className="text-[10px] text-neutral-400">预算领用未执行名单</p>
              </div>
            </div>

            <div className={cn("p-3 rounded-lg mb-3", diagnosticData.diagnosisA.hasIssue ? "bg-orange-50 dark:bg-orange-900/20" : "bg-neutral-50 dark:bg-neutral-800/50")}>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">{diagnosticData.diagnosisA.summary}</p>
            </div>

            {diagnosticData.diagnosisA.hasIssue && (
              <div className="space-y-2">
                {diagnosticData.diagnosisA.regions.slice(0, 3).map((r: any) => (
                  <div key={r.region} className="flex items-center justify-between p-2 bg-red-50/50 dark:bg-red-900/10 rounded-lg">
                    <div>
                      <p className="text-xs font-medium">{r.region}</p>
                      <p className="text-[10px] text-neutral-500">预算: {cur(r.budget)} · 活动: {r.activities}场</p>
                    </div>
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 诊断B：线索"肠梗阻"分析 */}
          <Card className={cn(
            "border-2 transition-colors",
            diagnosticData.diagnosisB.hasIssue ? "border-blue-200 dark:border-blue-800" : "border-transparent"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm">诊断B：线索"肠梗阻"分析</CardTitle>
                <p className="text-[10px] text-neutral-400">线索质量 vs 伙伴跟进效率</p>
              </div>
            </div>

            <div className={cn("p-3 rounded-lg mb-3", diagnosticData.diagnosisB.hasIssue ? "bg-blue-50 dark:bg-blue-900/20" : "bg-neutral-50 dark:bg-neutral-800/50")}>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">{diagnosticData.diagnosisB.summary}</p>
            </div>

            {diagnosticData.diagnosisB.hasIssue && (
              <div className="space-y-2">
                {diagnosticData.diagnosisB.activities.slice(0, 3).map((a: any) => (
                  <div key={a.id} className="p-2 bg-red-50/50 dark:bg-red-900/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium truncate flex-1">{a.name}</p>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded", getStatusColor(a.followUpRate))}>
                        {a.followUpRate}%跟进
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      {a.participants}人参与 · 转化{a.conversionDays}天 · 跟进率{a.followUpRate}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 诊断C：高产出活动复刻分析 */}
          <Card className="border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm">诊断C：高产出活动复刻分析</CardTitle>
                <p className="text-[10px] text-neutral-400">SOP下载量统计</p>
              </div>
            </div>

            <div className="p-3 rounded-lg mb-3 bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">{diagnosticData.diagnosisC.summary}</p>
            </div>

            {diagnosticData.diagnosisC.bestType && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium">最佳活动类型</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{diagnosticData.diagnosisC.bestType.type}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-500">
                    <span>转化率: {diagnosticData.diagnosisC.bestType.conversionRate}%</span>
                    <span>新客: {diagnosticData.diagnosisC.bestType.newLogo}个</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-500" />
                    <span className="text-xs">SOP标准文档</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{diagnosticData.diagnosisC.sopDownloadCount}</span>
                    <span className="text-[10px] text-neutral-400">次下载</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* 选中活动的漏斗详情 */}
        {selectedActivityFunnel && (
          <Card className="mt-6 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-sm">
                  活动漏斗详情：{selectedActivityFunnel.activityName}
                </CardTitle>
                <Badge variant="info" size="sm">{selectedActivityFunnel.type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-2">
                {selectedActivityFunnel.stages.map((stage, i) => {
                  const maxVal = selectedActivityFunnel.stages[0].value || 1;
                  const width = Math.max(8, (stage.value / maxVal) * 100);
                  return (
                    <div key={stage.label} className="text-center">
                      <div className="relative">
                        <div className={cn("h-24 rounded-lg flex items-end justify-center p-1", stage.color)}>
                          <span className="text-white font-bold text-sm">{stage.value}</span>
                        </div>
                        {i > 0 && (
                          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                            <ArrowRight className="w-3 h-3 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-1">{stage.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ========== 第三部分：执行层（行动中心） ========== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">行动中心</h2>
          <Badge variant="info" size="sm">执行驱动</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {actionCards.map((card) => {
            const Icon = card.icon;
            const colorMap: Record<string, string> = {
              orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
              blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
              green: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
              purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
            };
            const iconColorMap: Record<string, string> = {
              orange: 'text-orange-600',
              blue: 'text-blue-600',
              green: 'text-emerald-600',
              purple: 'text-purple-600',
            };

            return (
              <Card key={card.type} className={cn("border-2", colorMap[card.color])}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-neutral-800 shadow-sm", iconColorMap[card.color])}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm mb-1">{card.title}</CardTitle>
                    <Badge
                      variant={
                        card.priority === 'high' ? 'danger' :
                        card.priority === 'medium' ? 'warning' : 'default'
                      }
                      size="sm"
                    >
                      {card.priority === 'high' ? '紧急' : card.priority === 'medium' ? '中等' : '建议'}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                  {card.content}
                </p>

                <div className="flex flex-wrap gap-2">
                  {card.actions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <Button
                        key={action.label}
                        size="sm"
                        variant={card.color === 'orange' ? 'secondary' : card.color === 'green' ? 'brand' : 'secondary'}
                        className="text-xs"
                        onClick={() => {
                          if (card.type === 'approval') {
                            setShowMDFClaims(true);
                          } else if (card.type === 'empowerment') {
                            setShowSOP(true);
                          }
                        }}
                      >
                        <ActionIcon className="w-3 h-3 mr-1" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </Card>
            );
          })}

          {actionCards.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-8 text-neutral-400">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              <span className="text-sm">暂无待处理行动项</span>
            </div>
          )}
        </div>
      </section>

      {/* ========== Quick Entry Bar (保留) ========== */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-neutral-500">{t('gl.marketing.quickEntry')}</span>
        <div className="flex gap-1">
          <button onClick={() => setShowMDFClaims(true)} className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <Receipt className="w-3 h-3 inline mr-1" />MDF
          </button>
          <button onClick={() => setShowROIPanel(true)} className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <Target className="w-3 h-3 inline mr-1" />ROI
          </button>
          <button onClick={() => setShowAssetLibrary(true)} className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <Package className="w-3 h-3 inline mr-1" />{t('gl.marketing.assets')}
          </button>
          <button onClick={() => setShowSOP(true)} className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <CheckSquare className="w-3 h-3 inline mr-1" />SOP
          </button>
          <button onClick={() => setShowBenchmark(true)} className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <Trophy className="w-3 h-3 inline mr-1" />{t('gl.marketing.benchmarks')}
          </button>
          <button onClick={() => { setShowResourceMarket(true); }} className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <Wrench className="w-3 h-3 inline mr-1" />{t('gl.marketing.resources')}
          </button>
        </div>
      </div>

      {/* ========== Legacy Zone Components (保留原有功能) ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Trend Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('gl.marketing.budgetTrend')}</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  <span className="text-neutral-500">{t('gl.marketing.budget')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-neutral-500">{t('gl.marketing.actualSpend')}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-40 gap-3 px-2">
                {[0, 1, 2].map((i) => {
                  const monthName = ['4月', '5月', '6月'][i];
                  const budget = totalBudget / 3 || 0;
                  const spend = totalSpend / 3 || 0;
                  const maxVal = Math.max(budget, spend, 1);
                  const budgetHeight = Math.max(1, (budget / maxVal) * 120);
                  const spendHeight = Math.max(0, (spend / maxVal) * 120);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center gap-1">
                        <div className="w-8 bg-blue-100 dark:bg-blue-900/30 rounded-t" style={{ height: `${budgetHeight}px` }} />
                        <div className="w-8 bg-emerald-500 rounded-t -mt-0.5" style={{ height: `${spendHeight}px` }} />
                      </div>
                      <span className="text-xs text-neutral-500">{monthName}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <span className="text-neutral-500">{t('gl.marketing.totalBudget')} {cur(safeNum(totalBudget))}</span>
                <span className="text-neutral-500">{t('gl.marketing.totalSpend')} {cur(safeNum(totalSpend))}</span>
                <span className="text-emerald-600 font-medium">
                  {t('gl.marketing.executionRate')} {safePercent((safeNum(totalSpend) / safeNum(totalBudget)) * 100)}%
                </span>
              </div>
            </CardContent>
            <div className="px-6 pb-4 pt-0">
              <button onClick={() => navigate('/detail/marketing-budget')} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                查看详情 <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Card>

          {/* Activity Type Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('gl.marketing.activityDistribution')}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <PieSVG data={Object.values(activityTypes)} size={70} />
                <div className="space-y-1 flex-1 text-xs">
                  {Object.entries(activityTypes).slice(0, 5).map(([type, count]) => {
                    const pct = safePercent((count / qActivities.length) * 100);
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-neutral-500">{type}</span>
                        <span className="font-medium">{count}场 ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            <div className="px-6 pb-4 pt-0">
              <button onClick={() => navigate('/detail/activity-types')} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                查看详情 <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Card>
        </div>

        {/* Legacy Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">转化漏斗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: '报名参会', value: safeNum(totalParticipants), color: 'bg-blue-500' },
                { label: '产生线索', value: safeNum(totalLeads), color: 'bg-cyan-500' },
                { label: 'MQL筛选', value: safePercent(safeNum(totalLeads) * 0.6), color: 'bg-amber-500' },
                { label: '赢单成交', value: safePercent(safeNum(totalLeads) * 0.15), color: 'bg-emerald-500' },
              ].map((stage, i) => {
                const maxVal = Math.max(safeNum(totalParticipants), 1);
                const pct = safePercent((stage.value / maxVal) * 100);
                const dropoff = i === 0 ? null : safePercent(100 - (stage.value / (i > 0 ? [safeNum(totalParticipants), safeNum(totalLeads), safePercent(safeNum(totalLeads) * 0.6)][i - 1] : 1)) * 100);
                return (
                  <div key={stage.label}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs text-neutral-500 w-16">{stage.label}</span>
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white w-12 text-right">{stage.value}</span>
                      {dropoff !== null && dropoff > 0 && (
                        <span className="text-[10px] text-red-400">-{dropoff}%</span>
                      )}
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-5 relative overflow-hidden">
                      <div className={cn("h-full rounded-full flex items-center justify-end pr-1", stage.color)} style={{ width: `${pct}%` }}>
                        <span className="text-[9px] text-white font-medium leading-none">{pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== Activity List (Legacy Zone) ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Activity List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">活动列表</CardTitle>
              <span className="text-xs text-neutral-400">
                共 {activitiesWithROI.length} 个活动
              </span>
            </div>
            <div className="flex items-center gap-1">
              {['all', 'over-budget', 'no-leads', 'not-started', 'normal'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full transition-colors",
                    statusFilter === opt
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  )}
                >
                  {opt === 'all' ? '全部' : opt === 'over-budget' ? '超支' : opt === 'no-leads' ? '无线索' : opt === 'not-started' ? '未启动' : '正常'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredActivities.length === 0 && (
                <p className="text-sm text-neutral-400 py-8 text-center">暂无匹配的活动</p>
              )}
              {filteredActivities.slice(0, 10).map((act: any) => {
                const pct = safeNum(act.budget) > 0 ? safePercent((safeNum(act.actualSpend) / safeNum(act.budget)) * 100) : 0;
                const isHighROI = safeNum(act.leadsGenerated) > 0 && safeNum(act.leadsGenerated) >= safeNum(medianROI);
                return (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/marketing/activity/${act.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={act.hostType === 'partner' ? 'warning' : 'default'} size="sm">
                          {act.hostType === 'partner' ? '合办' : '自办'}
                        </Badge>
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">{act.name}</span>
                        <Badge variant={act.status === 'Completed' ? 'success' : act.status === 'In Progress' ? 'info' : 'default'} size="sm">
                          {act.status === 'Completed' ? '已完成' : act.status === 'In Progress' ? '进行中' : '规划中'}
                        </Badge>
                        {isHighROI && <Trophy className="w-3 h-3 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {cur(safeNum(act.actualSpend))} / {cur(safeNum(act.budget))}
                        </span>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                    <ProgressBar value={pct} size="sm" variant={pct >= 90 ? 'danger' : 'brand'} />
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-neutral-400">
                      <span>
                        {act.date || act.event_date} · {act.type}
                        {act.partnerName ? ` · ${act.partnerName}` : ''}
                        {act.city ? ` · ${act.city}` : ''}
                      </span>
                      <span>线索: {safeNum(act.leadsGenerated)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Partner Matrix + Top Assets */}
        <div className="space-y-6">
          {/* Partner Capability Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">伙伴矩阵</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-500">基础伙伴</span>
                    <span className="font-medium">{tierDistribution.l1} ({tierDistribution.pct1}%)</span>
                  </div>
                  <ProgressBar value={tierDistribution.pct1} size="sm" variant="default" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-500">成长伙伴</span>
                    <span className="font-medium">{tierDistribution.l2} ({tierDistribution.pct2}%)</span>
                  </div>
                  <ProgressBar value={tierDistribution.pct2} size="sm" variant="brand" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-500">高潜力伙伴</span>
                    <span className="font-medium">{tierDistribution.l3} ({tierDistribution.pct3}%)</span>
                  </div>
                  <ProgressBar value={tierDistribution.pct3} size="sm" variant="brand" />
                </div>
              </div>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => navigate('/enablement')}>
                <Zap className="w-3.5 h-3.5 mr-1" />推送培训
              </Button>
            </CardContent>
          </Card>

          {/* Top Performing Assets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Top 活动</CardTitle>
              <Trophy className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topActivities.slice(0, 3).map((act: any, i: number) => (
                  <div key={act.id} className="flex items-center gap-3 p-2 rounded-lg bg-neutral-50/50 dark:bg-neutral-800/50">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-neutral-400 text-white' : 'bg-amber-700 text-white'
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-neutral-900 dark:text-white">{act.name}</p>
                      <p className="text-[10px] text-neutral-500">{safeNum(act.leadsGenerated)}线索 · {act.type}</p>
                    </div>
                  </div>
                ))}
                {topActivities.length === 0 && (
                  <p className="text-xs text-neutral-400 py-4 text-center">暂无活动数据</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Create Activity CTA */}
          <Button variant="brand" className="w-full" size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />新建活动
          </Button>
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
                          maxAttendees: Number(plan?.['expected_attendees']) || 100,
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
                      className={cn(
                        "w-full px-4 py-3 flex items-center justify-between transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800",
                        plan.id === selectedPlan?.id ? 'bg-green-50 dark:bg-green-900/20' : '',
                        plan !== q2Plans[q2Plans.length - 1] ? 'border-b border-neutral-200 dark:border-neutral-700' : ''
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{plan.quarter}</span>
                        <span className="text-sm font-medium">{plan.category}</span>
                        {plan.activity_type === 'PMDF' && <Badge variant="secondary" className="text-[10px]">PMDF</Badge>}
                        <Badge className="text-[10px]" variant={
                          ['executed', 'Completed', '已完成'].includes(plan.execution_status || '') ? 'success' :
                          ['approved', 'Approved', 'In Progress', '进行中'].includes(plan.execution_status || '') ? 'info' : 'default'
                        }>
                          {['executed', 'Completed', '已完成'].includes(plan.execution_status || '') ? '已完成' :
                           ['approved', 'Approved', 'In Progress', '进行中'].includes(plan.execution_status || '') ? '已批复' : '草稿'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-neutral-500">{plan.partner_name || '厂商自办'}</span>
                        <span className="text-sm font-semibold text-blue-600">{cur(safeNum(Number(plan.approved_amount || plan.total_budget || 0)))}</span>
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
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 transition-colors",
                        newActivity.hostType === opt.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                      )}
                    >
                      <opt.icon className={cn("w-5 h-5", opt.color)} />
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

              {/* Features */}
              <div>
                <label className="text-xs font-semibold text-neutral-500 block mb-3">活动功能</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                    <CheckSquare className={cn("w-5 h-5", newActivity.enableCheckin ? 'text-green-600' : 'text-neutral-400')} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">启用签到功能</p>
                      <p className="text-xs text-neutral-400">支持扫码签到</p>
                    </div>
                    <input type="checkbox" checked={newActivity.enableCheckin} onChange={e => setNewActivity({...newActivity, enableCheckin: e.target.checked})} className="hidden" />
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                    <MessageSquare className={cn("w-5 h-5", newActivity.enableQuestions ? 'text-blue-600' : 'text-neutral-400')} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">启用提问功能</p>
                      <p className="text-xs text-neutral-400">允许参会者在线提问</p>
                    </div>
                    <input type="checkbox" checked={newActivity.enableQuestions} onChange={e => setNewActivity({...newActivity, enableQuestions: e.target.checked})} className="hidden" />
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                    <Gift className={cn("w-5 h-5", newActivity.enableLottery ? 'text-amber-600' : 'text-neutral-400')} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">启用抽奖功能</p>
                      <p className="text-xs text-neutral-400">现场抽奖互动</p>
                    </div>
                    <input type="checkbox" checked={newActivity.enableLottery} onChange={e => setNewActivity({...newActivity, enableLottery: e.target.checked})} className="hidden" />
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                    <Share2 className={cn("w-5 h-5", newActivity.enableShare ? 'text-purple-600' : 'text-neutral-400')} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">启用分享功能</p>
                      <p className="text-xs text-neutral-400">支持微信分享</p>
                    </div>
                    <input type="checkbox" checked={newActivity.enableShare} onChange={e => setNewActivity({...newActivity, enableShare: e.target.checked})} className="hidden" />
                  </label>
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
                  <input type="text" value={invitationUrl} readOnly className="flex-1 h-10 px-3 bg-white dark:bg-neutral-700 border rounded-lg text-sm" />
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
      <DigitalCheckinDashboard open={showCheckin} onClose={() => setShowCheckin(false)} />
      <SOPTaskChecklist open={showSOP} onClose={() => setShowSOP(false)} />
      <AutoReportGenerator open={showAutoReport} onClose={() => setShowAutoReport(false)} />
      <BenchmarkSquare open={showBenchmark} onClose={() => setShowBenchmark(false)} />
      <KPIIncentivePanel open={showKPIIncentive} onClose={() => setShowKPIIncentive(false)} />
    </div>
  );
};