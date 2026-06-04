import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { SearchableSelect } from '../ui/SearchableSelect';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { 
  Target, TrendingUp, Users, Calendar, DollarSign, CheckCircle, Clock,
  Plus, Edit, Trash2, Eye, Send, ThumbsUp, Briefcase, ChevronRight,
  PieChart, BarChart3, Award, AlertCircle, Check, X, Star, Gift
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useConfig } from '../../contexts/ConfigContext';
import { 
  AnnualIncentiveBudget, QuarterlyIncentivePlan, IncentiveScope,
  IncentiveStatus, IncentiveCategory, IncentiveTarget, IncentiveExecution,
  IncentiveEvaluation, IncentivePolicyStats
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
  pending: { label: '待批复', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已批复', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '执行中', color: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
};

interface Props {
  initialYear?: number;
}

export const IncentivePolicyPage: React.FC<Props> = ({ initialYear }) => {
  const { year: urlYear } = useParams();
  const { config } = useConfig();
  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const [currentYear, setCurrentYear] = useState(initialYear || parseInt(urlYear || '2026'));
  const [activeTab, setActiveTab] = useState<'budget' | 'plans' | 'executions' | 'evaluations'>('budget');
  const [quarter, setQuarter] = useState<string>('Q2');

  // Data states
  const [annualBudget, setAnnualBudget] = useState<AnnualIncentiveBudget | null>(null);
  const [plans, setPlans] = useState<QuarterlyIncentivePlan[]>([]);
  const [executions, setExecutions] = useState<IncentiveExecution[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPlanDetail, setShowPlanDetail] = useState<QuarterlyIncentivePlan | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState<QuarterlyIncentivePlan | null | false>(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<IncentiveExecution | null>(null);

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    totalBudget: 0, q1Budget: 0, q2Budget: 0, q3Budget: 0, q4Budget: 0, notes: ''
  });
  const [planForm, setPlanForm] = useState({
    title: '', description: '', category: 'volume_rebate' as IncentiveCategory,
    scope: 'global' as IncentiveScope, targetPartnerIds: [] as string[],
    totalBudget: 0, startDate: '', endDate: '',
    // 方向 - 往哪里跑
    direction: 'expand_market' as any,
    focusArea: '', priorityLevel: 'medium' as 'high' | 'medium' | 'low',
    targetRegions: [] as string[], targetTiers: [] as string[],
    // 节奏 - 跑多快
    expectedStartPace: 20, expectedMidPace: 50, expectedEndPace: 30,
    milestones: [] as { milestone: string; targetDate: string; targetValue: number; weight: number }[],
    // 目标
    targets: [] as IncentiveTarget[]
  });
  const [evaluationForm, setEvaluationForm] = useState({
    participationRate: 0, achievementRate: 0, roi: 0, totalPayout: 0,
    totalRevenue: 0, pipelineCreated: 0, pipelineValue: 0,
    // 公平性
    distributionGini: 0, topPartnerShare: 0, bottomPartnerShare: 0,
    participatedPartnersCount: 0, participationFairnessScore: 5,
    // 满意度
    overallSatisfaction: 5, designSatisfaction: 5, processSatisfaction: 5,
    resultSatisfaction: 5, wouldRecommend: true, NPS: 0,
    // 评分
    designScore: 3, executionScore: 3, resultsScore: 3, satisfactionScore: 3,
    summary: '', feedback: ''
  });
  const [dealForm, setDealForm] = useState({
    title: '', customerName: '', value: 0, stage: 'lead' as any, region: '',
    salesName: '', salesTeam: '', productType: '', expectedCloseDate: ''
  });

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
          submittedAt: p.submitted_at, approvedAt: p.approved_at
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
          relatedDeals: e.related_deals || [], relatedLeads: e.related_leads || [],
          submittedAt: e.submitted_at, approvedAt: e.approved_at, paidAt: e.paid_at, notes: e.notes
        })));
      }

      // Load partners for targeted incentives
      const { data: partnersData } = await supabase
        .from('partners')
        .select('id, name, tier')
        .order('name');
      if (partnersData) setPartners(partnersData);

    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats: IncentivePolicyStats = {
    annualBudget: annualBudget?.totalBudget || 0,
    quarterlyBudgets: [
      { q: 'Q1', budget: annualBudget?.q1Budget || 0, used: plans.filter(p => p.quarter === 'Q1').reduce((s, p) => s + (p.approvedAmount || 0), 0) },
      { q: 'Q2', budget: annualBudget?.q2Budget || 0, used: plans.filter(p => p.quarter === 'Q2').reduce((s, p) => s + (p.approvedAmount || 0), 0) },
      { q: 'Q3', budget: annualBudget?.q3Budget || 0, used: plans.filter(p => p.quarter === 'Q3').reduce((s, p) => s + (p.approvedAmount || 0), 0) },
      { q: 'Q4', budget: annualBudget?.q4Budget || 0, used: plans.filter(p => p.quarter === 'Q4').reduce((s, p) => s + (p.approvedAmount || 0), 0) },
    ],
    activePlansCount: plans.filter(p => p.status === 'in_progress' || p.status === 'approved').length,
    totalPayoutYTD: executions.filter(e => e.payoutStatus === 'paid').reduce((s, e) => s + e.payoutAmount, 0),
    avgAchievementRate: 0,
    topPerformers: []
  };

  const quarterlyPlans = plans.filter(p => p.quarter === quarter);
  const pendingPlans = plans.filter(p => p.status === 'pending');
  const completedPlans = plans.filter(p => p.status === 'completed');

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
        target_partner_ids: planForm.scope === 'targeted' ? planForm.targetPartnerIds : [],
        target_partner_names: planForm.scope === 'targeted' ? 
          planForm.targetPartnerIds.map(id => partners.find(p => p.id === id)?.name || id) : [],
        total_budget: planForm.totalBudget,
        approved_amount: 0,
        status: 'draft',
        start_date: planForm.startDate,
        end_date: planForm.endDate,
        // 方向
        direction: {
          direction: planForm.direction,
          focusArea: planForm.focusArea,
          priorityLevel: planForm.priorityLevel,
          targetRegions: planForm.targetRegions,
          targetTiers: planForm.targetTiers,
        },
        // 节奏
        pace: {
          expectedStartPace: planForm.expectedStartPace,
          expectedMidPace: planForm.expectedMidPace,
          expectedEndPace: planForm.expectedEndPace,
          milestoneSchedule: planForm.milestones,
        },
        targets: planForm.targets,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabase.from('incentive_quarterly_plan').insert(planData);
      setShowPlanModal(false);
      setPlanForm({
        title: '', description: '', category: 'volume_rebate', scope: 'global',
        targetPartnerIds: [], totalBudget: 0, startDate: '', endDate: '',
        direction: 'expand_market', focusArea: '', priorityLevel: 'medium',
        targetRegions: [], targetTiers: [],
        expectedStartPace: 20, expectedMidPace: 50, expectedEndPace: 30, milestones: [],
        targets: []
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

  const handleStartPlan = async (planId: string) => {
    await supabase.from('incentive_quarterly_plan')
      .update({ status: 'in_progress' })
      .eq('id', planId);
    loadData();
  };

  const handleCompletePlan = async (planId: string) => {
    await supabase.from('incentive_quarterly_plan')
      .update({ status: 'completed' })
      .eq('id', planId);
    loadData();
  };

  const handleSaveEvaluation = async () => {
    if (!showEvaluationModal || typeof showEvaluationModal === 'boolean') return;
    try {
      const evalData: any = {
        plan_id: showEvaluationModal.id,
        participation_rate: evaluationForm.participationRate,
        achievement_rate: evaluationForm.achievementRate,
        roi: evaluationForm.roi,
        total_payout: evaluationForm.totalPayout,
        total_revenue: evaluationForm.totalRevenue,
        pipeline_created: evaluationForm.pipelineCreated,
        pipeline_value: evaluationForm.pipelineValue,
        scores: {
          design: evaluationForm.designScore,
          execution: evaluationForm.executionScore,
          results: evaluationForm.resultsScore,
          satisfaction: evaluationForm.satisfactionScore
        },
        summary: evaluationForm.summary,
        feedback: evaluationForm.feedback,
        evaluated_at: new Date().toISOString()
      };

      await supabase.from('incentive_evaluations').insert(evalData);
      setShowEvaluationModal(null);
      loadData();
    } catch (err) {
      console.error('Failed to save evaluation:', err);
    }
  };

  const handleCreateDealFromExecution = async () => {
    if (!selectedExecution || !dealForm.title) return;
    try {
      const dealData: any = {
        title: dealForm.title,
        customer_name: dealForm.customerName || selectedExecution.partnerName,
        value: dealForm.value,
        stage: dealForm.stage,
        region: dealForm.region,
        sales_name: dealForm.salesName,
        sales_team: dealForm.salesTeam,
        product_type: dealForm.productType,
        expected_close_date: dealForm.expectedCloseDate,
        partner_id: selectedExecution.partnerId,
        partner_name: selectedExecution.partnerName,
        status: 'active',
        created_date: new Date().toISOString(),
        last_activity_date: new Date().toISOString(),
        source_info: {
          source: 'incentive' as any,
          relatedIncentiveExecutionId: selectedExecution.id,
          leadQuality: 'Warm'
        }
      };

      const { data: newDeal } = await supabase.from('deals').insert(dealData).select().single();
      if (newDeal) {
        // Update execution with related deal
        await supabase.from('incentive_executions')
          .update({ related_deals: [...(selectedExecution.relatedDeals || []), newDeal.id] })
          .eq('id', selectedExecution.id);
        setShowDealModal(false);
        setSelectedExecution(null);
        loadData();
      }
    } catch (err) {
      console.error('Failed to create deal:', err);
    }
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
    return plans.filter(p => p.quarter === q && (p.status === 'approved' || p.status === 'in_progress' || p.status === 'completed'))
      .reduce((s, p) => s + (p.approvedAmount || 0), 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">激励政策管理</h1>
          <p className="text-sm text-neutral-500 mt-1">规划全年激励预算，制定季度激励计划，追踪执行效果</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={currentYear}
            onChange={e => setCurrentYear(parseInt(e.target.value))}
            className="h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
          >
            <option value={2025}>2025年</option>
            <option value={2026}>2026年</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600/70 font-medium">年度激励预算</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{cur(stats.annualBudget)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600/70 font-medium">活跃计划</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{stats.activePlansCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-600/70 font-medium">年度已发放</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{cur(stats.totalPayoutYTD)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600/70 font-medium">剩余预算</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {cur(stats.annualBudget - plans.reduce((s, p) => s + (p.approvedAmount || 0), 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-6">
          {[
            { key: 'budget', label: '年度预算', icon: DollarSign },
            { key: 'plans', label: '激励计划', icon: Target },
            { key: 'executions', label: '执行追踪', icon: BarChart3 },
            { key: 'evaluations', label: '效果评估', icon: ThumbsUp },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
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
          {/* Quarterly Budget Overview */}
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
                  return (
                    <div key={q} className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{q}</span>
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          pct > 90 ? 'bg-red-100 text-red-700' : pct > 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        )}>
                          {pct}%
                        </span>
                      </div>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">{cur(budget)}</p>
                      <p className="text-xs text-neutral-500 mt-1">已使用: {cur(used)}</p>
                      <div className="mt-2 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500')}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Budget Summary */}
              <div className="flex items-center gap-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">总预算</span>
                  <span className="font-bold text-blue-700">{cur(stats.annualBudget)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">已分配</span>
                  <span className="font-bold text-purple-700">{cur(plans.reduce((s, p) => s + (p.approvedAmount || 0), 0))}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">剩余可用</span>
                  <span className="font-bold text-emerald-700">{cur(stats.annualBudget - plans.reduce((s, p) => s + (p.approvedAmount || 0), 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          {pendingPlans.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="bg-amber-50 dark:bg-amber-900/20 rounded-t-lg">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Clock className="w-5 h-5" />
                  待批复计划 ({pendingPlans.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {pendingPlans.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white">{plan.title}</p>
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
          {/* Quarter Selector */}
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
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <Button variant="brand" size="sm" onClick={() => setShowPlanModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> 新建{quarter}激励计划
            </Button>
          </div>

          {/* Plans List */}
          <div className="space-y-4">
            {quarterlyPlans.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                  <p className="text-neutral-500">{quarter}暂无激励计划</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowPlanModal(true)}>
                    创建第一个计划
                  </Button>
                </CardContent>
              </Card>
            ) : (
              quarterlyPlans.map(plan => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">{plan.title}</h3>
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

                        <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
                          <span>预算: {cur(plan.approvedAmount || plan.totalBudget)}</span>
                          <span>目标: {plan.targets.length}项</span>
                          <span>{plan.startDate} ~ {plan.endDate}</span>
                        </div>

                        {plan.targets.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {plan.targets.map((t, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
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
                        {plan.status === 'approved' && (
                          <Button variant="brand" size="sm" onClick={() => handleStartPlan(plan.id)}>
                            开始执行
                          </Button>
                        )}
                        {plan.status === 'in_progress' && (
                          <Button variant="outline" size="sm" onClick={() => handleCompletePlan(plan.id)}>
                            <Check className="w-4 h-4 mr-1" /> 完成
                          </Button>
                        )}
                        {plan.status === 'completed' && (
                          <Button variant="ghost" size="sm" onClick={() => { setShowPlanDetail(plan); setShowEvaluationModal(plan as any); }}>
                            <ThumbsUp className="w-4 h-4 mr-1" /> 评估
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
                    <div key={exec.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-neutral-900 dark:text-white">{exec.partnerName}</span>
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
                            <CheckCircle className="w-3 h-3 mr-1" /> 已转化
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

      {/* Evaluations Tab */}
      {activeTab === 'evaluations' && (
        <div className="space-y-4">
          {completedPlans.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ThumbsUp className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                <p className="text-neutral-500">暂无已完成需要评估的计划</p>
              </CardContent>
            </Card>
          ) : (
            completedPlans.map(plan => (
              <Card key={plan.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{plan.title}</h3>
                      <p className="text-sm text-neutral-500">{plan.quarter} · {CATEGORY_LABELS[plan.category].label}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setShowPlanDetail(plan); setShowEvaluationModal(plan as any); }}>
                      <Star className="w-4 h-4 mr-1" /> 评估
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <Modal open onClose={() => setShowBudgetModal(false)} title="编辑年度激励预算">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">年度总预算</label>
              <input
                type="number"
                value={budgetForm.totalBudget}
                onChange={e => setBudgetForm(prev => ({ ...prev, totalBudget: Number(e.target.value) }))}
                className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                <div key={q}>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">{q}预算</label>
                  <input
                    type="number"
                    value={budgetForm[`${q.toLowerCase()}Budget` as keyof typeof budgetForm]}
                    onChange={e => setBudgetForm(prev => ({ ...prev, [`${q.toLowerCase()}Budget`]: Number(e.target.value) }))}
                    className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">备注</label>
              <textarea
                value={budgetForm.notes}
                onChange={e => setBudgetForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full h-20 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowBudgetModal(false)}>取消</Button>
              <Button variant="brand" onClick={handleSaveBudget}>保存</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <Modal open onClose={() => setShowPlanModal(false)} title={`新建${quarter}激励计划`} size="lg">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">计划名称</label>
              <input
                type="text"
                value={planForm.title}
                onChange={e => setPlanForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                placeholder="如：Q2新产品破冰激励"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">激励类别</label>
              <select
                value={planForm.category}
                onChange={e => setPlanForm(prev => ({ ...prev, category: e.target.value as IncentiveCategory }))}
                className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">激励范围</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={planForm.scope === 'global'}
                    onChange={() => setPlanForm(prev => ({ ...prev, scope: 'global', targetPartnerIds: [] }))}
                  />
                  <span className="text-sm">全范围（所有渠道商）</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={planForm.scope === 'targeted'}
                    onChange={() => setPlanForm(prev => ({ ...prev, scope: 'targeted' }))}
                  />
                  <span className="text-sm">定向（指定渠道商）</span>
                </label>
              </div>
            </div>

            {planForm.scope === 'targeted' && (
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">选择目标渠道商</label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {partners.map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.targetPartnerIds.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setPlanForm(prev => ({ ...prev, targetPartnerIds: [...prev.targetPartnerIds, p.id] }));
                          } else {
                            setPlanForm(prev => ({ ...prev, targetPartnerIds: prev.targetPartnerIds.filter(id => id !== p.id) }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{p.name}</span>
                      <span className="text-xs text-neutral-400">({p.tier})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">开始日期</label>
                <input
                  type="date"
                  value={planForm.startDate}
                  onChange={e => setPlanForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">结束日期</label>
                <input
                  type="date"
                  value={planForm.endDate}
                  onChange={e => setPlanForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">预算金额</label>
              <input
                type="number"
                value={planForm.totalBudget}
                onChange={e => setPlanForm(prev => ({ ...prev, totalBudget: Number(e.target.value) }))}
                className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
              />
            </div>

            {/* 方向设定 - 往哪里跑 */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" /> 方向设定 - 往哪里跑
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">激励方向</label>
                  <select
                    value={planForm.direction}
                    onChange={e => setPlanForm(prev => ({ ...prev, direction: e.target.value }))}
                    className="w-full h-9 px-2 bg-white dark:bg-neutral-800 border rounded text-sm"
                  >
                    <option value="expand_market">市场扩张</option>
                    <option value="defend_territory">防守阵地</option>
                    <option value="accelerate_sales">加速销售</option>
                    <option value="retain_partners">伙伴留存</option>
                    <option value="develop_capability">能力发展</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">优先级</label>
                  <select
                    value={planForm.priorityLevel}
                    onChange={e => setPlanForm(prev => ({ ...prev, priorityLevel: e.target.value as any }))}
                    className="w-full h-9 px-2 bg-white dark:bg-neutral-800 border rounded text-sm"
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">重点领域</label>
                <input
                  type="text"
                  value={planForm.focusArea}
                  onChange={e => setPlanForm(prev => ({ ...prev, focusArea: e.target.value }))}
                  placeholder="如：华东区、金牌伙伴、新产品"
                  className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded text-sm"
                />
              </div>
            </div>

            {/* 节奏设定 - 跑多快 */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> 节奏设定 - 跑多快
              </h4>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">起始节奏 (%)</label>
                  <input
                    type="number"
                    value={planForm.expectedStartPace}
                    onChange={e => setPlanForm(prev => ({ ...prev, expectedStartPace: Number(e.target.value) }))}
                    className="w-full h-9 px-2 bg-white dark:bg-neutral-800 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">中期节奏 (%)</label>
                  <input
                    type="number"
                    value={planForm.expectedMidPace}
                    onChange={e => setPlanForm(prev => ({ ...prev, expectedMidPace: Number(e.target.value) }))}
                    className="w-full h-9 px-2 bg-white dark:bg-neutral-800 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">收尾节奏 (%)</label>
                  <input
                    type="number"
                    value={planForm.expectedEndPace}
                    onChange={e => setPlanForm(prev => ({ ...prev, expectedEndPace: Number(e.target.value) }))}
                    className="w-full h-9 px-2 bg-white dark:bg-neutral-800 border rounded text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 h-2 bg-white dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${planForm.expectedStartPace}%` }} />
                </div>
                <div className="flex-1 h-2 bg-white dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 rounded-full" style={{ width: `${planForm.expectedMidPace}%` }} />
                </div>
                <div className="flex-1 h-2 bg-white dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${planForm.expectedEndPace}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>起始期</span><span>中期</span><span>收尾期</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">计划描述</label>
              <textarea
                value={planForm.description}
                onChange={e => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full h-20 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg resize-none"
              />
            </div>

            {/* Targets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">激励目标</label>
                <Button variant="ghost" size="sm" onClick={addTarget}>
                  <Plus className="w-4 h-4 mr-1" /> 添加目标
                </Button>
              </div>
              {planForm.targets.map((target, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={target.metric}
                    onChange={e => updateTarget(i, 'metric', e.target.value)}
                    placeholder="指标名称"
                    className="flex-1 h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    value={target.targetValue || ''}
                    onChange={e => updateTarget(i, 'targetValue', Number(e.target.value))}
                    placeholder="目标值"
                    className="w-24 h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={target.unit || ''}
                    onChange={e => updateTarget(i, 'unit', e.target.value)}
                    placeholder="单位"
                    className="w-16 h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    value={target.weight || ''}
                    onChange={e => updateTarget(i, 'weight', Number(e.target.value))}
                    placeholder="权重%"
                    className="w-20 h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeTarget(i)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPlanModal(false)}>取消</Button>
              <Button variant="brand" onClick={handleCreatePlan}>创建计划</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Plan Detail Modal */}
      {showPlanDetail && (
        <Modal open onClose={() => setShowPlanDetail(null)} title="计划详情" size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{showPlanDetail.title}</h3>
              <Badge>{CATEGORY_LABELS[showPlanDetail.category].label}</Badge>
              <Badge variant={showPlanDetail.scope === 'global' ? 'info' : 'default'}>
                {showPlanDetail.scope === 'global' ? '全范围' : '定向'}
              </Badge>
            </div>

            {showPlanDetail.description && (
              <p className="text-neutral-600 dark:text-neutral-400">{showPlanDetail.description}</p>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-neutral-500">预算</p>
                <p className="font-bold">{cur(showPlanDetail.approvedAmount || showPlanDetail.totalBudget)}</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-neutral-500">时间</p>
                <p className="font-medium text-sm">{showPlanDetail.startDate} ~ {showPlanDetail.endDate}</p>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <p className="text-xs text-neutral-500">目标数</p>
                <p className="font-bold">{showPlanDetail.targets.length}</p>
              </div>
            </div>

            {showPlanDetail.targets.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">激励目标</h4>
                <div className="space-y-2">
                  {showPlanDetail.targets.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm font-medium">{t.metric}</span>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        目标: {t.targetValue}{t.unit || ''} {t.weight ? `(权重${t.weight}%)` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showPlanDetail.scope === 'targeted' && showPlanDetail.targetPartnerNames?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">目标渠道商</h4>
                <div className="flex flex-wrap gap-2">
                  {showPlanDetail.targetPartnerNames.map((name, i) => (
                    <Badge key={i} variant="default">{name}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && typeof showEvaluationModal === 'object' && (
        <Modal open onClose={() => setShowEvaluationModal(false)} title="激励效果评估" size="lg">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="font-medium text-blue-800 dark:text-blue-200">{showEvaluationModal.title}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{showEvaluationModal.quarter} · {CATEGORY_LABELS[showEvaluationModal.category].label}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">参与率 (%)</label>
                <input
                  type="number"
                  max="100"
                  value={evaluationForm.participationRate}
                  onChange={e => setEvaluationForm(prev => ({ ...prev, participationRate: Number(e.target.value) }))}
                  className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">目标达成率 (%)</label>
                <input
                  type="number"
                  max="100"
                  value={evaluationForm.achievementRate}
                  onChange={e => setEvaluationForm(prev => ({ ...prev, achievementRate: Number(e.target.value) }))}
                  className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">ROI (投入产出比)</label>
                <input
                  type="number"
                  step="0.1"
                  value={evaluationForm.roi}
                  onChange={e => setEvaluationForm(prev => ({ ...prev, roi: Number(e.target.value) }))}
                  className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">总发放金额</label>
                <input
                  type="number"
                  value={evaluationForm.totalPayout}
                  onChange={e => setEvaluationForm(prev => ({ ...prev, totalPayout: Number(e.target.value) }))}
                  className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">带来总收入</label>
                <input
                  type="number"
                  value={evaluationForm.totalRevenue}
                  onChange={e => setEvaluationForm(prev => ({ ...prev, totalRevenue: Number(e.target.value) }))}
                  className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">创建商机数</label>
                <input
                  type="number"
                  value={evaluationForm.pipelineCreated}
                  onChange={e => setEvaluationForm(prev => ({ ...prev, pipelineCreated: Number(e.target.value) }))}
                  className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                />
              </div>
            </div>

            {/* 公平性考核 */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> 公平性考核
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">分配基尼系数 (0-1)</label>
                  <input
                    type="number"
                    step="0.01"
                    max="1"
                    value={evaluationForm.distributionGini}
                    onChange={e => setEvaluationForm(prev => ({ ...prev, distributionGini: Number(e.target.value) }))}
                    className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">越接近0越公平</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">头部伙伴占比 (%)</label>
                  <input
                    type="number"
                    max="100"
                    value={evaluationForm.topPartnerShare}
                    onChange={e => setEvaluationForm(prev => ({ ...prev, topPartnerShare: Number(e.target.value) }))}
                    className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">参与伙伴数</label>
                  <input
                    type="number"
                    value={evaluationForm.participatedPartnersCount}
                    onChange={e => setEvaluationForm(prev => ({ ...prev, participatedPartnersCount: Number(e.target.value) }))}
                    className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">公平性评分 (1-10)</label>
                  <input
                    type="number"
                    max="10"
                    value={evaluationForm.participationFairnessScore}
                    onChange={e => setEvaluationForm(prev => ({ ...prev, participationFairnessScore: Number(e.target.value) }))}
                    className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 满意度考核 */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" /> 满意度考核
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">整体满意度 (1-10)</label>
                  <input
                    type="number"
                    max="10"
                    value={evaluationForm.overallSatisfaction}
                    onChange={e => setEvaluationForm(prev => ({ ...prev, overallSatisfaction: Number(e.target.value) }))}
                    className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">方案设计满意度</label>
                  <input
                    type="number"
                    max="10"
                    value={evaluationForm.designSatisfaction}
                    onChange={e => setEvaluationForm(prev => ({ ...prev, designSatisfaction: Number(e.target.value) }))}
                    className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">执行流程满意度</label>
                  <input
                    type="number"
                    max="10"
                    value={evaluationForm.processSatisfaction}
                    onChange={e => setEvaluationForm(prev => ({ ...prev, processSatisfaction: Number(e.target.value) }))}
                    className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">结果满意度</label>
                  <input
                    type="number"
                    max="10"
                    value={evaluationForm.resultSatisfaction}
                    onChange={e => setEvaluationForm(prev => ({ ...prev, resultSatisfaction: Number(e.target.value) }))}
                    className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-1">净推荐值 NPS (-100~100)</label>
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    value={evaluationForm.NPS}
                    onChange={e => setEvaluationForm(prev => ({ ...prev, NPS: Number(e.target.value) }))}
                    className="w-full h-9 px-3 bg-white dark:bg-neutral-800 border rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evaluationForm.wouldRecommend}
                      onChange={e => setEvaluationForm(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">愿意推荐给他人</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Scores */}
            <div>
              <h4 className="font-medium mb-3">各维度评分 (1-5分)</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'designScore', label: '方案设计' },
                  { key: 'executionScore', label: '执行力' },
                  { key: 'resultsScore', label: '效果' },
                  { key: 'satisfactionScore', label: '满意度' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setEvaluationForm(prev => ({ ...prev, [item.key]: star }))}
                          className="p-1"
                        >
                          <Star
                            className={cn('w-5 h-5', star <= (evaluationForm as any)[item.key] ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300')}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">评估总结</label>
              <textarea
                value={evaluationForm.summary}
                onChange={e => setEvaluationForm(prev => ({ ...prev, summary: e.target.value }))}
                className="w-full h-20 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">改进建议</label>
              <textarea
                value={evaluationForm.feedback}
                onChange={e => setEvaluationForm(prev => ({ ...prev, feedback: e.target.value }))}
                className="w-full h-20 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border rounded-lg resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEvaluationModal(false)}>取消</Button>
              <Button variant="brand" onClick={handleSaveEvaluation}>保存评估</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Deal Modal */}
      {showDealModal && selectedExecution && (
        <Modal open onClose={() => { setShowDealModal(false); setSelectedExecution(null); }} title="将激励成果转化为商机">
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <p className="font-medium text-emerald-800 dark:text-emerald-200">{selectedExecution.partnerName}</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                达成: {selectedExecution.metric} = {selectedExecution.achievedValue} | 发放: {cur(selectedExecution.payoutAmount)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">商机名称</label>
              <input
                type="text"
                value={dealForm.title}
                onChange={e => setDealForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
                placeholder={`${selectedExecution.partnerName} - 商机`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">客户名称</label>
              <input
                type="text"
                value={dealForm.customerName}
                onChange={e => setDealForm(prev => ({ ...prev, customerName: e.target.value }))}
                className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 block mb-1">商机金额</label>
              <input
                type="number"
                value={dealForm.value}
                onChange={e => setDealForm(prev => ({ ...prev, value: Number(e.target.value) }))}
                className="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setShowDealModal(false); setSelectedExecution(null); }}>取消</Button>
              <Button variant="brand" onClick={handleCreateDealFromExecution}>
                <Briefcase className="w-4 h-4 mr-1" /> 创建商机
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
