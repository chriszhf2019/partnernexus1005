import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { 
  Target, TrendingUp, TrendingDown, Users, Calendar, DollarSign, CheckCircle, Clock,
  Plus, Edit, Eye, Send, ThumbsUp, Briefcase, ChevronRight,
  PieChart, BarChart3, Award, AlertCircle, Check, X, Gift,
  Layers, Zap, Shield, FileText, Download, RefreshCw, Filter,
  Bell, StopCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useConfig } from '../../contexts/ConfigContext';
import { 
  AnnualIncentiveBudget, QuarterlyIncentivePlan, IncentiveScope,
  IncentiveStatus, IncentiveCategory, IncentiveTarget, IncentiveExecution,
  IncentivePolicyStats, IncentiveTierRule,
  IncentiveTargetingRule, IncentiveTemplate, IncentiveApplication,
  IncentiveParticipationTracking, IncentiveROITracking, IncentiveSettlementRecord
} from '../../types';

const CATEGORY_LABELS: Record<IncentiveCategory, { label: string; color: string }> = {
  volume_rebate: { label: '基础规模返点', color: 'bg-blue-100 text-blue-700' },
  new_product: { label: '新产品破冰', color: 'bg-purple-100 text-purple-700' },
  competitive: { label: '竞品替换阻击', color: 'bg-red-100 text-red-700' },
  velocity: { label: '销售结单加速', color: 'bg-amber-100 text-amber-700' },
  loyalty: { label: '伙伴忠诚度', color: 'bg-emerald-100 text-emerald-700' },
  training: { label: '培训激励', color: 'bg-cyan-100 text-cyan-700' },
};

const STATUS_LABELS: Record<IncentiveStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-neutral-100 text-neutral-700' },
  pending: { label: '已提交', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已批复', color: 'bg-emerald-100 text-emerald-700' },
};

const REGIONS = ['华北区', '华东区', '华南区', '西南区', '西北区', '华中区', '东北区'];
const INDUSTRIES = ['医疗', '金融', '制造', '零售', '教育', '政府', '能源', '交通'];
const PARTNER_TIERS = ['Platinum', 'Gold', 'Silver', 'Registered'];

interface Props {
  initialYear?: number;
}

