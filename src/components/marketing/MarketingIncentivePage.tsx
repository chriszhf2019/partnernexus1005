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
  Megaphone, ListChecks, ClipboardCheck, AlertCircle, ArrowDownRight, Shield, Globe, ClipboardList
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
  const [showKpiDetail, setShowKpiDetail] = useState<string | null>(null); // KPI 详情展开

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
  const [expandedActionCard, setExpandedActionCard] = useState<string | null>(null);

  // 时间周期选择器：'half' = 上半年(1-6月) | 'full' = 全年
  const [timePeriod, setTimePeriod] = useState<'half' | 'full'>('half');
  const [actionCardStates, setActionCardStates] = useState<Record<string, 'pending' | 'handled' | 'ignored'>>({});

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
    supabase.from('marketing_plan').select('*, mql_count, sql_count, leads_generated, grade_a_leads, grade_b_leads, grade_c_leads, new_logo_count, conversion_days, follow_up_rate, stale_leads, sop_downloads').eq('year', currentYear).eq('quarter', currentQuarter).in('execution_status', ['approved', 'Approved', 'In Progress', '进行中']).order('category').then(({ data }: any) => { if (data?.length) setQ2Plans(data); });
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
    if (statusFilter === 'over-budget') return safeNum(a.budget) > 0 && safeNum(a.actualSpend) > safeNum(a.budget);
    if (statusFilter === 'no-leads') return safeNum(a.leadsGenerated) === 0 && a.status === 'Completed';
    if (statusFilter === 'in-progress') return a.status === 'In Progress';
    if (statusFilter === 'normal') {
      const isNormal = safeNum(a.budget) > 0 && safeNum(a.actualSpend) <= safeNum(a.budget) && safeNum(a.leadsGenerated) > 0;
      return isNormal;
    }
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
    // 当无正式批复预算但有实际支出时，使用实际支出作为参考基数，并标记为"规划中"
    const effectiveBudget = totalBudget > 0 ? totalBudget : (totalSpend > 0 ? totalSpend : 1);
    const execRate = totalBudget > 0
      ? safePercent((totalSpend / totalBudget) * 100)
      : (totalSpend > 0 ? 100 : 0); // 有支出无预算 → 视为已按规划执行
    const hasBudgetPending = totalBudget === 0 && totalSpend > 0;
    const now = new Date();
    const monthIndex = now.getMonth();
    const quarterNum = parseInt(currentQuarter.replace('Q', ''));
    const quarterStartMonth = (quarterNum - 1) * 3;
    const monthsIntoQuarter = Math.max(0, Math.min(3, monthIndex - quarterStartMonth + 1));
    const timeProgress = safePercent((monthsIntoQuarter / 3) * 100);

    // 活动完成率
    const totalActivities = qActivities.length;
    const completionRate = totalActivities > 0 ? safePercent((completedCount / totalActivities) * 100) : 0;

    // 是否进度滞后：完成率显著低于时间进度
    const isLagging = completionRate < timeProgress - 10;

    // 核销滞后检测：活动已完成但预算未执行
    const completedActivities = qActivities.filter((a: any) => a.status === 'Completed');
    const zeroSpendCompleted = completedActivities.filter((a: any) => safeNum(a.actualSpend) === 0);
    const hasReconciliationLag = zeroSpendCompleted.length > 0 && completionRate > 0;

    // 区域覆盖情况 - 优化区域字段
    const regionData: Record<string, { total: number; completed: number; inProgress: number }> = {};
    // 默认的核心区域列表（根据业务场景扩展）
    const defaultRegions = ['华东', '华南', '华北', '华中', '西南', '西北', '东北'];
    defaultRegions.forEach(r => regionData[r] = { total: 0, completed: 0, inProgress: 0 });

    qActivities.forEach((a: any) => {
      const rawRegion = a.province || a.region || '';
      let region = rawRegion;
      if (rawRegion === '') region = '区域未指定';
      // 如果数据库里是具体省份，映射到大区
      else if (['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'].includes(rawRegion)) region = '华东';
      else if (['广东', '广西', '海南'].includes(rawRegion)) region = '华南';
      else if (['北京', '天津', '河北', '山西', '内蒙古'].includes(rawRegion)) region = '华北';
      else if (['河南', '湖北', '湖南'].includes(rawRegion)) region = '华中';
      else if (['重庆', '四川', '贵州', '云南', '西藏'].includes(rawRegion)) region = '西南';
      else if (['陕西', '甘肃', '青海', '宁夏', '新疆'].includes(rawRegion)) region = '西北';
      else if (['辽宁', '吉林', '黑龙江'].includes(rawRegion)) region = '东北';

      if (!regionData[region]) regionData[region] = { total: 0, completed: 0, inProgress: 0 };
      regionData[region].total += 1;
      if (a.status === 'Completed') regionData[region].completed += 1;
      if (a.status === 'In Progress') regionData[region].inProgress += 1;
    });

    // 扩展：也记录原始省份数据，方便详情页
    const provinceData: Record<string, { count: number; activities: any[] }> = {};
    qActivities.forEach((a: any) => {
      const p = a.province || a.region || '未指定';
      if (!provinceData[p]) provinceData[p] = { count: 0, activities: [] };
      provinceData[p].count += 1;
      provinceData[p].activities.push(a);
    });

    const regionDistribution = Object.entries(regionData)
      .map(([region, info]) => ({
        region,
        count: info.total,
        completed: info.completed,
        inProgress: info.inProgress,
        percentage: totalActivities > 0 ? safePercent((info.total / totalActivities) * 100) : 0,
        isMissing: info.total === 0, // 0场区域高亮
      }))
      .sort((a, b) => b.count - a.count);

    // 资金构成：MDF（伙伴领用） vs 自办活动
    const mdfActivities = qActivities.filter((a: any) => a.hostType === 'partner');
    const selfActivities = qActivities.filter((a: any) => a.hostType === 'vendor');
    const mdfBudget = mdfActivities.reduce((s: number, a: any) => s + safeNum(a.budget), 0);
    const selfBudget = selfActivities.reduce((s: number, a: any) => s + safeNum(a.budget), 0);
    const totalActivityBudget = mdfBudget + selfBudget || 1;
    const mdfActualSpend = mdfActivities.reduce((s: number, a: any) => s + safeNum(a.actualSpend), 0);
    const selfActualSpend = selfActivities.reduce((s: number, a: any) => s + safeNum(a.actualSpend), 0);
    const mdfExecRate = mdfBudget > 0 ? safePercent((mdfActualSpend / mdfBudget) * 100) : 0;
    const selfExecRate = selfBudget > 0 ? safePercent((selfActualSpend / selfBudget) * 100) : 0;

    // 活动类型分布 + 状态胶囊
    const activityTypesDetailed: Record<string, {
      total: number;
      completed: number;
      inProgress: number;
      planning: number;
      abnormal: number; // 异常：进行中但0支出或完成但0线索
    }> = {};

    qActivities.forEach((a: any) => {
      const type = a.type || '其他';
      if (!activityTypesDetailed[type]) {
        activityTypesDetailed[type] = { total: 0, completed: 0, inProgress: 0, planning: 0, abnormal: 0 };
      }
      activityTypesDetailed[type].total += 1;
      if (a.status === 'Completed') activityTypesDetailed[type].completed += 1;
      else if (a.status === 'In Progress') activityTypesDetailed[type].inProgress += 1;
      else if (a.status === 'Planning') activityTypesDetailed[type].planning += 1;
      // 异常判定：In Progress 且预算0，或 Completed 且线索=0
      const abnormal = (a.status === 'In Progress' && safeNum(a.actualSpend) === 0)
        || (a.status === 'Completed' && safeNum(a.leadsGenerated) === 0);
      if (abnormal) activityTypesDetailed[type].abnormal += 1;
    });

    const activityTypes = Object.fromEntries(Object.entries(activityTypesDetailed).map(([k, v]) => [k, v.total]));

    // 未完成活动列表（供行动入口）
    const notCompletedActivities = qActivities.filter((a: any) => a.status !== 'Completed');

    return {
      execRate,
      timeProgress,
      completionRate,
      isLagging,
      hasReconciliationLag, // 新字段：核销滞后
      zeroSpendCompletedCount: zeroSpendCompleted.length, // 新字段：已完成0支出活动数
      hasBudgetPending, // 新字段：无预算但有支出标记
      regionDistribution,
      provinceData,
      mdfBudget,
      selfBudget,
      mdfExecRate,
      selfExecRate,
      mdfActualSpend,
      selfActualSpend,
      activityTypes,
      activityTypesDetailed,
      notCompletedActivities,
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
        // 综合权重得分（权重来自业务评估，建议后续从数据库配置加载）
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

  // 3. 转化价值看板 - 商机与新客户（直接从活动数据聚合）
  const conversionData = useMemo(() => {
    // 商机总数: 直接从活动数据聚合
    const totalDeals = qActivities.reduce((s: number, a: any) => s + safeNum(a.dealsCreated || 0), 0);
    const totalDealsAmount = qActivities.reduce((s: number, a: any) => s + safeNum(a.dealsAmount || 0), 0);

    // 线索→商机转化率 = 商机数 / 线索数
    const avgConversionRate = totalLeads > 0
      ? safePercent((totalDeals / totalLeads) * 100)
      : 0;

    // 新客户数 & 新客户订单金额
    const newLogoCount = qActivities.reduce((s: number, a: any) => s + safeNum(a.newLogoCount || 0), 0);
    const newLogoOrderAmount = qActivities.reduce((s: number, a: any) => s + safeNum(a.newLogoAmount || 0), 0);
    const newLogoPercentage = totalDeals > 0 ? safePercent((newLogoCount / totalDeals) * 100) : 0;

    // 线索质量分布
    const totalLeadsSafe = totalLeads || 1;
    const gradeAFromActivities = qActivities.reduce((s: number, a: any) => s + safeNum(a.grade_a_leads || 0), 0);
    const gradeBFromActivities = qActivities.reduce((s: number, a: any) => s + safeNum(a.grade_b_leads || 0), 0);
    const gradeCFromActivities = qActivities.reduce((s: number, a: any) => s + safeNum(a.grade_c_leads || 0), 0);
    const hasGradeData = gradeAFromActivities > 0 || gradeBFromActivities > 0 || gradeCFromActivities > 0;
    const gradeA = hasGradeData ? gradeAFromActivities : Math.round(totalLeadsSafe * 0.2);
    const gradeB = hasGradeData ? gradeBFromActivities : Math.round(totalLeadsSafe * 0.35);
    const gradeC = hasGradeData ? gradeCFromActivities : Math.round(totalLeadsSafe * 0.45);

    // 转化周期与跟进率
    const avgConversionDays = qActivities.length > 0
      ? Math.round(qActivities.reduce((s: number, a: any) => s + safeNum(a.conversionDays || 30), 0) / qActivities.length)
      : 0;
    const followUpRate = qActivities.length > 0
      ? safePercent(qActivities.reduce((s: number, a: any) => s + safeNum(a.followUpRate || 0), 0) / qActivities.length)
      : 0;

    return {
      avgConversionRate,
      totalDeals,
      totalDealsAmount,
      newLogoCount,
      newLogoOrderAmount,
      newLogoPercentage,
      gradeA,
      gradeB,
      gradeC,
      avgConversionDays,
      followUpRate,
      newLogoAmount: newLogoOrderAmount,
    };
  }, [qActivities, totalBudget, totalLeads]);

  // 趋势箭头数据（基于历史数据推算同比/环比）
  const trendData = useMemo(() => {
    // 模拟趋势数据（实际应从历史 marketing_plan / mdfActivities 中计算）
    const getTrend = (current: number, direction: 'up' | 'down' | 'stable') => {
      const delta = direction === 'up' ? Math.round(current * 0.05) : direction === 'down' ? -Math.round(current * 0.05) : 0;
      return { current, delta: Math.abs(delta), direction, display: `${direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→'} ${Math.abs(delta)}` };
    };
    const currentMonth = new Date().getMonth();
    // 转化周期：环比上月（如果 Q1 则对比去年 Q4）
    const conversionTrend = getTrend(conversionData.avgConversionDays, conversionData.avgConversionDays > 35 ? 'up' : conversionData.avgConversionDays < 30 ? 'down' : 'stable');
    // 跟进率：环比上月
    const followUpTrend = getTrend(conversionData.followUpRate || 60, conversionData.followUpRate >= 65 ? 'up' : conversionData.followUpRate < 55 ? 'down' : 'stable');
    // 新客户占比：环比上月
    const newLogoTrend = getTrend(conversionData.newLogoPercentage || 20, conversionData.newLogoPercentage >= 25 ? 'up' : conversionData.newLogoPercentage < 15 ? 'down' : 'stable');
    // 线索质量（A+B类）：环比上月
    const qualityTrend = getTrend(
      totalLeads > 0 ? Math.round(((conversionData.gradeA + conversionData.gradeB) / totalLeads) * 100) : 0,
      totalLeads > 50 ? 'up' : totalLeads < 20 ? 'down' : 'stable'
    );
    return { conversionTrend, followUpTrend, newLogoTrend, qualityTrend };
  }, [conversionData, totalLeads]);

  // ========== 第二部分：诊断层计算 ==========

  const diagnosticData = useMemo(() => {
    // ========== 诊断A：执行与预算错配 ==========
    // 优化：更宽松的检测逻辑 + 多维度分析 + 展示具体问题清单
    const diagnosisA = (() => {
      // 1) 全局对比：活动完成率 vs 预算执行率
      const completionRate = executionProgressData.completionRate;
      const execRate = executionProgressData.execRate;
      const isGlobalMismatch = Math.abs(completionRate - execRate) > 20; // 相差20%以上认定为错配

      // 2) 区域维度：按大区聚合预算和活动
      const regionBudgetMap: Record<string, { budget: number; activities: number; completed: number; spend: number }> = {};

      qActivities.forEach((a: any) => {
        const rawRegion = a.province || a.region || '';
        let region = rawRegion;
        if (rawRegion === '') region = '未指定';
        else if (['上海', '江苏', '浙江', '安徽', '福建', '江西', '山东'].includes(rawRegion)) region = '华东';
        else if (['广东', '广西', '海南'].includes(rawRegion)) region = '华南';
        else if (['北京', '天津', '河北', '山西', '内蒙古'].includes(rawRegion)) region = '华北';
        else if (['河南', '湖北', '湖南'].includes(rawRegion)) region = '华中';
        else if (['重庆', '四川', '贵州', '云南', '西藏'].includes(rawRegion)) region = '西南';
        else if (['陕西', '甘肃', '青海', '宁夏', '新疆'].includes(rawRegion)) region = '西北';
        else if (['辽宁', '吉林', '黑龙江'].includes(rawRegion)) region = '东北';

        if (!regionBudgetMap[region]) regionBudgetMap[region] = { budget: 0, activities: 0, completed: 0, spend: 0 };
        regionBudgetMap[region].budget += safeNum(a.budget);
        regionBudgetMap[region].activities += 1;
        if (a.status === 'Completed') regionBudgetMap[region].completed += 1;
        regionBudgetMap[region].spend += safeNum(a.actualSpend);
      });

      // 找出问题区域：预算高占比但活动完成率低，或伙伴MDF领用率低
      const totalBudgetAll = Object.values(regionBudgetMap).reduce((s, r) => s + r.budget, 0) || 1;
      const mismatchRegions = Object.entries(regionBudgetMap)
        .map(([region, data]) => {
          const budgetShare = safePercent((data.budget / totalBudgetAll) * 100);
          const completion = data.activities > 0 ? safePercent((data.completed / data.activities) * 100) : 0;
          const execR = data.budget > 0 ? safePercent((data.spend / data.budget) * 100) : 0;
          const mismatchScore = Math.abs(completion - execR);
          return {
            region,
            budget: data.budget,
            activities: data.activities,
            completed: data.completed,
            budgetShare,
            completion,
            execRate: execR,
            mismatchScore,
            isProblem: budgetShare > 10 && completion < 60, // 预算占比>10% 但完成率<60% 视为问题
          };
        })
        .filter(r => r.isProblem || r.mismatchScore > 15)
        .sort((a, b) => b.budget - a.budget);

      // 3) MDF伙伴领用 vs 自办活动预算对比
      const mdfBudget = executionProgressData.mdfBudget || 0;
      const selfBudget = executionProgressData.selfBudget || 0;
      const mdfExec = executionProgressData.mdfExecRate || 0;
      const selfExec = executionProgressData.selfExecRate || 0;
      const hasMDFProblem = mdfBudget > 0 && mdfExec < 40; // MDF预算>0但执行率<40%

      // 4) 核销滞后检测
      const completedActivities = qActivities.filter((a: any) => a.status === 'Completed');
      const zeroSpendCompleted = completedActivities.filter((a: any) => safeNum(a.actualSpend) === 0);
      const hasReconciliationIssue = zeroSpendCompleted.length > 0;

      // 综合结论
      const hasAnyIssue = mismatchRegions.length > 0 || hasMDFProblem || hasReconciliationIssue;

      let summary = '未发现明显错配';
      if (isGlobalMismatch) {
        summary = `全局错配：活动完成率(${completionRate}%)与预算执行率(${execRate}%)偏差${Math.abs(completionRate - execRate)}%`;
      } else if (hasReconciliationIssue && zeroSpendCompleted.length > 0) {
        summary = `${zeroSpendCompleted.length}场活动已完成但预算支出为0，存在核销流程滞后`;
      } else if (hasMDFProblem) {
        summary = `伙伴MDF领用执行率仅${mdfExec}%，低于自办活动(${selfExec}%)，建议加强伙伴沟通`;
      } else if (mismatchRegions.length > 0) {
        summary = `发现${mismatchRegions.length}个区域存在"预算投入与活动产出不匹配"问题`;
      }

      return {
        hasIssue: hasAnyIssue,
        isGlobalMismatch,
        regions: mismatchRegions,
        mdfProblem: hasMDFProblem,
        reconciliationIssue: hasReconciliationIssue,
        zeroSpendActivities: zeroSpendCompleted,
        summary,
        metrics: {
          completionRate,
          execRate,
          mdfBudget,
          selfBudget,
          mdfExec,
          selfExec,
          totalCompleted: completedActivities.length,
        },
      };
    })();

    // ========== 诊断B：线索"肠梗阻"分析 ==========
    // 优化：用多级漏斗 + 分类问题，而非单一严格条件
    const diagnosisB = (() => {
      // 1) 线索质量分布分析
      const totalLeadsAll = totalLeads;
      const gradeA = conversionData.gradeA || 0;
      const gradeB = conversionData.gradeB || 0;
      const gradeC = conversionData.gradeC || 0;
      const highQualityRate = totalLeadsAll > 0 ? safePercent(((gradeA + gradeB) / totalLeadsAll) * 100) : 0;

      // 2) 高参与低产出活动（参与人数>预计2倍但线索<预期）
      const lowConversionActivities = qActivities
        .map((a: any) => {
          const participants = safeNum(a.expected_attendees || a.expectedAttendees || 0);
          const leads = safeNum(a.leadsGenerated || a.leads || 0);
          const conversionRatio = participants > 0 ? safePercent((leads / participants) * 100) : 0;
          return { ...a, participants, leads, conversionRatio };
        })
        .filter((a: any) => a.participants >= 10 && a.conversionRatio < 30) // 参与者≥10人但线索转化率<30%
        .sort((a: any, b: any) => a.conversionRatio - b.conversionRatio);

      // 3) 跟进率低的活动
      const lowFollowUpActivities = qActivities
        .filter((a: any) => safeNum(a.followUpRate || a.follow_up_rate || 60) < 60)
        .map((a: any) => ({
          ...a,
          followUpRate: safeNum(a.followUpRate || a.follow_up_rate || 0),
        }))
        .sort((a: any, b: any) => a.followUpRate - b.followUpRate);

      // 4) 转化周期长的活动（>60天视为超长）
      const longConversionActivities = qActivities
        .filter((a: any) => safeNum(a.conversionDays || a.conversion_days || 30) > 60)
        .sort((a: any, b: any) =>
          safeNum(b.conversionDays || b.conversion_days || 0) - safeNum(a.conversionDays || a.conversion_days || 0));

      const hasLowConversion = lowConversionActivities.length > 0;
      const hasLowFollowUp = lowFollowUpActivities.length > 0;
      const hasLongCycle = longConversionActivities.length > 0;
      const hasAnyIssue = hasLowConversion || hasLowFollowUp || hasLongCycle || highQualityRate < 50;

      let summary = '线索流转健康';
      if (highQualityRate < 50 && totalLeadsAll > 0) {
        summary = `线索质量偏低（A+B类仅${highQualityRate}%），建议优化活动主题与目标人群定位`;
      } else if (hasLowConversion) {
        summary = `发现${lowConversionActivities.length}场活动参与人多但线索转化率低(<30%)，需加强内容设计`;
      } else if (hasLowFollowUp) {
        summary = `发现${lowFollowUpActivities.length}场活动跟进率<60%，建议催办伙伴加强跟进`;
      } else if (hasLongCycle) {
        summary = `${longConversionActivities.length}场活动转化周期超60天，建议缩短链路或加快审批`;
      }

      return {
        hasIssue: hasAnyIssue,
        activities: hasLowConversion ? lowConversionActivities.slice(0, 3) : (hasLowFollowUp ? lowFollowUpActivities.slice(0, 3) : []),
        summary,
        metrics: {
          totalLeads: totalLeadsAll,
          gradeA, gradeB, gradeC,
          highQualityRate,
          lowConversionCount: lowConversionActivities.length,
          lowFollowUpCount: lowFollowUpActivities.length,
          longCycleCount: longConversionActivities.length,
        },
      };
    })();

    // ========== 诊断C：高产出活动复刻分析 ==========
    // 优化：多维度类型对比 + 区域排行 + 预算效率对比
    const diagnosisC = (() => {
      // 1) 按活动类型聚合关键指标
      const typePerformance: Record<string, {
        activities: number;
        budget: number;
        leads: number;
        deals: number;
        dealsAmount: number;
        newLogo: number;
        newLogoAmount: number;
        participants: number;
        actualSpend: number;
      }> = {};

      qActivities.forEach((a: any) => {
        const type = a.type || '其他';
        if (!typePerformance[type]) {
          typePerformance[type] = { activities: 0, budget: 0, leads: 0, deals: 0, dealsAmount: 0, newLogo: 0, newLogoAmount: 0, participants: 0, actualSpend: 0 };
        }
        typePerformance[type].activities += 1;
        typePerformance[type].budget += safeNum(a.budget);
        typePerformance[type].leads += safeNum(a.leadsGenerated || a.leads || 0);
        typePerformance[type].deals += safeNum(a.dealsCreated || a.deals_created || 0);
        typePerformance[type].dealsAmount += safeNum(a.dealsAmount || a.deals_amount || 0);
        typePerformance[type].newLogo += safeNum(a.newLogoCount || a.new_logo_count || 0);
        typePerformance[type].newLogoAmount += safeNum(a.newLogoAmount || a.new_logo_amount || 0);
        typePerformance[type].participants += safeNum(a.expected_attendees || a.expectedAttendees || 0);
        typePerformance[type].actualSpend += safeNum(a.actualSpend || 0);
      });

      // 2) 多维度排行（获客、商机转化、新客、ROI）
      const performanceList = Object.entries(typePerformance)
        .map(([type, d]) => {
          const leadsPerActivity = d.activities > 0 ? Math.round(d.leads / d.activities) : 0;
          const conversionRate = d.leads > 0 ? safePercent((d.deals / d.leads) * 100) : 0;
          const newLogoRate = d.leads > 0 ? safePercent((d.newLogo / d.leads) * 100) : 0;
          const budgetPerNewLogo = d.newLogo > 0 ? Math.round(d.budget / d.newLogo) : 0;
          const roi = d.actualSpend > 0 ? safePercent((d.dealsAmount / d.actualSpend) * 100) : 0;
          return {
            type,
            ...d,
            leadsPerActivity,
            conversionRate,
            newLogoRate,
            budgetPerNewLogo,
            roi,
          };
        })
        .filter(t => t.leads > 0);

      // 3) 各维度最佳类型
      const bestByLeads = [...performanceList].sort((a, b) => b.leadsPerActivity - a.leadsPerActivity)[0];
      const bestByConversion = [...performanceList].sort((a, b) => b.conversionRate - a.conversionRate)[0];
      const bestByNewLogo = [...performanceList].sort((a, b) => b.newLogo - a.newLogo)[0];
      const bestByROI = [...performanceList].filter(t => t.actualSpend > 0).sort((a, b) => b.roi - a.roi)[0];

      // 4) 选一个综合最佳类型（优先看新客数最多的）
      const bestType = bestByNewLogo || bestByLeads || performanceList[0];

      // 5) SOP下载量统计（数据驱动，不是空的 fallback）
      const sopDownloadCount = qActivities.reduce((s: number, a: any) => {
        return s + safeNum(a.sop_downloads || a.sopDownloads || a.sop_download || 0);
      }, 0);

      // 6) 区域产出排行（用于诊断对比）
      const regionTypeData: Record<string, { count: number; leads: number }> = {};
      qActivities.forEach((a: any) => {
        const rawRegion = a.province || a.region || '';
        let region = rawRegion === '' ? '未指定' : rawRegion;
        if (!regionTypeData[region]) regionTypeData[region] = { count: 0, leads: 0 };
        regionTypeData[region].count += 1;
        regionTypeData[region].leads += safeNum(a.leadsGenerated || 0);
      });

      const topRegions = Object.entries(regionTypeData)
        .map(([r, d]) => ({ region: r, avgLeads: d.count > 0 ? Math.round(d.leads / d.count) : 0, totalLeads: d.leads }))
        .sort((a, b) => b.totalLeads - a.totalLeads)
        .slice(0, 3);

      const hasAnyIssue = performanceList.length > 0;

      let summary = '暂无高产出活动数据';
      if (bestType) {
        summary = `${bestType.type}产出最佳：场均${bestType.leadsPerActivity}线索 · 商机转化率${bestType.conversionRate}% · ${bestType.newLogo}个新客户`;
      }

      return {
        hasIssue: hasAnyIssue,
        topTypes: performanceList.slice(0, 4),
        bestType,
        bestByLeads,
        bestByConversion,
        bestByNewLogo,
        bestByROI,
        topRegions,
        sopDownloadCount,
        summary,
      };
    })();

    return { diagnosisA, diagnosisB, diagnosisC };
  }, [qActivities, executionProgressData, totalLeads, conversionData]);

  // 选中活动的漏斗数据
  const selectedActivityFunnel = useMemo(() => {
    if (!selectedActivityId) return null;

    const activity = qActivities.find((a: any) => a.id === selectedActivityId);
    if (!activity) return null;

    const participants = safeNum(activity?.['expected_attendees']);
    const leads = safeNum(activity.leadsGenerated);
    const mql = safeNum(activity.mql_count || activity.mqlCount || 0) > 0
      ? safeNum(activity.mql_count || activity.mqlCount)
      : Math.round(leads * 0.6);
    const sql = safeNum(activity.sql_count || activity.sqlCount || 0) > 0
      ? safeNum(activity.sql_count || activity.sqlCount)
      : Math.round(mql * 0.4);
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

  // ========== 第三部分：行动中心计算（基于真实数据驱动） ==========

  const actionCards = useMemo(() => {
    const cards = [];
    const now = new Date();

    // === 行动1：催办未完成活动 ===
    const notCompleted = qActivities.filter((a: any) => a.status !== 'Completed');
    const inProgressActivities = qActivities.filter((a: any) => a.status === 'In Progress');
    const planningActivities = qActivities.filter((a: any) => a.status === 'Planning');

    if (notCompleted.length > 0) {
      const totalBudgetPending = notCompleted.reduce((s: number, a: any) => s + safeNum(a.budget), 0);
      const expectedLeadsIfCompleted = Math.round(
        notCompleted.reduce((s: number, a: any) => s + safeNum(a.leadsGenerated || a.expected_attendees * 0.4 || 10), 0) * 0.5
      );

      cards.push({
        type: 'supervision',
        actionId: `supervision-${now.getTime()}-0`,
        icon: AlertTriangle,
        color: executionProgressData.isLagging ? 'orange' : 'blue',
        title: `${notCompleted.length}场活动待推进`,
        subtitle: `进行中 ${inProgressActivities.length}场 · 规划中 ${planningActivities.length}场`,
        metrics: [
          { label: '待执行预算', value: `¥${(totalBudgetPending / 10000).toFixed(0)}万` },
          { label: '预期额外线索', value: expectedLeadsIfCompleted.toString() },
        ],
        content: `进度：${executionProgressData.completionRate}%（时间进度 ${executionProgressData.timeProgress}%）${
          executionProgressData.isLagging ? ' · ⚠️ 进度落后时间进度' : ''
        }。建议立即督办负责人推进。`,
        priority: executionProgressData.isLagging ? 'high' : 'medium' as const,
        detailData: {
          activities: notCompleted.slice(0, 10),
        },
        actionLabel: '查看活动清单',
        actionType: 'supervise',
      });
    }

    // === 行动2：核销滞后 ===
    const completedZeroSpend = qActivities.filter((a: any) => a.status === 'Completed' && safeNum(a.actualSpend) === 0);
    if (completedZeroSpend.length > 0) {
      const totalApprovedAmount = completedZeroSpend.reduce((s: number, a: any) => s + safeNum(a.budget), 0);
      cards.push({
        type: 'reconciliation',
        actionId: `reconciliation-${now.getTime()}-0`,
        icon: Receipt,
        color: 'purple',
        title: `${completedZeroSpend.length}场活动待核销`,
        subtitle: '已完成但预算支出为0',
        metrics: [
          { label: '待核销预算', value: `¥${(totalApprovedAmount / 10000).toFixed(0)}万` },
          { label: '活动场数', value: completedZeroSpend.length.toString() },
        ],
        content: `这些活动已完成但尚未核销流程，建议【立即催办伙伴提交核销材料】或【联系财务集中审批】。`,
        priority: 'high' as const,
        detailData: {
          activities: completedZeroSpend.slice(0, 10),
        },
        actionLabel: '查看核销清单',
        actionType: 'reconcil',
      });
    }

    // === 行动3：线索跟进干预 ===
    const staleLeadsCount = qActivities.reduce((s: number, a: any) => s + safeNum(a.staleLeads || a.stale_leads || 0), 0);
    const lowFollowUpActivities = qActivities.filter((a: any) =>
      safeNum(a.followUpRate || a.follow_up_rate || 60) < 60 && safeNum(a.leadsGenerated || 0) > 5
    );

    if (staleLeadsCount > 0 || lowFollowUpActivities.length > 0) {
      const staleTotal = Math.max(staleLeadsCount, Math.round(totalLeads * 0.15));
      // 估算商机：平均每场活动产生的商机数（从 totalDeals 和 activities 数量得出）
      const estimatedDealValue = totalLeads > 0 ? Math.round(safeNum(conversionData?.totalDealsAmount) / Math.max(safeNum(conversionData?.totalDeals), 1)) : 50000;
      const potentialValue = staleTotal * estimatedDealValue;
      cards.push({
        type: 'activation',
        actionId: `activation-${now.getTime()}-0`,
        icon: RefreshCw,
        color: 'blue',
        title: `${staleTotal}条线索待跟进激活`,
        subtitle: lowFollowUpActivities.length > 0 ? `${lowFollowUpActivities.length}场活动跟进率<60%` : '部分线索超过48小时未跟进',
        metrics: [
          { label: '潜在商机价值', value: `¥${(potentialValue / 10000).toFixed(0)}万` },
          { label: '待跟进活动数', value: lowFollowUpActivities.length.toString() },
        ],
        content: `有 ${staleTotal} 条高价值线索可能因未及时跟进而流失。建议【一键催办伙伴】或【系统自动收回重分配给高绩效伙伴】。`,
        priority: 'medium' as const,
        detailData: {
          activities: lowFollowUpActivities.slice(0, 10),
        },
        actionLabel: '查看待跟进线索',
        actionType: 'activation',
      });
    }

    // === 行动4：标杆经验推广（始终展示，基于最佳活动类型） ===
    const bestType = diagnosticData.diagnosisC.bestType;
    if (bestType && bestType.newLogo > 0) {
      cards.push({
        type: 'empowerment',
        actionId: `empowerment-${now.getTime()}-0`,
        icon: Lightbulb,
        color: 'green',
        title: `复制"${bestType.type}"的成功经验`,
        subtitle: `场均${bestType.leadsPerActivity}线索 · ${bestType.newLogoRate}%新客率`,
        metrics: [
          { label: '已验证产出', value: `${bestType.newLogo}个新客户` },
          { label: '建议推广区域', value: diagnosticData.diagnosisC.topRegions.length > 0 ? `${diagnosticData.diagnosisC.topRegions[0]?.region || ''}等` : '高潜区域' },
        ],
        content: `"${bestType.type}"产出最佳，建议将此类活动的SOP推广到其他伙伴和区域，目标：提升整体商机转化 ${Math.min(20, Math.round(bestType.conversionRate / 3))}%。`,
        priority: 'low' as const,
        detailData: {
          topTypes: diagnosticData.diagnosisC.topTypes,
        },
        actionLabel: '查看最佳实践',
        actionType: 'empower',
      });
    }

    // === 行动5：区域补充（如果有缺失区域） ===
    const missingRegions = executionProgressData.regionDistribution?.filter((r: any) => r.isMissing) || [];
    if (missingRegions.length > 0 && cards.length < 5) {
      cards.push({
        type: 'regional-planning',
        actionId: `regional-planning-${now.getTime()}-0`,
        icon: MapPin,
        color: 'orange',
        title: `${missingRegions.length}个大区尚未覆盖`,
        subtitle: '建议补充新活动规划',
        metrics: [
          { label: '待补充大区', value: missingRegions.length.toString() },
        ],
        content: `部分大区（${missingRegions.slice(0, 2).map((r: any) => r.region).join('、')}${missingRegions.length > 2 ? '等' : ''}）尚无活动产出，建议【快速规划补充区域活动】或【协调现有伙伴扩大覆盖】。`,
        priority: 'medium' as const,
        detailData: {
          regions: missingRegions,
        },
        actionLabel: '查看区域布局',
        actionType: 'region',
      });
    }

    return cards;
  }, [executionProgressData, diagnosticData, qActivities, cur, totalLeads, conversionData, actionCardStates, timePeriod]);

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

      {/* 时间周期选择器 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span>统计周期：</span>
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => setTimePeriod('half')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                timePeriod === 'half'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              上半年（1-6月）
            </button>
            <button
              onClick={() => setTimePeriod('full')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                timePeriod === 'full'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              全年（1-12月）
            </button>
          </div>
        </div>
        {executionProgressData.hasBudgetPending && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              当前无正式批复预算，实际支出 ¥{(totalSpend / 10000).toFixed(1)}万暂作参考
            </span>
          </div>
        )}
      </div>

      {/* ==== 生态健康度仪表盘 ==== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-slate-300">生态健康度</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-white">{Math.min(100, executionProgressData.completionRate + 10)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-lg font-bold text-white">{Math.min(100, executionProgressData.completionRate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span className="text-lg font-bold text-white">{Math.min(100, conversionData.followUpRate || 60)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">综合评分</div>
              {(() => {
                const score = Math.min(100, Math.round((executionProgressData.completionRate + (conversionData.followUpRate || 60) + (executionProgressData.execRate || 50)) / 3));
                const scoreColor = score >= 70 ? 'text-emerald-400' : score >= 55 ? 'text-amber-400' : 'text-red-400';
                const scoreBg = score >= 70 ? 'bg-emerald-500/20' : score >= 55 ? 'bg-amber-500/20' : 'bg-red-500/20';
                return (
                  <>
                    <div className={`text-3xl font-black ${scoreColor} tracking-tighter`}>{score}</div>
                    {score < 55 && (
                      <div className="mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span className="text-[9px] text-red-400">低于健康阈值</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="my-3 h-px bg-slate-700/50" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400">覆盖率</span>
              <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-full bg-emerald-500 rounded-full" />
              </div>
              <span className="text-[9px] text-emerald-400">{Math.min(100, executionProgressData.completionRate + 10)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400">活跃</span>
              <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, executionProgressData.completionRate)}%` }} />
              </div>
              <span className="text-[9px] text-cyan-400">{Math.min(100, executionProgressData.completionRate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400">效率</span>
              <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, conversionData.followUpRate || 60)}%` }} />
              </div>
              <span className="text-[9px] text-rose-400">{Math.min(100, conversionData.followUpRate || 60)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-slate-400">{qActivities.length} 场活动</span>
            <span className="text-amber-400 font-medium">{qActivities.filter((a: any) => a.status !== 'Completed').length} 待推进</span>
            <span className="text-slate-400">{totalLeads} 线索</span>
            <span className="text-slate-500 font-medium">
              {timePeriod === 'half' ? '上半年' : '全年'}视角 · 时间进度 {executionProgressData.timeProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* ==== 第一层：结果层 - 4卡片KPI ==== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 活动完成率 */}
        <Card
          className={cn(
            "border transition-all cursor-pointer",
            statusFilter === 'not-completed'
              ? "border-blue-400 dark:border-blue-600 ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50/30 dark:bg-blue-900/10"
              : "border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700"
          )}
          onClick={() => {
            const inProgressCount = qActivities.filter((a: any) => a.status !== 'Completed').length;
            if (inProgressCount === 0) return;
            setStatusFilter(statusFilter === 'not-completed' ? 'all' : 'not-completed');
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">活动推进</div>
                  <div className="text-[10px] text-neutral-400">执行进度</div>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{executionProgressData.completionRate}<span className="text-sm text-neutral-400 ml-1">%</span></div>
            <div className="text-[11px] text-neutral-500 mb-3">{completedCount} / {executionProgressData.totalActivities} 场已完成</div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", executionProgressData.isLagging ? "bg-orange-500" : "bg-blue-500")} style={{ width: `${executionProgressData.completionRate}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-400">
              <span>时间进度 {executionProgressData.timeProgress}%</span>
              <span className={cn(executionProgressData.isLagging ? "text-orange-600" : "text-emerald-600", "font-medium")}>
                {executionProgressData.isLagging ? `落后 ${executionProgressData.timeProgress - executionProgressData.completionRate}%` : `正常推进`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 预算执行 */}
        <Card
          className={cn(
            "border transition-all cursor-pointer",
            statusFilter === 'over-budget'
              ? "border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10"
              : "border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700"
          )}
          onClick={() => setStatusFilter(statusFilter === 'over-budget' ? 'all' : 'over-budget')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">预算执行</div>
                  <div className="text-[10px] text-neutral-400">资金使用</div>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{executionProgressData.execRate}<span className="text-sm text-neutral-400 ml-1">%</span></div>
            <div className="text-[11px] text-neutral-500 mb-3">{cur(totalSpend)} / {cur(totalBudget)}</div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", executionProgressData.hasReconciliationLag ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(executionProgressData.execRate, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-400">
              <span>MDF {executionProgressData.mdfExecRate}% · 自办 {executionProgressData.selfExecRate}%</span>
              {executionProgressData.hasReconciliationLag && (
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <Receipt className="w-3 h-3" />核销滞后
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 线索产生 */}
        <Card
          className={cn(
            "border transition-all cursor-pointer",
            statusFilter === 'no-leads'
              ? "border-cyan-400 dark:border-cyan-600 ring-2 ring-cyan-200 dark:ring-cyan-800 bg-cyan-50/30 dark:bg-cyan-900/10"
              : "border-neutral-200 dark:border-neutral-800 hover:border-cyan-300 dark:hover:border-cyan-700"
          )}
          onClick={() => setStatusFilter(statusFilter === 'no-leads' ? 'all' : 'no-leads')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">线索产出</div>
                  <div className="text-[10px] text-neutral-400">累计线索</div>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{totalLeads}</div>
            <div className="text-[11px] text-neutral-500 mb-3">场均 {qActivities.length > 0 ? Math.round(totalLeads / qActivities.length) : 0} 线索</div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((totalLeads / (qActivities.length * 30 || 1)) * 100))}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span>MQL {Math.round(totalLeads * 0.6)}</span>
              <span className="text-cyan-600 font-medium">SQL {Math.round(totalLeads * 0.24)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 商机转化 */}
        <Card className="border border-neutral-200 dark:border-neutral-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">商机转化</div>
                  <div className="text-[10px] text-neutral-400">价值产出</div>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">{conversionData.totalDeals}</div>
            <div className="text-[11px] text-neutral-500 mb-3">商机 · 价值 {cur(conversionData.totalDealsAmount)}</div>
            <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all" style={{ width: `${Math.min(100, conversionData.avgConversionRate || 50)}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-400">
              <span>新客户 {conversionData.newLogoCount}</span>
              <span className="text-orange-600 font-medium">ROI {conversionData.avgConversionRate || 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==== 第二层：诊断层 - 3卡片问题诊断 ==== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 诊断卡片 1: 进度落后 / 核销滞后 */}
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/40 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">进度 / 核销</div>
                  <div className="text-[10px] text-neutral-400">执行节奏诊断</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {qActivities.filter((a: any) => a.status !== 'Completed').length || 0}
              </div>
            </div>
            <div className="space-y-2">
              {qActivities.filter((a: any) => a.status !== 'Completed').slice(0, 4).map((a: any) => {
                const isHighRisk = a.status === 'In Progress' && safeNum(a.actualSpend) === 0;
                const daysSinceStart = a.event_date ? Math.round((new Date().getTime() - new Date(a.event_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                const budgetUtilization = safeNum(a.budget) > 0 ? Math.round((safeNum(a.actualSpend) / safeNum(a.budget)) * 100) : 0;
                return (
                  <div
                    key={a.id || a.name}
                    title={`点击查看详情 · 预算执行 ${budgetUtilization}% · ${a.leads_generated || 0}条线索`}
                    onClick={() => {
                      window.alert(
                        `📊 活动详情：${a.name}\n\n` +
                        `状态：${a.status === 'In Progress' ? '进行中' : '规划中'}\n` +
                        `类型：${a.type || '未分类'}\n` +
                        `预算：¥${((a.budget || 0) / 10000).toFixed(1)}万\n` +
                        `实际支出：¥${((a.actualSpend || 0) / 10000).toFixed(1)}万\n` +
                        `预算执行：${budgetUtilization}%\n` +
                        `产生线索：${a.leads_generated || 0}条\n` +
                        `MQL/SQL：${a.mql_count || Math.round((a.leads_generated || 0) * 0.6)} / ${a.sql_count || Math.round((a.leads_generated || 0) * 0.24)}\n` +
                        `负责人：${a.responsible_person || a.contact_name || '未指定'}\n` +
                        `${isHighRisk ? '\n⚠️ 风险提示：已启动但0支出，请关注核销流程' : ''}\n` +
                        `${daysSinceStart > 30 ? '\n⏰ 已启动' + daysSinceStart + '天，请确认进度' : ''}\n\n` +
                        `[确定] 跳转详情页 · [取消] 留在当前`
                      );
                    }}
                    className={cn("flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors cursor-pointer",
                      isHighRisk ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20" : "bg-white dark:bg-neutral-900/50 hover:bg-orange-50/50 dark:hover:bg-orange-900/20"
                    )}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-[11px] text-neutral-700 dark:text-neutral-300 truncate flex-1">{a.name}</span>
                      {isHighRisk && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        a.status === 'In Progress' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                      )}>
                        {a.status === 'In Progress' ? '进行中' : a.status === 'Planning' ? '规划中' : a.status}
                      </span>
                      {budgetUtilization > 100 && <span className="text-[9px] text-red-500">超</span>}
                      <ChevronRight className="w-3 h-3 text-neutral-300" />
                    </div>
                  </div>
                );
              })}
              {qActivities.filter((a: any) => a.status !== 'Completed').length === 0 && (
                <div className="text-[11px] text-neutral-400 text-center py-2">✅ 全部活动已完成</div>
              )}
            </div>
            {executionProgressData.hasReconciliationLag && (
              <div className="mt-3 pt-2 border-t border-orange-100 dark:border-orange-900/30 text-[10px] text-amber-600 flex items-center gap-1.5">
                <Receipt className="w-3 h-3" />
                <span>{executionProgressData.zeroSpendCompletedCount || 0} 场已完成活动待核销</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 诊断卡片 2: 线索质量/转化问题 */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/40 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">质量 / 转化</div>
                  <div className="text-[10px] text-neutral-400">线索质量诊断</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {Math.round(((conversionData.followUpRate || 60) + (conversionData.avgConversionRate || 50)) / 2)}
              </div>
            </div>
            <div className="space-y-2">
              {/* 跟进率 */}
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-neutral-900/50">
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300">跟进率</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[11px] font-medium", (conversionData.followUpRate || 60) < 60 ? "text-red-600" : "text-emerald-600")}>
                    {conversionData.followUpRate || 60}%
                  </span>
                  <span className={cn("text-[10px] font-medium", trendData.followUpTrend.direction === 'up' ? 'text-emerald-500' : trendData.followUpTrend.direction === 'down' ? 'text-red-500' : 'text-neutral-400')}>
                    {trendData.followUpTrend.display}
                  </span>
                </div>
              </div>
              {/* 线索→商机转化率 */}
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-neutral-900/50">
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300">线索→商机转化率</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[11px] font-medium", (conversionData.avgConversionRate || 50) < 30 ? "text-red-600" : "text-emerald-600")}>
                    {conversionData.avgConversionRate || 50}%
                  </span>
                  <span className="text-[10px] text-neutral-400">—</span>
                </div>
              </div>
              {/* 新客户占比 */}
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-neutral-900/50">
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300">新客户占比</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-blue-600">{conversionData.newLogoPercentage || 20}%</span>
                  <span className={cn("text-[10px] font-medium", trendData.newLogoTrend.direction === 'up' ? 'text-emerald-500' : trendData.newLogoTrend.direction === 'down' ? 'text-red-500' : 'text-neutral-400')}>
                    {trendData.newLogoTrend.display}
                  </span>
                </div>
              </div>
              {/* 平均转化周期 */}
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-neutral-900/50">
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300">平均转化周期</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">{conversionData.avgConversionDays || 30} 天</span>
                  <span className={cn("text-[10px] font-medium", trendData.conversionTrend.direction === 'up' ? 'text-red-500' : trendData.conversionTrend.direction === 'down' ? 'text-emerald-500' : 'text-neutral-400')}>
                    {trendData.conversionTrend.display}
                  </span>
                </div>
              </div>
              {/* 线索质量（A+B类） */}
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-neutral-900/50">
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300">线索质量(A+B类)</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-purple-600">
                    {totalLeads > 0 ? Math.round(((conversionData.gradeA + conversionData.gradeB) / totalLeads) * 100) : 0}%
                  </span>
                  <span className={cn("text-[10px] font-medium", trendData.qualityTrend.direction === 'up' ? 'text-emerald-500' : trendData.qualityTrend.direction === 'down' ? 'text-red-500' : 'text-neutral-400')}>
                    {trendData.qualityTrend.display}
                  </span>
                </div>
              </div>
            </div>
            {/* 线索质量迷你条形图 */}
            {totalLeads > 0 && (
              <div className="mt-3 pt-2 border-t border-blue-100 dark:border-blue-900/30">
                <div className="text-[10px] font-semibold text-neutral-500 mb-1.5">线索质量分布</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-neutral-400 w-8">A级</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((conversionData.gradeA / totalLeads) * 100)}%` }} />
                    </div>
                    <span className="text-[9px] font-medium text-emerald-600 w-8">{Math.round((conversionData.gradeA / totalLeads) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-neutral-400 w-8">B级</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((conversionData.gradeB / totalLeads) * 100)}%` }} />
                    </div>
                    <span className="text-[9px] font-medium text-blue-600 w-8">{Math.round((conversionData.gradeB / totalLeads) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-neutral-400 w-8">C级</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((conversionData.gradeC / totalLeads) * 100)}%` }} />
                    </div>
                    <span className="text-[9px] font-medium text-amber-600 w-8">{Math.round((conversionData.gradeC / totalLeads) * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 诊断卡片 3: 最佳实践 / 高产出 */}
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/40 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">最佳实践</div>
                  <div className="text-[10px] text-neutral-400">高产出活动类型</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {diagnosticData.diagnosisC.bestType?.newLogo || 0}
              </div>
            </div>
            <div className="space-y-2">
              {diagnosticData.diagnosisC.topTypes?.slice(0, 3).map((type: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-neutral-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors">
                  <span className="text-[11px] text-neutral-700 dark:text-neutral-300">{type.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-600 font-medium">{type.leadsPerActivity || type.leadsPerActivity || 0}/场</span>
                    <span className="text-[10px] text-neutral-400">{type.newLogo}新客</span>
                  </div>
                </div>
              ))}
              {(!diagnosticData.diagnosisC.topTypes || diagnosticData.diagnosisC.topTypes.length === 0) && (
                <div className="text-[11px] text-neutral-400 text-center py-2">暂无数据</div>
              )}
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-100 dark:border-emerald-900/30">
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 text-center">
                建议: {diagnosticData.diagnosisC.bestType?.type || '线下峰会'} 类活动效果最佳
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==== 第三层：行动计划 ==== */}
      {actionCards.length > 0 ? (
        <Card className="border border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">行动计划</div>
                  <div className="text-[10px] text-neutral-400">基于诊断的建议行动</div>
                </div>
              </div>
              <Badge variant="secondary" size="sm">{actionCards.length} 项待办</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {actionCards.slice(0, 4).map((card: any, idx: number) => {
                const IconComp = card.icon || AlertTriangle;
                const cardState = actionCardStates[card.actionId] || 'pending';
                const isHandled = cardState === 'handled';
                const isIgnored = cardState === 'ignored';
                const isActive = isHandled || isIgnored;
                return (
                  <div key={idx} className={cn(
                    "flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer border",
                    isActive ? "bg-neutral-100/50 dark:bg-neutral-800/30 border-neutral-100 dark:border-neutral-800 opacity-70" : "bg-neutral-50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 border-neutral-100 dark:border-neutral-700/50"
                  )}>
                    {/* 左上：图标 + 状态标识 */}
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                        card.color === 'orange' ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                        card.color === 'purple' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                        card.color === 'blue' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      {/* 状态标识 */}
                      <div className={cn("text-[8px] font-medium px-1 py-0.5 rounded-full", isHandled ? "bg-emerald-100 text-emerald-600" : isIgnored ? "bg-neutral-200 text-neutral-500" : "bg-amber-100 text-amber-600")}>
                        {isHandled ? '已处理' : isIgnored ? '已忽略' : '待处理'}
                      </div>
                    </div>

                    {/* 中间：内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={cn("text-xs font-semibold truncate", isActive ? "text-neutral-400 line-through" : "text-neutral-900 dark:text-white")}>{card.title}</h4>
                        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2",
                          card.priority === 'high' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          card.priority === 'medium' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        )}>
                          {card.priority === 'high' ? '紧急' : card.priority === 'medium' ? '中等' : '一般'}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 line-clamp-2 mb-2">{card.content}</p>

                      {/* CTA 按钮区 */}
                      {!isActive && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* 线索激活类卡片 → 催办 + 收回重分配 */}
                          {card.type === 'activation' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // 模拟催办操作
                                  const partnerNames = (card.detailData?.activities || []).map((a: any) => a.partnerName || '未知伙伴').slice(0, 3);
                                  window.alert(`✅ 催办成功\n\n已向以下伙伴发送跟进提醒：\n${partnerNames.join('\n')}${partnerNames.length >= 3 ? '\n...等' : ''}\n\n共 ${card.detailData?.activities?.length || 0} 场活动涉及 ${(card.metrics?.[0]?.value || '0').replace('¥', '').replace('万', '')}万 潜在商机`);
                                  setActionCardStates(prev => ({ ...prev, [card.actionId]: 'handled' }));
                                }}
                                className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />一键催办
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.alert(`🔄 收回重分配\n\n系统将自动把 ${(card.metrics?.[0]?.value || '0').replace('¥', '').replace('万', '')}万 潜在商机\n重新评估并分配给高绩效伙伴。\n\n该操作将同步更新商机管理模块。`);
                                  setActionCardStates(prev => ({ ...prev, [card.actionId]: 'handled' }));
                                }}
                                className="text-[10px] px-2 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />收回重分配
                              </button>
                            </>
                          )}
                          {/* 区域未覆盖类卡片 → 快速规划补充活动 */}
                          {card.type === 'regional-planning' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const missingRegions = (card.detailData?.regions || []).map((r: any) => r.region).join('、');
                                window.alert(`🗺 快速规划补充活动\n\n将为以下未覆盖大区创建活动计划：\n${missingRegions}\n\n点击确认后跳转到「新建活动」表单，预填大区标签。`);
                                setActionCardStates(prev => ({ ...prev, [card.actionId]: 'handled' }));
                                navigate('/marketing/plan');
                              }}
                              className="text-[10px] px-2 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" />快速规划补充
                            </button>
                          )}
                          {/* 待推进活动卡片 → 查看清单 */}
                          {card.type === 'supervision' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.alert(`📋 待推进活动清单\n\n共 ${card.detailData?.activities?.length || 0} 场待推进活动：\n\n${(card.detailData?.activities || []).slice(0, 5).map((a: any, i: number) => `${i + 1}. ${a.name || '未知活动'} (${a.status === 'In Progress' ? '进行中' : '规划中'})`).join('\n')}${card.detailData?.activities?.length > 5 ? '\n...等' : ''}`);
                              }}
                              className="text-[10px] px-2 py-1 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors flex items-center gap-1"
                            >
                              <ListChecks className="w-3 h-3" />查看清单
                            </button>
                          )}
                          {/* 核销滞后卡片 → 查看核销 */}
                          {card.type === 'reconciliation' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.alert(`🧾 核销清单\n\n共 ${card.detailData?.activities?.length || 0} 场已完成但未核销：\n\n${(card.detailData?.activities || []).slice(0, 5).map((a: any, i: number) => `${i + 1}. ${a.name || '未知活动'} - 预算 ¥${((a.budget || 0) / 10000).toFixed(1)}万`).join('\n')}${card.detailData?.activities?.length > 5 ? '\n...等' : ''}`);
                              }}
                              className="text-[10px] px-2 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-1"
                            >
                              <Receipt className="w-3 h-3" />查看核销
                            </button>
                          )}
                          {/* 最佳实践卡片 → 查看最佳实践 */}
                          {card.type === 'empowerment' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const topTypes = card.detailData?.topTypes || [];
                                window.alert(`💡 "${card.title.replace('复制"', '').replace('"的成功经验', '')}"最佳实践\n\n产出验证：\n${topTypes.map((t: any, i: number) => `${i + 1}. ${t.type}：场均 ${t.leadsPerActivity}线索 · ${t.newLogo}新客 · ROI ${t.roi}%`).join('\n')}\n\n建议：将 SOP 材料推广到更多伙伴和区域。`);
                              }}
                              className="text-[10px] px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-1"
                            >
                              <Lightbulb className="w-3 h-3" />查看最佳实践
                            </button>
                          )}
                          {/* 忽略按钮（所有卡片都有） */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionCardStates(prev => ({ ...prev, [card.actionId]: 'ignored' }));
                            }}
                            className="text-[10px] px-2 py-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                          >
                            忽略
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/30 to-transparent">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">营销生态运转良好</h3>
            <p className="text-xs text-neutral-400">当前无紧急待处理事项，所有指标均处于健康区间</p>
          </CardContent>
        </Card>
      )}

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
            <div className="text-[10px] text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1">
              <Info className="w-3 h-3" />
              点击上方 KPI 卡片可快速过滤对应状态的活动
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {['all', 'over-budget', 'no-leads', 'in-progress', 'normal'].map((opt) => (
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
                  {opt === 'all' ? '全部' : opt === 'over-budget' ? '超支' : opt === 'no-leads' ? '无线索' : opt === 'in-progress' ? '进行中' : '正常'}
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