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
  }, [executionProgressData, diagnosticData, qActivities, cur, totalLeads, conversionData]);

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

      {/* ========== 第一部分：核心看板（进度 / 效果 / 价值） ========== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">核心看板</h2>
          <Badge variant="info" size="sm">活动数据动态统计</Badge>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 1. 执行进度看板 - 结果 → 诊断 → 行动 */}
          <Card className="relative overflow-hidden border-t-4 border-t-blue-500">
            {/* ============== Header ============== */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-xs font-medium text-neutral-500">执行进度</span>
                  <p className="text-xs text-neutral-400">活动完成率 · 预算执行</p>
                </div>
              </div>
              <Badge className={getStatusColor(executionProgressData.completionRate)} size="sm">
                {executionProgressData.isLagging ? '进度滞后' : executionProgressData.completionRate >= 80 ? '执行良好' : '正常推进'}
              </Badge>
            </div>

            {/* ============== 第一层：核心 KPI（点击可展开） ============== */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* 活动完成率 - 点击展开详情 */}
              <div
                className="cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rounded-lg p-2 -mx-2"
                onClick={() => setShowKpiDetail(showKpiDetail === 'completion' ? null : 'completion')}
              >
                <div className="flex items-center gap-1">
                  <p className={cn(
                    "text-3xl font-bold",
                    executionProgressData.isLagging && executionProgressData.completionRate < executionProgressData.timeProgress - 10
                      ? "text-orange-600"
                      : "text-neutral-900 dark:text-white"
                  )}>
                    {executionProgressData.completionRate}%
                  </p>
                  <span className="text-xs text-neutral-400">
                    ({completedCount}/{executionProgressData.totalActivities})
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">活动完成率</p>
              </div>

              {/* 预算执行率 + 核销滞后标签 */}
              <div
                className="cursor-pointer transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 rounded-lg p-2 -mx-2"
                onClick={() => setShowKpiDetail(showKpiDetail === 'budget' ? null : 'budget')}
              >
                <div className="flex items-center gap-1">
                  <p className={cn(
                    "text-3xl font-bold",
                    executionProgressData.execRate < 20 ? "text-red-600" : "text-neutral-900 dark:text-white"
                  )}>
                    {executionProgressData.execRate}%
                  </p>
                  <span className={cn("w-2 h-2 rounded-full", getStatusDot(executionProgressData.execRate))} />
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-xs text-neutral-500">预算执行</p>
                  {executionProgressData.hasReconciliationLag && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                      <Receipt className="w-2.5 h-2.5" />
                      核销滞后
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">{cur(totalSpend)} / {cur(totalBudget)}</p>
              </div>
            </div>

            {/* ============== 第二层：双环对比 - 活动完成率 vs 时间进度 ============== */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-neutral-600 dark:text-neutral-400 font-medium">执行节奏对比</span>
                <span className="text-[11px] text-neutral-500">
                  <span className="text-orange-500">●</span> 时间进度
                  <span className="ml-2 text-blue-600">●</span> 活动完成率
                </span>
              </div>
              {/* 双环可视化 + 关键数据 */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 relative">
                  {/* 外环 - 时间进度 */}
                  <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
                    <circle cx="46" cy="46" r="36" className="text-neutral-200 dark:text-neutral-700" strokeWidth="7" stroke="currentColor" fill="none" />
                    <circle cx="46" cy="46" r="36" stroke="#f97316" strokeWidth="7" fill="none" strokeDasharray={`${(executionProgressData.timeProgress / 100) * 226.2} 226.2`} strokeLinecap="round" />
                    {/* 内环 - 活动完成率 */}
                    <circle cx="46" cy="46" r="24" className="text-neutral-100 dark:text-neutral-800" strokeWidth="7" stroke="currentColor" fill="none" />
                    <circle cx="46" cy="46" r="24" stroke={executionProgressData.isLagging ? '#ea580c' : '#2563eb'} strokeWidth="7" fill="none" strokeDasharray={`${(executionProgressData.completionRate / 100) * 150.8} 150.8`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-neutral-400">完成率</span>
                    <span className={cn("text-lg font-bold", executionProgressData.isLagging ? "text-orange-600" : "text-neutral-900 dark:text-white")}>{executionProgressData.completionRate}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span className="text-neutral-600 dark:text-neutral-400">时间进度</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-neutral-900 dark:text-white">{executionProgressData.timeProgress}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", executionProgressData.isLagging ? "bg-orange-600" : "bg-blue-600")}></span>
                      <span className="text-neutral-600 dark:text-neutral-400">活动完成率</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={cn("font-semibold", executionProgressData.isLagging ? "text-orange-600" : "text-neutral-900 dark:text-white")}>{executionProgressData.completionRate}%</span>
                    </div>
                  </div>
                  {executionProgressData.isLagging && (
                    <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-orange-600" />
                        <span className="text-orange-700 dark:text-orange-300 font-medium">差距</span>
                      </div>
                      <span className="font-bold text-orange-600">落后 {executionProgressData.timeProgress - executionProgressData.completionRate}%</span>
                    </div>
                  )}
                  {!executionProgressData.isLagging && (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">节奏正常</span>
                      </div>
                      <span className="font-bold text-emerald-600">领先 {executionProgressData.completionRate - executionProgressData.timeProgress}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 text-[11px] text-neutral-500 flex items-center gap-1">
                {executionProgressData.isLagging ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                    活动进度落后时间进度 <span className="font-semibold text-orange-600">{executionProgressData.timeProgress - executionProgressData.completionRate}%</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    进度匹配，执行节奏正常
                  </>
                )}
              </div>
            </div>

            {/* ============== 第三层：诊断 - 区域覆盖情况 ============== */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-neutral-500">区域覆盖情况</p>
                <button
                  className="text-[10px] text-blue-600 hover:underline"
                  onClick={() => setShowKpiDetail(showKpiDetail === 'region' ? null : 'region')}
                >
                  {showKpiDetail === 'region' ? '收起' : '查看详情'}
                </button>
              </div>
              <div className="space-y-1.5">
                {executionProgressData.regionDistribution.slice(0, 5).map((r: any) => (
                  <div key={r.region} className={cn(
                    "flex items-center gap-2 rounded px-1.5 py-1 -mx-1.5",
                    r.isMissing ? "bg-red-50/80 dark:bg-red-900/10" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  )}>
                    {/* 区域名 */}
                    <span className={cn(
                      "text-xs w-14 truncate flex-shrink-0",
                      r.isMissing ? "font-medium text-red-700 dark:text-red-400" : "text-neutral-600 dark:text-neutral-400"
                    )}>
                      {r.region}
                      {r.isMissing && ' · 0场'}
                    </span>
                    {/* 水平进度条 */}
                    <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 min-w-[40px]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          r.isMissing ? "bg-transparent border border-dashed border-red-300 dark:border-red-800" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.max(r.percentage, r.isMissing ? 3 : 0)}%` }}
                      />
                    </div>
                    {/* 数字 */}
                    <span className={cn(
                      "text-xs w-10 text-right",
                      r.isMissing ? "text-red-600 dark:text-red-400 font-medium" : "text-neutral-500"
                    )}>
                      {r.isMissing ? "缺失" : `${r.count}场`}
                    </span>
                  </div>
                ))}
              </div>
              {/* 缺失区域提醒 */}
              {executionProgressData.regionDistribution.filter((r: any) => r.isMissing).length > 0 && (
                <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1.5 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    {executionProgressData.regionDistribution.filter((r: any) => r.isMissing).length} 个大区尚未布局活动，建议优先规划【缺失区域】的活动补充
                  </span>
                </div>
              )}
            </div>

            {/* ============== 第四层：诊断 - 资金构成（MDF vs 自办） ============== */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-neutral-500">资金构成 · 执行分析</p>
                <button
                  className="text-[10px] text-blue-600 hover:underline"
                  onClick={() => setShowKpiDetail(showKpiDetail === 'fund' ? null : 'fund')}
                >
                  {showKpiDetail === 'fund' ? '收起' : '查看详情'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* MDF卡片 */}
                <div className={cn(
                  "p-2.5 rounded-lg border",
                  executionProgressData.mdfBudget > 0 && executionProgressData.mdfExecRate < 40
                    ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                    : "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      MDF伙伴领用
                    </span>
                    <span className="text-[10px] text-neutral-400">¥{Math.round(executionProgressData.mdfBudget / 10000)}万</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className={cn(
                      "text-xl font-bold",
                      executionProgressData.mdfBudget > 0 && executionProgressData.mdfExecRate < 40
                        ? "text-amber-600"
                        : "text-emerald-700 dark:text-emerald-400"
                    )}>{executionProgressData.mdfExecRate}%</span>
                    <span className="text-[10px] text-neutral-500">执行率</span>
                  </div>
                  {/* 迷你进度条 */}
                  <div className="mt-1.5 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${executionProgressData.mdfExecRate}%` }}></div>
                  </div>
                </div>
                {/* 自办卡片 */}
                <div className="p-2.5 rounded-lg border bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      厂商自办
                    </span>
                    <span className="text-[10px] text-neutral-400">¥{Math.round(executionProgressData.selfBudget / 10000)}万</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xl font-bold text-blue-700 dark:text-blue-400">{executionProgressData.selfExecRate}%</span>
                    <span className="text-[10px] text-neutral-500">执行率</span>
                  </div>
                  {/* 迷你进度条 */}
                  <div className="mt-1.5 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${executionProgressData.selfExecRate}%` }}></div>
                  </div>
                </div>
              </div>
              {/* 资金诊断提示 */}
              {executionProgressData.mdfBudget > 0 && executionProgressData.mdfExecRate < 40 && (
                <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1.5 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>伙伴 MDF 领用积极性偏低（仅 {executionProgressData.mdfExecRate}%），建议加强伙伴沟通或调整补贴规则，推动预算落地</span>
                </div>
              )}
            </div>

            {/* ============== 第五层：诊断 - 活动类型分布 + 状态胶囊 ============== */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-neutral-500">活动类型分布</p>
                <button
                  className="text-[10px] text-blue-600 hover:underline"
                  onClick={() => setShowKpiDetail(showKpiDetail === 'type' ? null : 'type')}
                >
                  {showKpiDetail === 'type' ? '收起' : '查看详情'}
                </button>
              </div>
              <div className="space-y-2">
                {Object.entries(executionProgressData.activityTypesDetailed).slice(0, 4).map(([type, info]: any) => {
                  const pct = safePercent((info.total / executionProgressData.totalActivities) * 100);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-600 dark:text-neutral-400 truncate flex-1">{type}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* 状态胶囊 */}
                          {info.inProgress > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                              <Clock className="w-2 h-2" /> 进行{info.inProgress}
                            </span>
                          )}
                          {info.completed > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-2 h-2" /> 完成{info.completed}
                            </span>
                          )}
                          {info.abnormal > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
                              <AlertTriangle className="w-2 h-2" /> 异常{info.abnormal}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-400 w-10 text-right">{info.total}场</span>
                        </div>
                      </div>
                      {/* 进度条 */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full flex overflow-hidden">
                          {/* 已完成部分 */}
                          {info.completed > 0 && (
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${safePercent((info.completed / info.total) * pct)}%` }}
                            />
                          )}
                          {/* 进行中部分 */}
                          {info.inProgress > 0 && (
                            <div
                              className="h-full bg-blue-400"
                              style={{ width: `${safePercent((info.inProgress / info.total) * pct)}%` }}
                            />
                          )}
                          {/* 规划中部分 */}
                          {info.planning > 0 && (
                            <div
                              className="h-full bg-neutral-300 dark:bg-neutral-600"
                              style={{ width: `${safePercent((info.planning / info.total) * pct)}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============== 第六层：行动入口 ============== */}
            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  立即行动
                </p>
                {(executionProgressData.notCompletedActivities.length > 0 || executionProgressData.hasReconciliationLag) && (
                  <button className="text-[10px] text-orange-600 hover:underline flex items-center gap-0.5">
                    <Bell className="w-3 h-3" />
                    一键批量催办
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* 行动1：查看未完成 */}
                {executionProgressData.notCompletedActivities.length > 0 && (
                  <button
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] px-2.5 py-2 rounded-md border transition-colors text-left",
                      executionProgressData.isLagging
                        ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                        : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                    )}
                    onClick={() => setShowKpiDetail(showKpiDetail === 'action-pending' ? null : 'action-pending')}
                  >
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate font-medium">
                      {executionProgressData.notCompletedActivities.length}场待推进
                    </span>
                    <ChevronRight className={cn("w-3 h-3 ml-auto flex-shrink-0 transition-transform", showKpiDetail === 'action-pending' && "rotate-90")} />
                  </button>
                )}
                {/* 行动2：催办核销 */}
                {executionProgressData.hasReconciliationLag && (
                  <button
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-2 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-left dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                    onClick={() => setShowKpiDetail(showKpiDetail === 'action-recon' ? null : 'action-recon')}
                  >
                    <Receipt className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate font-medium">催办 {executionProgressData.zeroSpendCompletedCount}场核销</span>
                    <ChevronRight className={cn("w-3 h-3 ml-auto flex-shrink-0 transition-transform", showKpiDetail === 'action-recon' && "rotate-90")} />
                  </button>
                )}
                {/* 行动3：缺失区域补充（fallback 显示） */}
                {!executionProgressData.hasReconciliationLag && executionProgressData.regionDistribution.some((r: any) => r.isMissing) && (
                  <button
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-2 rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-left dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                    onClick={() => setShowKpiDetail(showKpiDetail === 'action-region' ? null : 'action-region')}
                  >
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate font-medium">补充缺失区域</span>
                    <ChevronRight className={cn("w-3 h-3 ml-auto flex-shrink-0 transition-transform", showKpiDetail === 'action-region' && "rotate-90")} />
                  </button>
                )}
                {/* 行动4：快速规划（始终显示，做拓展入口） */}
                <button
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-2 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 transition-colors text-left dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-300"
                >
                  <Plus className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate font-medium">快速规划活动</span>
                  <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* ============== KPI 详情展开区（可折叠） ============== */}
            {showKpiDetail === 'action-pending' && executionProgressData.notCompletedActivities.length > 0 && (
              <div className="mt-3 border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50/30 dark:bg-blue-900/10">
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  ⚠️ 未完成活动列表（{executionProgressData.notCompletedActivities.length}场）
                </p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {executionProgressData.notCompletedActivities.slice(0, 15).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between text-xs bg-white dark:bg-neutral-900/50 rounded px-2 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] flex-shrink-0",
                          a.status === 'In Progress'
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        )}>
                          {a.status === 'In Progress' ? '进行中' : '规划中'}
                        </span>
                        <span className="truncate text-neutral-700 dark:text-neutral-300">{a.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-neutral-500">{a.event_date || '--'}</span>
                        <button className="text-[10px] text-blue-600 hover:underline">催办</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showKpiDetail === 'action-recon' && executionProgressData.hasReconciliationLag && (
              <div className="mt-3 border border-amber-200 dark:border-amber-800 rounded-lg p-3 bg-amber-50/30 dark:bg-amber-900/10">
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  🧾 需核销活动（{executionProgressData.zeroSpendCompletedCount}场已完成但0支出）
                </p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {qActivities.filter((a: any) => a.status === 'Completed' && safeNum(a.actualSpend) === 0).slice(0, 10).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between text-xs bg-white dark:bg-neutral-900/50 rounded px-2 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="truncate text-neutral-700 dark:text-neutral-300">{a.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-neutral-400">预算 ¥{Math.round((a.budget || 0) / 10000)}万</span>
                        <button className="text-[10px] text-amber-700 hover:underline dark:text-amber-400">前往核销</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* 2. 执行效果看板 - 参与人数 & 获客数量 */}
          <Card className="relative overflow-hidden border-t-4 border-t-emerald-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-xs font-medium text-neutral-500">执行效果</span>
                  <p className="text-xs text-neutral-400">参与人数 · 获客数量</p>
                </div>
              </div>
              <Badge className={getStatusColor(executionQualityData.avgLeadsPerActivity)} size="sm">
                {executionQualityData.avgLeadsPerActivity >= 30 ? '获客优秀' : executionQualityData.avgLeadsPerActivity >= 15 ? '获客良好' : '待提升'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {safeNum(executionQualityData.cumulativeParticipants).toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500">计划参与人数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-500">{totalLeads}</p>
                <p className="text-xs text-neutral-500">总线索数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">{executionQualityData.avgLeadsPerActivity}</p>
                <p className="text-xs text-neutral-500">场均获客</p>
              </div>
            </div>

            {/* 流量走势 - 14天参与人数走势 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-neutral-500 mb-2">近14天参与人数走势</p>
              <div className="flex items-end justify-between h-12 gap-0.5">
                {executionQualityData.last30Days.slice(-14).map((d: any, i: number) => {
                  const maxVal = Math.max(...executionQualityData.last30Days.map((x: any) => x.participants || 0), 1);
                  const height = Math.max(2, (d.participants / maxVal) * 48);
                  return (
                    <div
                      key={d.day || i}
                      className="flex-1 bg-emerald-400 rounded-t transition-all hover:bg-emerald-500"
                      style={{ height: `${height}px` }}
                      title={`${d.date}: ${d.participants}人`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>2周前</span>
                <span>今天</span>
              </div>
            </div>

            {/* 热门活动排行 */}
            <div className="mb-4">
              <p className="text-xs font-medium text-neutral-500 mb-2">
                热门活动排行 {topActivities.length > 0 && <span className="text-neutral-400">Top {Math.min(5, topActivities.length)}</span>}
              </p>
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

          {/* 3. 转化价值看板 - 投入产出比 & 新客户价值 */}
          <Card className="relative overflow-hidden border-t-4 border-t-purple-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-xs font-medium text-neutral-500">转化价值</span>
                  <p className="text-xs text-neutral-400">投入产出比 · 新客户</p>
                </div>
              </div>
              <Badge className={getStatusColor(conversionData.avgConversionRate)} size="sm">
                {conversionData.avgConversionRate >= 30 ? '转化优秀' : conversionData.avgConversionRate >= 15 ? '转化良好' : '待突破'}
              </Badge>
            </div>

            <div className="grid grid-cols-5 gap-2 mb-4">
              <div>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{conversionData.avgConversionRate}%</p>
                <p className="text-[10px] text-neutral-500">线索转化率</p>
              </div>
              <div>
                <p className="text-xl font-bold text-cyan-700 dark:text-cyan-500">{Number(conversionData.totalDeals).toLocaleString()}</p>
                <p className="text-[10px] text-neutral-500">商机数</p>
              </div>
              <div>
                <p className="text-xl font-bold text-cyan-500">{cur(Number(conversionData.totalDealsAmount))}</p>
                <p className="text-[10px] text-neutral-500">商机金额</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-600">{Number(conversionData.newLogoCount).toLocaleString()}</p>
                <p className="text-[10px] text-neutral-500">新客户数</p>
              </div>
              <div>
                <p className="text-xl font-bold text-purple-600">{cur(Number(conversionData.newLogoOrderAmount))}</p>
                <p className="text-[10px] text-neutral-500">新客户订单</p>
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
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span className="text-[10px] text-neutral-500">转化周期</span>
                  </div>
                  {conversionData.avgConversionDays > 0 && conversionData.avgConversionDays < 45 && (
                    <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                      <ArrowDownRight className="w-2.5 h-2.5" /> 优于基准
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold">{safeNum(conversionData.avgConversionDays)}天</p>
                <p className="text-[9px] text-neutral-400">行业基准: 45天</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3 text-neutral-400" />
                    <span className="text-[10px] text-neutral-500">线索跟进率</span>
                  </div>
                  {conversionData.followUpRate >= 80 && (
                    <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                      <ArrowUpRight className="w-2.5 h-2.5" /> 优秀
                    </span>
                  )}
                </div>
                <p className={cn(
                  "text-sm font-semibold",
                  getStatusColor(conversionData.followUpRate).split(' ')[0]
                )}>
                  {safeNum(conversionData.followUpRate)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className={cn("w-2 h-2 rounded-full", getStatusDot(conversionData.followUpRate))} />
                  <span className="text-[9px] text-neutral-400">{qActivities.length}个活动平均</span>
                </div>
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
            "transition-all",
            diagnosticData.diagnosisA.hasIssue
              ? "border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/40 to-transparent"
              : "border border-neutral-200 dark:border-neutral-700"
          )}>
            <div className="flex items-start gap-2 mb-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                diagnosticData.diagnosisA.hasIssue ? "bg-orange-100 dark:bg-orange-900/30" : "bg-neutral-100 dark:bg-neutral-800"
              )}>
                <DollarSign className={cn("w-4 h-4", diagnosticData.diagnosisA.hasIssue ? "text-orange-600" : "text-neutral-500")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm">执行与预算错配</CardTitle>
                  {diagnosticData.diagnosisA.hasIssue && (
                    <Badge variant="danger" size="sm">异常</Badge>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5">活动完成率 · 预算执行率 · MDF领用</p>
              </div>
            </div>

            {/* 三大核心指标 —— 横向对比 */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 text-center">
                <p className="text-base font-bold text-neutral-900 dark:text-white">{diagnosticData.diagnosisA.metrics.completionRate}%</p>
                <p className="text-[10px] text-neutral-500">活动完成率</p>
              </div>
              <div className={cn(
                "p-2 rounded-lg text-center",
                diagnosticData.diagnosisA.isGlobalMismatch ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" : "bg-neutral-50 dark:bg-neutral-800/60"
              )}>
                <p className={cn("text-base font-bold", diagnosticData.diagnosisA.isGlobalMismatch ? "text-orange-600" : "text-neutral-900 dark:text-white")}>{diagnosticData.diagnosisA.metrics.execRate}%</p>
                <p className="text-[10px] text-neutral-500">预算执行率</p>
              </div>
              <div className={cn(
                "p-2 rounded-lg text-center",
                diagnosticData.diagnosisA.mdfProblem ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800" : "bg-neutral-50 dark:bg-neutral-800/60"
              )}>
                <p className={cn("text-base font-bold", diagnosticData.diagnosisA.mdfProblem ? "text-purple-600" : "text-neutral-900 dark:text-white")}>{diagnosticData.diagnosisA.metrics.mdfExec}%</p>
                <p className="text-[10px] text-neutral-500">MDF执行率</p>
              </div>
            </div>

            {/* 诊断结论 —— 强调语义 */}
            <div className={cn(
              "p-2.5 rounded-lg mb-3",
              diagnosticData.diagnosisA.hasIssue
                ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800"
                : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800"
            )}>
              <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {diagnosticData.diagnosisA.hasIssue ? '⚠️ ' : '✅ '}{diagnosticData.diagnosisA.summary}
              </p>
            </div>

            {/* 问题区域/子问题清单 */}
            {diagnosticData.diagnosisA.regions.length > 0 && (
              <div className="space-y-1 mb-3">
                <p className="text-[10px] font-medium text-neutral-500">问题区域 TOP</p>
                {diagnosticData.diagnosisA.regions.slice(0, 3).map((r: any) => (
                  <div key={r.region} className="flex items-center justify-between p-2 bg-red-50/40 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-red-700 dark:text-red-300">{r.region}</p>
                      <p className="text-[10px] text-neutral-500">预算 {r.budgetShare}% · 完成 {r.completion}% · 执行 {r.execRate}%</p>
                    </div>
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* 核销滞后 —— 突出显示 */}
            {diagnosticData.diagnosisA.reconciliationIssue && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Receipt className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300">核销流程滞后</span>
                </div>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                  {diagnosticData.diagnosisA.zeroSpendActivities?.length || 0}场活动已完成但预算支出为0，需催办伙伴核销
                </p>
              </div>
            )}

            {/* 底部行动按钮 */}
            <div className="flex items-center gap-1.5">
              {diagnosticData.diagnosisA.hasIssue ? (
                <>
                  <button className="flex-1 flex items-center justify-center gap-1 text-[11px] px-2 py-1.5 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors">
                    <Send className="w-3 h-3" />立即处理
                  </button>
                  <button className="text-[11px] px-2 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    查看详情
                  </button>
                </>
              ) : (
                <div className="flex-1 text-center text-[11px] text-emerald-700 dark:text-emerald-400 py-1.5 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-md">
                  ✓ 预算与执行健康
                </div>
              )}
            </div>
          </Card>

          {/* 诊断B：线索"肠梗阻"分析 */}
          <Card className={cn(
            "transition-all",
            diagnosticData.diagnosisB.hasIssue
              ? "border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/40 to-transparent"
              : "border border-neutral-200 dark:border-neutral-700"
          )}>
            <div className="flex items-start gap-2 mb-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                diagnosticData.diagnosisB.hasIssue ? "bg-blue-100 dark:bg-blue-900/30" : "bg-neutral-100 dark:bg-neutral-800"
              )}>
                <BarChart3 className={cn("w-4 h-4", diagnosticData.diagnosisB.hasIssue ? "text-blue-600" : "text-neutral-500")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm">线索"肠梗阻"分析</CardTitle>
                  {diagnosticData.diagnosisB.hasIssue && (
                    <Badge variant="info" size="sm">待优化</Badge>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5">线索质量 · 跟进效率 · 转化周期</p>
              </div>
            </div>

            {/* 质量分布 —— 视觉强化 */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1.5">
                <span>总线索 {safeNum(diagnosticData.diagnosisB.metrics.totalLeads)}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">高质量 {diagnosticData.diagnosisB.metrics.highQualityRate}%</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <div className="bg-emerald-500" style={{ width: `${Math.round(safeNum(diagnosticData.diagnosisB.metrics.gradeA) / Math.max(diagnosticData.diagnosisB.metrics.totalLeads, 1) * 100)}%` }}></div>
                <div className="bg-amber-500" style={{ width: `${Math.round(safeNum(diagnosticData.diagnosisB.metrics.gradeB) / Math.max(diagnosticData.diagnosisB.metrics.totalLeads, 1) * 100)}%` }}></div>
                <div className="bg-blue-500" style={{ width: `${Math.round(safeNum(diagnosticData.diagnosisB.metrics.gradeC) / Math.max(diagnosticData.diagnosisB.metrics.totalLeads, 1) * 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>A优质</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>B中等</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>C潜在</span>
              </div>
            </div>

            {/* 分类统计指标 */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <div className="p-1.5 rounded-md bg-neutral-50 dark:bg-neutral-800/60 text-center">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{safeNum(diagnosticData.diagnosisB.metrics.lowConversionCount)}</p>
                <p className="text-[9px] text-neutral-500">低转化率</p>
              </div>
              <div className="p-1.5 rounded-md bg-neutral-50 dark:bg-neutral-800/60 text-center">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{safeNum(diagnosticData.diagnosisB.metrics.lowFollowUpCount)}</p>
                <p className="text-[9px] text-neutral-500">低跟进率</p>
              </div>
              <div className="p-1.5 rounded-md bg-neutral-50 dark:bg-neutral-800/60 text-center">
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{safeNum(diagnosticData.diagnosisB.metrics.longCycleCount)}</p>
                <p className="text-[9px] text-neutral-500">长周期</p>
              </div>
            </div>

            {/* 诊断结论 */}
            <div className={cn(
              "p-2.5 rounded-lg mb-3",
              diagnosticData.diagnosisB.hasIssue
                ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
                : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800"
            )}>
              <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
                {diagnosticData.diagnosisB.hasIssue ? '🔍 ' : '✅ '}{diagnosticData.diagnosisB.summary}
              </p>
            </div>

            {/* 问题活动 */}
            {diagnosticData.diagnosisB.activities.length > 0 && (
              <div className="space-y-1 mb-3">
                <p className="text-[10px] font-medium text-neutral-500">重点关注活动</p>
                {diagnosticData.diagnosisB.activities.slice(0, 3).map((a: any) => (
                  <div key={a.id} className="p-2 bg-red-50/40 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 truncate flex-1">{a.name}</p>
                      <span className="text-[10px] px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex-shrink-0 ml-1.5">
                        {safeNum(a.conversionRatio) || safeNum(a.followUpRate)}%
                      </span>
                    </div>
                    <p className="text-[9px] text-neutral-500">
                      {safeNum(a.leadsGenerated || a.leads || 0)}线索 · {safeNum(a.expected_attendees || a.expectedAttendees || 0)}人 · {safeNum(a.conversionDays || 30)}天
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 底部行动 */}
            <div className="flex items-center gap-1.5">
              {diagnosticData.diagnosisB.hasIssue ? (
                <>
                  <button className="flex-1 flex items-center justify-center gap-1 text-[11px] px-2 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                    <RefreshCw className="w-3 h-3" />优化跟进策略
                  </button>
                  <button className="text-[11px] px-2 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    查看漏斗
                  </button>
                </>
              ) : (
                <div className="flex-1 text-center text-[11px] text-emerald-700 dark:text-emerald-400 py-1.5 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-md">
                  ✓ 线索流转健康
                </div>
              )}
            </div>
          </Card>

          {/* 诊断C：高产出活动复刻分析（多维度对比） */}
          <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/40 to-transparent">
            <div className="flex items-start gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm">高产出活动复刻</CardTitle>
                  <Badge variant="success" size="sm">最佳实践</Badge>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5">多维度类型对比 · ROI分析</p>
              </div>
            </div>

            {/* 最佳活动类型卡片 —— 视觉升级 */}
            {diagnosticData.diagnosisC.bestType && (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 rounded-lg p-3 mb-3 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">最佳活动类型</span>
                </div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                  {diagnosticData.diagnosisC.bestType.type}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-center p-1.5 bg-white/60 dark:bg-neutral-900/40 rounded-md">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{diagnosticData.diagnosisC.bestType.leadsPerActivity}</p>
                    <p className="text-[9px] text-neutral-500">场均线索</p>
                  </div>
                  <div className="text-center p-1.5 bg-white/60 dark:bg-neutral-900/40 rounded-md">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{diagnosticData.diagnosisC.bestType.conversionRate}%</p>
                    <p className="text-[9px] text-neutral-500">商机转化</p>
                  </div>
                  <div className="text-center p-1.5 bg-white/60 dark:bg-neutral-900/40 rounded-md">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{diagnosticData.diagnosisC.bestType.newLogo}</p>
                    <p className="text-[9px] text-neutral-500">新客户</p>
                  </div>
                </div>
              </div>
            )}

            {/* 活动类型排行榜 —— 可视化 */}
            {diagnosticData.diagnosisC.topTypes && diagnosticData.diagnosisC.topTypes.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-medium text-neutral-500 mb-1.5">类型产出对比 TOP</p>
                <div className="space-y-1">
                  {diagnosticData.diagnosisC.topTypes.slice(0, 3).map((t: any, i: number) => (
                    <div key={t.type} className="flex items-center justify-between p-1.5 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-md border border-emerald-100 dark:border-emerald-800/50">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className={cn(
                          "text-[10px] font-bold w-4 flex-shrink-0",
                          i === 0 ? "text-amber-600" : i === 1 ? "text-neutral-500" : "text-orange-800"
                        )}>{i + 1}.</span>
                        <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 truncate">{t.type}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-neutral-500">{t.leadsPerActivity}线索</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">{t.newLogo}·新客</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SOP下载量 —— 小信息点 */}
            <div className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg mb-3">
              <div className="flex items-center gap-1.5">
                <Download className="w-3 h-3 text-blue-500" />
                <span className="text-[11px] text-neutral-600 dark:text-neutral-400">SOP标准文档下载</span>
              </div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">
                {diagnosticData.diagnosisC.sopDownloadCount}<span className="text-[9px] font-normal text-neutral-400 ml-0.5">次</span>
              </p>
            </div>

            {/* 底部行动按钮 */}
            <div className="flex items-center gap-1.5">
              <button className="flex-1 flex items-center justify-center gap-1 text-[11px] px-2 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors">
                <TrendingUp className="w-3 h-3" />复制推广
              </button>
              <button className="text-[11px] px-2 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                查看SOP
              </button>
            </div>
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
          <Badge variant="info" size="sm">
            {actionCards.reduce((sum, c) => sum + (safeNum(c.priority === 'high' ? 1 : 0)), 0) > 0 ? `${actionCards.reduce((s, c) => s + (c.priority === 'high' ? 1 : 0), 0)}项紧急` : `${actionCards.length}项建议`}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {actionCards.map((card: any) => {
            const Icon = card.icon;
            const isExpanded = expandedActionCard === card.type;
            const colorMap: Record<string, string> = {
              orange: 'border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-900/10',
              blue: 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10',
              green: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10',
              purple: 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10',
            };
            const iconColorMap: Record<string, string> = {
              orange: 'text-orange-600',
              blue: 'text-blue-600',
              green: 'text-emerald-600',
              purple: 'text-purple-600',
            };
            const hasDetails = card.detailData && (
              (card.detailData.activities && card.detailData.activities.length > 0) ||
              (card.detailData.regions && card.detailData.regions.length > 0) ||
              (card.detailData.topTypes && card.detailData.topTypes.length > 0)
            );

            return (
              <Card key={card.type} className={cn("border-2", colorMap[card.color])}>
                {/* 头部：图标 + 标题 + 优先级 */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-neutral-800 shadow-sm",
                    iconColorMap[card.color]
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm mb-1 truncate">{card.title}</CardTitle>
                    {card.subtitle && <p className="text-[10px] text-neutral-500 truncate">{card.subtitle}</p>}
                  </div>
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

                {/* 关键指标 */}
                {card.metrics && card.metrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {card.metrics.map((m: any, i: number) => (
                      <div key={i} className="bg-white dark:bg-neutral-800/50 rounded-lg p-2">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{m.value}</p>
                        <p className="text-[9px] text-neutral-500 truncate">{m.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 描述 */}
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">
                  {card.content}
                </p>

                {/* 展开/收起按钮 */}
                {hasDetails && (
                  <button
                    onClick={() => setExpandedActionCard(isExpanded ? null : card.type)}
                    className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
                  >
                    <span className="text-neutral-600 dark:text-neutral-400">{isExpanded ? '收起详情' : card.actionLabel || '查看详情'}</span>
                    <ChevronRight className={cn("w-3 h-3 text-neutral-500 transition-transform", isExpanded && "rotate-90")} />
                  </button>
                )}

                {/* 展开的详情区域 */}
                {isExpanded && hasDetails && (
                  <div className="mt-3 p-3 bg-white dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
                    {/* 活动列表 */}
                    {card.detailData.activities && card.detailData.activities.length > 0 && (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        <p className="text-[10px] font-medium text-neutral-500 mb-2">
                          相关活动（{card.detailData.activities.length}场）
                        </p>
                        {card.detailData.activities.slice(0, 8).map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between text-xs p-2 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-700 dark:text-neutral-300 truncate">{a.name}</p>
                              <p className="text-[9px] text-neutral-500 mt-0.5">
                                {a.status} · {safeNum(a.leadsGenerated || a.expected_attendees || 0)}人参与 · 预算 {cur(safeNum(a.budget))}
                              </p>
                            </div>
                            <button className="text-[10px] text-blue-600 hover:underline flex-shrink-0 ml-2">
                              催办
                            </button>
                          </div>
                        ))}
                        {card.detailData.activities.length > 8 && (
                          <p className="text-[9px] text-center text-neutral-400 pt-1">...还有 {card.detailData.activities.length - 8} 场活动</p>
                        )}
                      </div>
                    )}

                    {/* 区域列表 */}
                    {card.detailData.regions && card.detailData.regions.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-neutral-500 mb-2">
                          待补充区域（{card.detailData.regions.length}个）
                        </p>
                        {card.detailData.regions.slice(0, 6).map((r: any) => (
                          <div key={r.region} className="flex items-center justify-between text-xs p-2 bg-red-50/50 dark:bg-red-900/10 rounded-lg">
                            <span className="font-medium text-red-700 dark:text-red-300">{r.region}</span>
                            <button className="text-[10px] text-red-600 hover:underline">规划活动</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 最佳实践类型列表 */}
                    {card.detailData.topTypes && card.detailData.topTypes.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-neutral-500 mb-2">可推广活动类型</p>
                        {card.detailData.topTypes.slice(0, 3).map((t: any, i: number) => (
                          <div key={t.type} className="flex items-center justify-between text-xs p-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
                            <div>
                              <span className="font-medium text-emerald-700 dark:text-emerald-300">{i+1}. {t.type}</span>
                              <span className="text-[10px] text-neutral-500 ml-2">场均{t.leadsPerActivity}线索 · {t.newLogo}个新客</span>
                            </div>
                            <button className="text-[10px] text-emerald-600 hover:underline">推广SOP</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 快捷操作按钮 */}
                <div className="flex gap-1.5 mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  {card.type === 'reconciliation' && (
                    <Button size="sm" variant="brand" className="text-xs flex-1" onClick={() => setShowMDFClaims(true)}>
                      <Receipt className="w-3 h-3 mr-1" />前往核销
                    </Button>
                  )}
                  {card.type === 'empowerment' && (
                    <Button size="sm" variant="brand" className="text-xs flex-1" onClick={() => setShowSOP(true)}>
                      <Lightbulb className="w-3 h-3 mr-1" />查看SOP
                    </Button>
                  )}
                  {card.type === 'supervision' && (
                    <Button size="sm" variant="secondary" className="text-xs flex-1">
                      <Send className="w-3 h-3 mr-1" />批量催办
                    </Button>
                  )}
                  {card.type === 'activation' && (
                    <Button size="sm" variant="secondary" className="text-xs flex-1">
                      <RefreshCw className="w-3 h-3 mr-1" />激活线索
                    </Button>
                  )}
                  {card.type === 'regional-planning' && (
                    <Button size="sm" variant="secondary" className="text-xs flex-1">
                      <MapPin className="w-3 h-3 mr-1" />快速规划
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {/* 无行动项时的占位 */}
          {actionCards.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-8 text-neutral-400">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              <span className="text-sm">暂无待处理行动项，执行进度良好！</span>
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