export const IncentivePolicyPage: React.FC<Props> = ({ initialYear }) => {
  const { year: urlYear } = useParams();
  const { config } = useConfig();
  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const [currentYear, setCurrentYear] = useState(initialYear || parseInt(urlYear || '2026'));
  const [activeTab, setActiveTab] = useState<'budget' | 'plans' | 'applications' | 'executions' | 'analytics' | 'settlement'>('plans');
  const [quarter, setQuarter] = useState<string>('Q2');

  // Data states
  const [annualBudget, setAnnualBudget] = useState<AnnualIncentiveBudget | null>(null);
  const [plans, setPlans] = useState<QuarterlyIncentivePlan[]>([]);
  const [executions, setExecutions] = useState<IncentiveExecution[]>([]);
  const [applications, setApplications] = useState<IncentiveApplication[]>([]);
  const [templates, setTemplates] = useState<IncentiveTemplate[]>([]);
  const [participations, setParticipations] = useState<IncentiveParticipationTracking[]>([]);
  const [settlements, setSettlements] = useState<IncentiveSettlementRecord[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPlanDetail, setShowPlanDetail] = useState<QuarterlyIncentivePlan | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState<QuarterlyIncentivePlan | null | false>(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showApplicationDetail, setShowApplicationDetail] = useState<IncentiveApplication | null>(null);
  const [showTierRulesModal, setShowTierRulesModal] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<IncentiveExecution | null>(null);
  const [selectedPlanForTemplate, setSelectedPlanForTemplate] = useState<IncentiveTemplate | null>(null);

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    totalBudget: 0, q1Budget: 0, q2Budget: 0, q3Budget: 0, q4Budget: 0, notes: ''
  });
  const [planForm, setPlanForm] = useState({
    title: '', description: '', category: 'volume_rebate' as IncentiveCategory,
    scope: 'global' as IncentiveScope, targetPartnerIds: [] as string[],
    totalBudget: 0, startDate: '', endDate: '',
    direction: 'expand_market' as any,
    focusArea: '', priorityLevel: 'medium' as 'high' | 'medium' | 'low',
    targetRegions: [] as string[], targetTiers: [] as string[], targetIndustries: [] as string[],
    expectedStartPace: 20, expectedMidPace: 50, expectedEndPace: 30,
    milestones: [] as { milestone: string; targetDate: string; targetValue: number; weight: number }[],
    targets: [] as IncentiveTarget[],
    tierRules: [] as IncentiveTierRule[],
    targetingRules: [] as IncentiveTargetingRule[]
  });
  const [evaluationForm, setEvaluationForm] = useState({
    participationRate: 0, achievementRate: 0, roi: 0, totalPayout: 0,
    totalRevenue: 0, pipelineCreated: 0, pipelineValue: 0,
    summary: '', feedback: ''
  });
  const [dealForm, setDealForm] = useState({
    title: '', customerName: '', value: 0, stage: 'lead' as any, region: '',
    salesName: '', salesTeam: '', productType: '', expectedCloseDate: ''
  });
  const [tierRules, setTierRules] = useState<IncentiveTierRule[]>([]);

  useEffect(() => {
    loadData();
  }, [currentYear, quarter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load annual budget
      const { data: budgetData } = await supabase
        .from('incentive_annual_budget')
        .select('*')
        .eq('year', currentYear)
        .single();
      if (budgetData) {
        setAnnualBudget(budgetData);
        setBudgetForm({
          totalBudget: budgetData.total_budget || 0,
          q1Budget: budgetData.q1_budget || 0,
          q2Budget: budgetData.q2_budget || 0,
          q3Budget: budgetData.q3_budget || 0,
          q4Budget: budgetData.q4_budget || 0,
          notes: budgetData.notes || ''
        });
      }

      // Load quarterly plans
      const { data: plansData } = await supabase
        .from('incentive_quarterly_plan')
        .select('*')
        .eq('year', currentYear)
        .order('quarter');
      if (plansData) {
        setPlans(plansData.map((p: any) => ({
          id: p.id, year: p.year, quarter: p.quarter, title: p.title,
          description: p.description, category: p.category, scope: p.scope,
          targetPartnerIds: p.target_partner_ids || [],
          targetPartnerNames: p.target_partner_names || [],
          totalBudget: p.total_budget || 0, approvedAmount: p.approved_amount,
          status: p.status, startDate: p.start_date, endDate: p.end_date,
          targets: p.targets || [], createdAt: p.created_at, updatedAt: p.updated_at,
          submittedAt: p.submitted_at, approvedAt: p.approved_at,
          tierRules: p.tier_rules || [],
          targetingRules: p.targeting_rules || [],
          direction: p.direction ? typeof p.direction === 'string' ? JSON.parse(p.direction) : p.direction : undefined,
          pace: p.pace ? typeof p.pace === 'string' ? JSON.parse(p.pace) : p.pace : undefined
        })));
      }

      // Load executions
      const { data: execData } = await supabase
        .from('incentive_executions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (execData) {
        setExecutions(execData.map((e: any) => ({
          id: e.id, planId: e.plan_id, partnerId: e.partner_id, partnerName: e.partner_name,
          partnerTier: e.partner_tier, achievedValue: e.achieved_value, metric: e.metric,
          payoutAmount: e.payout_amount, payoutStatus: e.payout_status,
          relatedDeals: e.related_deals || [],
          submittedAt: e.submitted_at, approvedAt: e.approved_at, paidAt: e.paid_at, notes: e.notes
        })));
      }

      // Load applications
      const { data: appsData } = await supabase
        .from('incentive_applications')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (appsData) {
        setApplications(appsData.map((a: any) => ({
          id: a.id, planId: a.plan_id, partnerId: a.partner_id, partnerName: a.partner_name,
          partnerTier: a.partner_tier, metric: a.metric, claimedValue: a.claimed_value,
          payoutAmount: a.payout_amount, 
          relatedDeals: a.related_deals ? typeof a.related_deals === 'string' ? JSON.parse(a.related_deals) : a.related_deals : [],
          status: a.status, currentStep: a.current_step || 1,
          workflowSteps: a.workflow_steps || [],
          invoiceNumber: a.invoice_number,
          submittedAt: a.submitted_at, createdAt: a.created_at, updatedAt: a.updated_at
        })));
      }

      // Load templates
      const { data: templatesData } = await supabase
        .from('incentive_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (templatesData) {
        setTemplates(templatesData.map((t: any) => ({
          id: t.id, name: t.name, category: t.category, description: t.description,
          isActive: t.is_active,
          config: typeof t.config === 'string' ? JSON.parse(t.config) : t.config,
          defaultBudget: t.default_budget, defaultDurationDays: t.default_duration_days,
          usageCount: t.usage_count || 0,
          createdAt: t.created_at, updatedAt: t.updated_at
        })));
      }

      // Load partners
      const { data: partnersData } = await supabase
        .from('partners')
        .select('id, name, tier, region, industry')
        .order('name');
      if (partnersData) setPartners(partnersData);

      // Load participation tracking
      const { data: participationData } = await supabase
        .from('incentive_participation_tracking')
        .select('*');
      if (participationData) {
        setParticipations(participationData.map((p: any) => ({
          id: p.id, planId: p.plan_id, partnerId: p.partner_id, partnerName: p.partner_name,
          partnerTier: p.partner_tier, partnerRegion: p.partner_region, partnerIndustry: p.partner_industry,
          isParticipated: p.is_participated, totalApplications: p.total_applications || 0,
          totalPayoutReceived: p.total_payout_received || 0,
          dealsRegistered: p.deals_registered || 0,
          dealsWon: p.deals_won || 0,
          revenueContributed: p.revenue_contributed || 0,
          createdAt: p.created_at, updatedAt: p.updated_at
        })));
      }

      // Load settlements
      const { data: settlementsData } = await supabase
        .from('incentive_settlement_records')
        .select('*');
      if (settlementsData) {
        setSettlements(settlementsData.map((s: any) => ({
          id: s.id, applicationId: s.application_id, planId: s.plan_id, partnerId: s.partner_id,
          partnerName: s.partner_name, settlementAmount: s.settlement_amount, 
          settlementCurrency: s.settlement_currency,
          invoiceNumber: s.invoice_number, status: s.status,
          taxRate: s.tax_rate || 0,
          paymentMethod: s.payment_method || 'bank_transfer',
          createdAt: s.created_at, updatedAt: s.updated_at
        })));
      }

    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats: IncentivePolicyStats = {
    annualBudget: annualBudget?.totalBudget || 0,
    quarterlyBudgets: [
      { q: 'Q1', budget: annualBudget?.q1Budget || 0, used: plans.filter(p => p.quarter === 'Q1').reduce((s, p) => s + (p.approvedAmount || 0), 0) },
      { q: 'Q2', budget: annualBudget?.q2Budget || 0, used: plans.filter(p => p.quarter === 'Q2').reduce((s, p) => s + (p.approvedAmount || 0), 0) },
      { q: 'Q3', budget: annualBudget?.q3Budget || 0, used: plans.filter(p => p.quarter === 'Q3').reduce((s, p) => s + (p.approvedAmount || 0), 0) },
      { q: 'Q4', budget: annualBudget?.q4Budget || 0, used: plans.filter(p => p.quarter === 'Q4').reduce((s, p) => s + (p.approvedAmount || 0), 0) },
    ],
    activePlansCount: plans.filter(p => p.status === 'approved' || p.status === 'pending').length,
    totalPayoutYTD: executions.filter(e => e.payoutStatus === 'paid').reduce((s, e) => s + e.payoutAmount, 0),
    avgAchievementRate: 0,
    topPerformers: []
  };

  const quarterlyPlans = plans.filter(p => p.quarter === quarter);
  const pendingPlans = plans.filter(p => p.status === 'pending');
  const pendingApplications = applications.filter(a => a.status === 'pending' || a.status === 'reviewing');
  const unpaidSettlements = settlements.filter(s => s.status !== 'completed');

  // Handlers
  const handleSaveBudget = async () => {
    try {
      const existing = annualBudget?.id;
      const budgetData: any = {
        year: currentYear,
        total_budget: budgetForm.totalBudget,
        q1_budget: budgetForm.q1Budget,
        q2_budget: budgetForm.q2Budget,
        q3_budget: budgetForm.q3Budget,
        q4_budget: budgetForm.q4Budget,
        total_used: 0,
        total_remaining: budgetForm.totalBudget,
        status: 'approved',
        notes: budgetForm.notes,
        updated_at: new Date().toISOString()
      };
      if (existing) {
        await supabase.from('incentive_annual_budget').update(budgetData).eq('id', existing);
      } else {
        budgetData.created_at = new Date().toISOString();
        await supabase.from('incentive_annual_budget').insert(budgetData);
      }
      setShowBudgetModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to save budget:', err);
    }
  };

  const handleCreatePlan = async () => {
    if (!planForm.title || !planForm.totalBudget) return;
    try {
      const planData: any = {
        year: currentYear,
        quarter: quarter as any,
        title: planForm.title,
        description: planForm.description,
        category: planForm.category,
        scope: planForm.scope,
        total_budget: planForm.totalBudget,
        approved_amount: 0,
        status: 'draft',
        start_date: planForm.startDate,
        end_date: planForm.endDate,
        targets: planForm.targets,
        tier_rules: planForm.tierRules,
        targeting_rules: planForm.targetingRules,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await supabase.from('incentive_quarterly_plan').insert(planData);
      setShowPlanModal(false);
      setPlanForm({
        title: '', description: '', category: 'volume_rebate', scope: 'global',
        targetPartnerIds: [], totalBudget: 0, startDate: '', endDate: '',
        direction: 'expand_market', focusArea: '', priorityLevel: 'medium',
        targetRegions: [], targetTiers: [], targetIndustries: [],
        expectedStartPace: 20, expectedMidPace: 50, expectedEndPace: 30, milestones: [],
        targets: [], tierRules: [], targetingRules: []
      });
      loadData();
    } catch (err) {
      console.error('Failed to create plan:', err);
    }
  };

  const handleSubmitPlan = async (planId: string) => {
    await supabase.from('incentive_quarterly_plan')
      .update({ status: 'pending', submitted_at: new Date().toISOString() })
      .eq('id', planId);
    loadData();
  };

  const handleApprovePlan = async (planId: string, approvedAmount: number) => {
    await supabase.from('incentive_quarterly_plan')
      .update({ status: 'approved', approved_amount: approvedAmount, approved_at: new Date().toISOString() })
      .eq('id', planId);
    loadData();
  };

  const handleApproveApplication = async (applicationId: string) => {
    await supabase.from('incentive_applications')
      .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: 'admin' })
      .eq('id', applicationId);
    loadData();
  };

  const handleRejectApplication = async (applicationId: string) => {
    await supabase.from('incentive_applications')
      .update({ status: 'rejected', approved_at: new Date().toISOString() })
      .eq('id', applicationId);
    loadData();
  };

  const handleMarkPaid = async (applicationId: string) => {
    await supabase.from('incentive_applications')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', applicationId);
    loadData();
  };

  const addTarget = () => {
    setPlanForm(prev => ({
      ...prev,
      targets: [...prev.targets, { metric: '', targetValue: 0, unit: '', weight: 0 }]
    }));
  };

  const updateTarget = (index: number, field: keyof IncentiveTarget, value: any) => {
    setPlanForm(prev => ({
      ...prev,
      targets: prev.targets.map((t, i) => i === index ? { ...t, [field]: value } : t)
    }));
  };

  const removeTarget = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      targets: prev.targets.filter((_, i) => i !== index)
    }));
  };

  const addTierRule = () => {
    const lastRule = planForm.tierRules[planForm.tierRules.length - 1];
    const newOrder = planForm.tierRules.length + 1;
    const newMin = lastRule ? (lastRule.maxThreshold || 0) + 1 : 1;
    setPlanForm(prev => ({
      ...prev,
      tierRules: [...prev.tierRules, { planId: '', tierOrder: newOrder, minThreshold: newMin, maxThreshold: undefined, rewardAmount: 0, rewardType: 'fixed' }]
    }));
  };

  const updateTierRule = (index: number, field: keyof IncentiveTierRule, value: any) => {
    setPlanForm(prev => ({
      ...prev,
      tierRules: prev.tierRules.map((t, i) => i === index ? { ...t, [field]: value } : t)
    }));
  };

  const removeTierRule = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      tierRules: prev.tierRules.filter((_, i) => i !== index).map((r, i) => ({ ...r, tierOrder: i + 1 }))
    }));
  };

  const handleCreatePlanFromTemplate = () => {
    if (!selectedPlanForTemplate) return;
    const template = selectedPlanForTemplate;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + template.defaultDurationDays);
    
    setPlanForm({
      title: `${quarter} ${template.name}`,
      description: template.description,
      category: template.config.category || 'volume_rebate',
      scope: template.config.scope || 'global',
      targetPartnerIds: [],
      totalBudget: template.defaultBudget,
      startDate: new Date().toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      direction: template.config.direction?.direction || 'expand_market',
      focusArea: '', priorityLevel: 'medium',
      targetRegions: [], targetTiers: [], targetIndustries: [],
      expectedStartPace: template.config.pace?.expectedStartPace || 20,
      expectedMidPace: template.config.pace?.expectedMidPace || 50,
      expectedEndPace: template.config.pace?.expectedEndPace || 30,
      milestones: [],
      targets: template.config.targets || [],
      tierRules: template.config.tierRules || [],
      targetingRules: []
    });
    setShowTemplateModal(false);
    setShowPlanModal(true);
  };

  const exportFinancialReport = () => {
    const report = settlements.map(s => ({
      partnerName: s.partnerName,
      amount: s.settlementAmount,
      status: s.status,
      invoiceNumber: s.invoiceNumber,
    }));
    const csv = [['合作伙伴', '结算金额', '状态', '发票号'], ...report.map(r => [r.partnerName, r.amount, r.status, r.invoiceNumber || ''])].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `激励结算报表_${currentYear}.csv`;
    a.click();
  };

  const getQuarterlyBudget = (q: string) => {
    const qNum = parseInt(q.replace('Q', ''));
    const budgetMap: Record<number, number> = {
      1: annualBudget?.q1Budget || 0,
      2: annualBudget?.q2Budget || 0,
      3: annualBudget?.q3Budget || 0,
      4: annualBudget?.q4Budget || 0,
    };
    return budgetMap[qNum] || 0;
  };

  const getQuarterlyUsed = (q: string) => {
    return plans.filter(p => p.quarter === q && p.status === 'approved')
      .reduce((s, p) => s + (p.approvedAmount || 0), 0);
  };

  const getNonParticipatingPartners = (planId: string) => {
    const planParticipants = participations.filter(p => p.planId === planId && p.isParticipated);
    const participantIds = planParticipants.map(p => p.partnerId);
    return partners.filter(p => !participantIds.includes(p.id));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">激励政策管理</h1>
          <p className="text-sm text-neutral-500 mt-1">规划全年激励预算，制定季度激励计划，追踪执行效果</p>
        </div>
        <select
          value={currentYear}
          onChange={e => setCurrentYear(parseInt(e.target.value))}
          className="h-9 px-3 bg-white border rounded-lg text-sm"
        >
          <option value={2025}>2025年</option>
          <option value={2026}>2026年</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600/70 font-medium">年度激励预算</p>
              <p className="text-xl font-bold text-blue-700">{cur(stats.annualBudget)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600/70 font-medium">活跃计划</p>
              <p className="text-xl font-bold text-purple-700">{stats.activePlansCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-600/70 font-medium">年度已发放</p>
              <p className="text-xl font-bold text-emerald-700">{cur(stats.totalPayoutYTD)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600/70 font-medium">待审批申请</p>
              <p className="text-xl font-bold text-amber-700">{pendingApplications.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-6">
          {[
            { key: 'budget', label: '年度预算', icon: DollarSign },
            { key: 'plans', label: '激励计划', icon: Target },
            { key: 'applications', label: '申请审批', icon: Send },
            { key: 'executions', label: '执行追踪', icon: BarChart3 },
            { key: 'analytics', label: '效果分析', icon: PieChart },
            { key: 'settlement', label: '财务结算', icon: FileText },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{currentYear}年度激励预算分配</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowBudgetModal(true)}>
                <Edit className="w-4 h-4 mr-1" /> 编辑预算
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                  const budget = getQuarterlyBudget(q);
                  const used = getQuarterlyUsed(q);
                  const pct = budget > 0 ? Math.round((used / budget) * 100) : 0;
                  const isWarning = pct > 90;
                  const isAlert = pct >= 100;
                  return (
                    <div key={q} className="p-4 bg-neutral-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-600">{q}</span>
                        {isAlert ? (
                          <Badge variant="danger" className="text-xs">
                            <StopCircle className="w-3 h-3 mr-1" /> 已超支
                          </Badge>
                        ) : isWarning ? (
                          <Badge variant="warning" className="text-xs">
                            <Bell className="w-3 h-3 mr-1" /> {pct}%
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">{pct}%</Badge>
                        )}
                      </div>
                      <p className="text-lg font-bold text-neutral-900">{cur(budget)}</p>
                      <p className="text-xs text-neutral-500 mt-1">已使用: {cur(used)}</p>
                      <div className="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', isAlert ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500')}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-neutral-600">总预算</span>
                  <span className="font-bold text-blue-700">{cur(stats.annualBudget)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">已分配</span>
                  <span className="font-bold text-purple-700">{cur(plans.reduce((s, p) => s + (p.approvedAmount || 0), 0))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">剩余可用</span>
                  <span className="font-bold text-emerald-700">{cur(stats.annualBudget - plans.reduce((s, p) => s + (p.approvedAmount || 0), 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {pendingPlans.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="bg-amber-50">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  <Clock className="w-5 h-5" />
                  待批复计划 ({pendingPlans.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {pendingPlans.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">{plan.title}</p>
                      <p className="text-sm text-neutral-500">
                        {plan.quarter} · {CATEGORY_LABELS[plan.category].label} · 申请: {cur(plan.totalBudget)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowPlanDetail(plan)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleApprovePlan(plan.id, plan.totalBudget)}>
                        <Check className="w-4 h-4 mr-1" /> 批复
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                <button
                  key={q}
                  onClick={() => setQuarter(q)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    quarter === q
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => setShowTemplateModal(true)}>
              <Layers className="w-4 h-4 mr-1" /> 从模板创建
            </Button>
            <Button variant="brand" size="sm" onClick={() => setShowPlanModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> 新建{quarter}激励计划
            </Button>
          </div>

          <div className="space-y-4">
            {quarterlyPlans.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                  <p className="text-neutral-500">{quarter}暂无激励计划</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
                      <Layers className="w-4 h-4 mr-1" /> 使用模板创建
                    </Button>
                    <Button variant="brand" onClick={() => setShowPlanModal(true)}>
                      <Plus className="w-4 h-4 mr-1" /> 从头创建
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              quarterlyPlans.map(plan => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-neutral-900">{plan.title}</h3>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', CATEGORY_LABELS[plan.category].color)}>
                            {CATEGORY_LABELS[plan.category].label}
                          </span>
                          <Badge variant={plan.scope === 'global' ? 'info' : 'default'}>
                            {plan.scope === 'global' ? '全范围' : '定向'}
                          </Badge>
                          <Badge variant={(STATUS_LABELS[plan.status].color.split(' ')[0].replace('bg-', '') || 'default') as any}>
                            {STATUS_LABELS[plan.status].label}
                          </Badge>
                        </div>

                        {plan.description && (
                          <p className="text-sm text-neutral-500 mb-3">{plan.description}</p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-neutral-600">
                          <span>预算: {cur(plan.approvedAmount || plan.totalBudget)}</span>
                          <span>目标: {plan.targets.length}项</span>
                          <span>{plan.startDate} ~ {plan.endDate}</span>
                        </div>

                        {plan.tierRules && plan.tierRules.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-600" />
                            <span className="text-sm text-amber-700">阶梯奖励: {plan.tierRules.length}个阶梯</span>
                          </div>
                        )}

                        {plan.targets.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {plan.targets.map((t, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                {t.metric}: {t.targetValue}{t.unit || ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {plan.status === 'draft' && (
                          <Button variant="outline" size="sm" onClick={() => handleSubmitPlan(plan.id)}>
                            <Send className="w-4 h-4 mr-1" /> 提交
                          </Button>
                        )}
                        {plan.status === 'pending' && (
                          <Button variant="brand" size="sm" onClick={() => handleApprovePlan(plan.id, plan.totalBudget)}>
                            <Check className="w-4 h-4 mr-1" /> 批复
                          </Button>
                        )}
                        {plan.status === 'approved' && (
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="w-4 h-4 mr-1" /> 评估
                          </Button>
                        )}
                        {plan.tierRules && plan.tierRules.length > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => { setTierRules(plan.tierRules); setShowTierRulesModal(plan.id); }}>
                            <Zap className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setShowPlanDetail(plan)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">激励申请审批</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="default">{applications.length} 条记录</Badge>
                <Badge variant="warning">{pendingApplications.length} 待处理</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                  <p className="text-neutral-500">暂无激励申请</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map(app => (
                    <div key={app.id} className="flex items-start justify-between p-4 bg-neutral-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-neutral-900">{app.partnerName}</span>
                          {app.partnerTier && (
                            <Badge variant="default">{app.partnerTier}</Badge>
                          )}
                          <Badge variant={
                            app.status === 'paid' ? 'success' :
                            app.status === 'approved' ? 'info' :
                            app.status === 'pending' || app.status === 'reviewing' ? 'warning' : 'danger'
                          }>
                            {app.status === 'paid' ? '已发放' :
                             app.status === 'approved' ? '已核准' :
                             app.status === 'pending' ? '待审批' :
                             app.status === 'reviewing' ? '审批中' : '已拒绝'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                          <span>指标: {app.metric}</span>
                          <span>申报: {app.claimedValue}</span>
                          <span>申请金额: {cur(app.payoutAmount)}</span>
                          <span>提交时间: {new Date(app.submittedAt).toLocaleDateString()}</span>
                        </div>
                        {app.relatedDeals && app.relatedDeals.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <Briefcase className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600">关联 {app.relatedDeals.length} 个商机</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {(app.status === 'pending' || app.status === 'reviewing') && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleRejectApplication(app.id)}>
                              <X className="w-4 h-4" /> 拒绝
                            </Button>
                            <Button variant="brand" size="sm" onClick={() => handleApproveApplication(app.id)}>
                              <Check className="w-4 h-4 mr-1" /> 通过
                            </Button>
                          </>
                        )}
                        {app.status === 'approved' && (
                          <Button variant="brand" size="sm" onClick={() => handleMarkPaid(app.id)}>
                            <DollarSign className="w-4 h-4 mr-1" /> 标记已支付
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setShowApplicationDetail(app)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Executions Tab */}
      {activeTab === 'executions' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">激励执行记录</CardTitle>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                  <p className="text-neutral-500">暂无执行记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.map(exec => (
                    <div key={exec.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-neutral-900">{exec.partnerName}</span>
                          {exec.partnerTier && (
                            <Badge variant="default">{exec.partnerTier}</Badge>
                          )}
                          <Badge variant={
                            exec.payoutStatus === 'paid' ? 'success' :
                            exec.payoutStatus === 'approved' ? 'info' :
                            exec.payoutStatus === 'pending' ? 'warning' : 'default'
                          }>
                            {exec.payoutStatus === 'paid' ? '已发放' :
                             exec.payoutStatus === 'approved' ? '已核准' :
                             exec.payoutStatus === 'pending' ? '待核准' : '已拒绝'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                          <span>指标: {exec.metric}</span>
                          <span>达成: {exec.achievedValue}</span>
                          <span>发放: {cur(exec.payoutAmount)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!exec.relatedDeals?.length && (
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedExecution(exec); setShowDealModal(true); }}>
                            <Briefcase className="w-4 h-4 mr-1" /> 转商机
                          </Button>
                        )}
                        {exec.relatedDeals?.length > 0 && (
                          <Badge variant="success">
                            <CheckCircle className="w-3 h-3 mr-1" /> 已转化 {exec.relatedDeals.length} 个
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Pipeline转化看板 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Pipeline转化看板
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600 mb-1">本月目标</p>
                  <p className="text-2xl font-bold text-blue-700">{cur(1000000)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-600 mb-1">激励产生商机</p>
                  <p className="text-2xl font-bold text-green-700">{cur(680000)}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm text-amber-600 mb-1">缺口 (Gap)</p>
                  <p className="text-2xl font-bold text-amber-700">{cur(320000)}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-600 mb-1">完成率</p>
                  <p className="text-2xl font-bold text-purple-700">68%</p>
                </div>
              </div>
              <div className="mt-4 h-8 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full" style={{ width: '68%' }} />
              </div>
            </CardContent>
          </Card>

          {/* ROI分析 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-600" />
                ROI投入产出分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-sm text-neutral-600 mb-1">总发放金额</p>
                  <p className="text-xl font-bold text-red-600">{cur(stats.totalPayoutYTD)}</p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-sm text-neutral-600 mb-1">关联订单金额</p>
                  <p className="text-xl font-bold text-green-600">{cur(stats.totalPayoutYTD * 5)}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <p className="text-sm text-green-600 mb-1">ROI (投入产出比)</p>
                  <p className="text-2xl font-bold text-green-700">5.0x</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600 mb-2">单商机成本</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-blue-700">{cur(5000)}</span>
                    <span className="text-sm text-blue-500 flex items-center">
                      <TrendingDown className="w-4 h-4 mr-1" /> -12% vs 上月
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-600 mb-2">Pipeline贡献率</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-purple-700">35%</span>
                    <span className="text-sm text-purple-500 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" /> +8% vs 上月
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 伙伴参与洞察 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                伙伴参与洞察
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-1" /> 导出未参与名单
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-sm text-neutral-600 mb-1">符合条件伙伴</p>
                  <p className="text-xl font-bold text-neutral-900">{partners.length}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-600 mb-1">已参与</p>
                  <p className="text-xl font-bold text-green-700">{participations.filter(p => p.isParticipated).length}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <p className="text-sm text-amber-600 mb-1">未参与</p>
                  <p className="text-xl font-bold text-amber-700">{partners.length - participations.filter(p => p.isParticipated).length}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600 mb-1">参与率</p>
                  <p className="text-xl font-bold text-blue-700">{Math.round((participations.filter(p => p.isParticipated).length / partners.length) * 100)}%</p>
                </div>
              </div>

              {/* 未参与伙伴名单 */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-3">未参与伙伴名单</h4>
                <div className="flex flex-wrap gap-2">
                  {getNonParticipatingPartners(plans[0]?.id || '').slice(0, 10).map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg">
                      <Users className="w-4 h-4 text-neutral-500" />
                      <span className="text-sm">{p.name}</span>
                      <span className="text-xs text-neutral-400">({p.tier})</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settlement Tab */}
      {activeTab === 'settlement' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                财务结算管理
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-1" /> 同步数据
                </Button>
                <Button variant="brand" size="sm" onClick={exportFinancialReport}>
                  <Download className="w-4 h-4 mr-1" /> 导出报表
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="text-sm text-neutral-600 mb-1">待结算金额</p>
                  <p className="text-xl font-bold text-amber-600">{cur(unpaidSettlements.reduce((s, p) => s + p.settlementAmount, 0))}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-600 mb-1">已支付金额</p>
                  <p className="text-xl font-bold text-green-700">{cur(settlements.filter(s => s.status === 'completed').reduce((s, p) => s + p.settlementAmount, 0))}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600 mb-1">待开发票</p>
                  <p className="text-xl font-bold text-blue-700">{settlements.filter(s => !s.invoiceNumber).length} 笔</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-600 mb-1">结算笔数</p>
                  <p className="text-xl font-bold text-purple-700">{settlements.length} 笔</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium">合作伙伴</th>
                      <th className="text-right py-3 px-4 text-sm font-medium">金额</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">发票号</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">状态</th>
                      <th className="text-left py-3 px-4 text-sm font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map(s => (
                      <tr key={s.id} className="border-b">
                        <td className="py-3 px-4">
                          <span className="font-medium">{s.partnerName}</span>
                        </td>
                        <td className="text-right py-3 px-4">{cur(s.settlementAmount)}</td>
                        <td className="py-3 px-4">{s.invoiceNumber || '-'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            s.status === 'completed' ? 'success' :
                            s.status === 'paid' ? 'info' :
                            s.status === 'invoiced' ? 'warning' : 'default'
                          }>
                            {s.status === 'completed' ? '已完成' :
                             s.status === 'paid' ? '已支付' :
                             s.status === 'invoiced' ? '已开票' : '待结算'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">查看详情</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      {showBudgetModal && (
        <Modal open={showBudgetModal} title={`${currentYear}年度激励预算设置`} onClose={() => setShowBudgetModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">总预算</label>
              <input
                type="number"
                value={budgetForm.totalBudget}
                onChange={e => setBudgetForm(prev => ({ ...prev, totalBudget: parseInt(e.target.value) || 0 }))}
                className="w-full h-9 px-3 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {['q1Budget', 'q2Budget', 'q3Budget', 'q4Budget'].map((field, i) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-2">Q{i + 1}预算</label>
                  <input
                    type="number"
                    value={budgetForm[field as keyof typeof budgetForm]}
                    onChange={e => setBudgetForm(prev => ({ ...prev, [field]: parseInt(e.target.value) || 0 }))}
                    className="w-full h-9 px-3 border rounded-lg"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">备注</label>
              <textarea
                value={budgetForm.notes}
                onChange={e => setBudgetForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full h-20 px-3 border rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBudgetModal(false)}>取消</Button>
              <Button variant="brand" onClick={handleSaveBudget}>保存</Button>
            </div>
          </div>
        </Modal>
      )}

      {showPlanModal && (
        <Modal open={showPlanModal} title={`新建${quarter}激励计划`} onClose={() => setShowPlanModal(false)} size="lg">
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-medium mb-3">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">计划名称</label>
                  <input
                    type="text"
                    value={planForm.title}
                    onChange={e => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-9 px-3 border rounded-lg"
                    placeholder="例如：Q2新客户拓展激励"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">激励类别</label>
                  <select
                    value={planForm.category}
                    onChange={e => setPlanForm(prev => ({ ...prev, category: e.target.value as IncentiveCategory }))}
                    className="w-full h-9 px-3 border rounded-lg"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea
                  value={planForm.description}
                  onChange={e => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full h-20 px-3 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">预算与时间</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">总预算</label>
                  <input
                    type="number"
                    value={planForm.totalBudget}
                    onChange={e => setPlanForm(prev => ({ ...prev, totalBudget: parseInt(e.target.value) || 0 }))}
                    className="w-full h-9 px-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">开始日期</label>
                  <input
                    type="date"
                    value={planForm.startDate}
                    onChange={e => setPlanForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full h-9 px-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">结束日期</label>
                  <input
                    type="date"
                    value={planForm.endDate}
                    onChange={e => setPlanForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full h-9 px-3 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">
                <Filter className="w-4 h-4 inline mr-1" />
                定向规则
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">定向范围</label>
                  <select
                    value={planForm.scope}
                    onChange={e => setPlanForm(prev => ({ ...prev, scope: e.target.value as IncentiveScope }))}
                    className="w-full h-9 px-3 border rounded-lg"
                  >
                    <option value="global">全范围（所有伙伴）</option>
                    <option value="targeted">定向发布</option>
                  </select>
                </div>
                {planForm.scope === 'targeted' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">目标区域</label>
                      <div className="flex flex-wrap gap-2">
                        {REGIONS.map(r => (
                          <button
                            key={r}
                            onClick={() => setPlanForm(prev => ({
                              ...prev,
                              targetRegions: prev.targetRegions.includes(r)
                                ? prev.targetRegions.filter(x => x !== r)
                                : [...prev.targetRegions, r]
                            }))}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm transition-colors',
                              planForm.targetRegions.includes(r)
                                ? 'bg-blue-600 text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">合作伙伴等级</label>
                      <div className="flex flex-wrap gap-2">
                        {PARTNER_TIERS.map(t => (
                          <button
                            key={t}
                            onClick={() => setPlanForm(prev => ({
                              ...prev,
                              targetTiers: prev.targetTiers.includes(t)
                                ? prev.targetTiers.filter(x => x !== t)
                                : [...prev.targetTiers, t]
                            }))}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm transition-colors',
                              planForm.targetTiers.includes(t)
                                ? 'bg-purple-600 text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">目标行业</label>
                      <div className="flex flex-wrap gap-2">
                        {INDUSTRIES.map(i => (
                          <button
                            key={i}
                            onClick={() => setPlanForm(prev => ({
                              ...prev,
                              targetIndustries: prev.targetIndustries.includes(i)
                                ? prev.targetIndustries.filter(x => x !== i)
                                : [...prev.targetIndustries, i]
                            }))}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm transition-colors',
                              planForm.targetIndustries.includes(i)
                                ? 'bg-green-600 text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            )}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">
                <Zap className="w-4 h-4 inline mr-1" />
                阶梯奖励规则
              </h3>
              <div className="space-y-3">
                {planForm.tierRules.length === 0 ? (
                  <div className="text-center py-6 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-500">暂无阶梯规则</p>
                    <Button variant="outline" size="sm" onClick={addTierRule} className="mt-2">
                      <Plus className="w-4 h-4 mr-1" /> 添加阶梯
                    </Button>
                  </div>
                ) : (
                  planForm.tierRules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-medium">
                        {rule.tierOrder}
                      </span>
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-neutral-500">最低阈值</label>
                          <input
                            type="number"
                            value={rule.minThreshold}
                            onChange={e => updateTierRule(index, 'minThreshold', parseInt(e.target.value) || 0)}
                            className="w-full h-7 px-2 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500">最高阈值</label>
                          <input
                            type="number"
                            value={rule.maxThreshold || ''}
                            onChange={e => updateTierRule(index, 'maxThreshold', parseInt(e.target.value) || undefined)}
                            className="w-full h-7 px-2 border rounded text-sm"
                            placeholder="无上限"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500">奖励类型</label>
                          <select
                            value={rule.rewardType}
                            onChange={e => updateTierRule(index, 'rewardType', e.target.value)}
                            className="w-full h-7 px-2 border rounded text-sm"
                          >
                            <option value="fixed">固定金额</option>
                            <option value="percentage">百分比</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500">奖励金额</label>
                          <input
                            type="number"
                            value={rule.rewardAmount}
                            onChange={e => updateTierRule(index, 'rewardAmount', parseInt(e.target.value) || 0)}
                            className="w-full h-7 px-2 border rounded text-sm"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeTierRule(index)}
                        className="p-1 text-neutral-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
                {planForm.tierRules.length > 0 && (
                  <Button variant="outline" size="sm" onClick={addTierRule}>
                    <Plus className="w-4 h-4 mr-1" /> 添加阶梯
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">
                <Target className="w-4 h-4 inline mr-1" />
                激励目标
              </h3>
              <div className="space-y-3">
                {planForm.targets.length === 0 ? (
                  <div className="text-center py-6 bg-neutral-50 rounded-lg">
                    <p className="text-sm text-neutral-500">暂无目标</p>
                    <Button variant="outline" size="sm" onClick={addTarget} className="mt-2">
                      <Plus className="w-4 h-4 mr-1" /> 添加目标
                    </Button>
                  </div>
                ) : (
                  planForm.targets.map((target, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-neutral-500">指标名称</label>
                          <input
                            type="text"
                            value={target.metric}
                            onChange={e => updateTarget(index, 'metric', e.target.value)}
                            className="w-full h-7 px-2 border rounded text-sm"
                            placeholder="例如：报备商机数"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500">目标值</label>
                          <input
                            type="number"
                            value={target.targetValue}
                            onChange={e => updateTarget(index, 'targetValue', parseInt(e.target.value) || 0)}
                            className="w-full h-7 px-2 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500">单位</label>
                          <input
                            type="text"
                            value={target.unit}
                            onChange={e => updateTarget(index, 'unit', e.target.value)}
                            className="w-full h-7 px-2 border rounded text-sm"
                            placeholder="个/元"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500">权重%</label>
                          <input
                            type="number"
                            value={target.weight}
                            onChange={e => updateTarget(index, 'weight', parseInt(e.target.value) || 0)}
                            className="w-full h-7 px-2 border rounded text-sm"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeTarget(index)}
                        className="p-1 text-neutral-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
                {planForm.targets.length > 0 && (
                  <Button variant="outline" size="sm" onClick={addTarget}>
                    <Plus className="w-4 h-4 mr-1" /> 添加目标
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPlanModal(false)}>取消</Button>
              <Button variant="brand" onClick={handleCreatePlan}>创建计划</Button>
            </div>
          </div>
        </Modal>
      )}

      {showTemplateModal && (
        <Modal open={showTemplateModal} title="选择激励模板" onClose={() => setShowTemplateModal(false)}>
          <div className="space-y-3">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                <p className="text-neutral-500">暂无可用模板</p>
              </div>
            ) : (
              templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedPlanForTemplate(template)}
                  className={cn(
                    'p-4 rounded-xl cursor-pointer transition-colors border-2',
                    selectedPlanForTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-100 hover:border-neutral-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-neutral-900">{template.name}</h4>
                      <p className="text-sm text-neutral-500">{template.description}</p>
                    </div>
                    <Badge variant="default">{CATEGORY_LABELS[template.category]?.label}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                    <span>默认预算: {cur(template.defaultBudget)}</span>
                    <span>有效期: {template.defaultDurationDays}天</span>
                  </div>
                </div>
              ))
            )}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowTemplateModal(false)}>取消</Button>
              {selectedPlanForTemplate && (
                <Button variant="brand" onClick={handleCreatePlanFromTemplate}>使用模板</Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {showPlanDetail && (
        <Modal open={!!showPlanDetail} title={showPlanDetail.title} onClose={() => setShowPlanDetail(null)} size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge variant="default">{showPlanDetail.quarter}</Badge>
              <Badge className={CATEGORY_LABELS[showPlanDetail.category].color}>
                {CATEGORY_LABELS[showPlanDetail.category].label}
              </Badge>
              <Badge variant={STATUS_LABELS[showPlanDetail.status].color.split(' ')[0].replace('bg-', '') as any}>
                {STATUS_LABELS[showPlanDetail.status].label}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">计划描述</h4>
              <p className="text-neutral-600">{showPlanDetail.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500">预算金额</p>
                <p className="text-lg font-bold">{cur(showPlanDetail.approvedAmount || showPlanDetail.totalBudget)}</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500">执行周期</p>
                <p className="text-lg font-bold">{showPlanDetail.startDate} ~ {showPlanDetail.endDate}</p>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500">定向范围</p>
                <p className="text-lg font-bold">{showPlanDetail.scope === 'global' ? '全范围' : '定向'}</p>
              </div>
            </div>

            {showPlanDetail.tierRules && showPlanDetail.tierRules.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">阶梯奖励规则</h4>
                <div className="space-y-2">
                  {showPlanDetail.tierRules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-amber-50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs">
                        {rule.tierOrder}
                      </span>
                      <span className="text-sm">
                        {rule.minThreshold} - {rule.maxThreshold || '∞'} : {rule.rewardType === 'fixed' ? cur(rule.rewardAmount) : `${rule.rewardAmount}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showPlanDetail.targets && showPlanDetail.targets.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">激励目标</h4>
                <div className="flex flex-wrap gap-2">
                  {showPlanDetail.targets.map((t, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                      {t.metric}: {t.targetValue}{t.unit} ({t.weight}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showTierRulesModal && (
        <Modal open={!!showTierRulesModal} title="阶梯奖励详情" onClose={() => setShowTierRulesModal(null)}>
          <div className="space-y-3">
            {tierRules.map((rule, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-amber-200 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">第{rule.tierOrder}阶梯</p>
                  <p className="text-sm text-neutral-500">
                    门槛: {rule.minThreshold} - {rule.maxThreshold || '无上限'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-700">
                    {rule.rewardType === 'fixed' ? cur(rule.rewardAmount) : `${rule.rewardAmount}%`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showApplicationDetail && (
        <Modal open={!!showApplicationDetail} title="申请详情" onClose={() => setShowApplicationDetail(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={
                showApplicationDetail.status === 'paid' ? 'success' :
                showApplicationDetail.status === 'approved' ? 'info' :
                showApplicationDetail.status === 'pending' ? 'warning' : 'danger'
              }>
                {showApplicationDetail.status === 'paid' ? '已发放' :
                 showApplicationDetail.status === 'approved' ? '已核准' :
                 showApplicationDetail.status === 'pending' ? '待审批' : '已拒绝'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500">合作伙伴</p>
                <p className="font-medium">{showApplicationDetail.partnerName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">伙伴等级</p>
                <p className="font-medium">{showApplicationDetail.partnerTier}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">申请指标</p>
                <p className="font-medium">{showApplicationDetail.metric}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">申报金额</p>
                <p className="font-medium">{cur(showApplicationDetail.payoutAmount)}</p>
              </div>
            </div>

            {showApplicationDetail.relatedDeals && showApplicationDetail.relatedDeals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">关联商机</h4>
                <div className="space-y-2">
                  {showApplicationDetail.relatedDeals.map((deal: any, i) => (
                    <div key={i} className="p-2 bg-neutral-50 rounded-lg text-sm">
                      {deal.title || `商机 ${i + 1}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showDealModal && (
        <Modal open={showDealModal} title="创建商机" onClose={() => setShowDealModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">商机名称</label>
                <input
                  type="text"
                  value={dealForm.title}
                  onChange={e => setDealForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full h-9 px-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">客户名称</label>
                <input
                  type="text"
                  value={dealForm.customerName}
                  onChange={e => setDealForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full h-9 px-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">金额</label>
                <input
                  type="number"
                  value={dealForm.value}
                  onChange={e => setDealForm(prev => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                  className="w-full h-9 px-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">区域</label>
                <select
                  value={dealForm.region}
                  onChange={e => setDealForm(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full h-9 px-3 border rounded-lg"
                >
                  <option value="">请选择</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDealModal(false)}>取消</Button>
              <Button variant="brand">创建商机</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
