import React from 'react';
import {
  Clock, Activity, TrendingUp, AlertTriangle, CheckCircle2, BarChart3,
  ArrowRight, Zap, Target, Shield, Users, Rocket, BookOpen, Handshake,
  Globe, Layers, Sparkles, ChevronUp, ChevronDown, FileText, Building2
} from 'lucide-react';
import type {
  DealLifecycleStageV2, PartnerLifecycleStage, IncentiveLifecycleStage,
  TrainingProgramLifecycleStage, MarketingLifecycleStage,
  PartnerMaturityStage, PartnerMaturityHealth, PartnerMaturityEvent,
  DealMaturityStage, DealMaturityHealth, DealMaturityEvent,
  MarketingMaturityStage, MarketingMaturityHealth, MarketingMaturityEvent,
  IncentiveMaturityStage, IncentiveMaturityHealth, IncentiveMaturityEvent,
} from '../types';
import { MARKETING_MATURITY_STAGE_CONFIG, INCENTIVE_MATURITY_STAGE_CONFIG } from '../types';
import { LIFECYCLE_CONFIG, MATURITY_STAGE_CONFIG } from '../services/lifecycle-service';

interface LifecycleStageProps {
  currentStage: string;
  stages: { key: string; label: string; icon?: React.ReactNode }[];
  onStageClick?: (stage: string) => void;
  daysInCurrentStage?: number;
  maxDaysInStage?: number;
  healthScore?: number;
  title?: string;
}

// 通用生命周期追踪组件
export function LifecycleTracker({
  currentStage,
  stages,
  onStageClick,
  daysInCurrentStage,
  maxDaysInStage,
  healthScore,
  title,
}: LifecycleStageProps) {
  const currentIdx = stages.findIndex(s => s.key === currentStage);
  const isOverdue = daysInCurrentStage !== undefined && maxDaysInStage !== undefined && daysInCurrentStage > maxDaysInStage;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-600" />
          <h3 className="font-semibold text-neutral-900">{title || '生命周期追踪'}</h3>
        </div>
        {healthScore !== undefined && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${healthScore >= 80 ? 'bg-emerald-50 text-emerald-700' : healthScore >= 60 ? 'bg-amber-50 text-amber-700' : healthScore >= 40 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
            <CheckCircle2 className="w-3 h-3" />
            <span>健康度 {healthScore}</span>
          </div>
        )}
      </div>

      {/* 阶段进度条 */}
      <div className="flex items-center mb-4">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.key}>
            <div
              className={`flex flex-col items-center flex-shrink-0 ${onStageClick ? 'cursor-pointer' : ''}`}
              onClick={() => onStageClick?.(stage.key)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                idx < currentIdx
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-600'
                  : idx === currentIdx
                    ? 'bg-brand-100 border-brand-500 text-brand-700 ring-4 ring-brand-50 ring-offset-0 animate-pulse'
                    : 'bg-neutral-50 border-neutral-300 text-neutral-400'
              }`}>
                {stage.icon || (idx < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-medium">{idx + 1}</span>)}
              </div>
              <span className={`text-xs mt-1.5 max-w-20 text-center leading-tight ${
                idx <= currentIdx ? 'text-neutral-700' : 'text-neutral-400'
              }`}>
                {stage.label}
              </span>
            </div>
            {idx < stages.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 bg-neutral-200 relative">
                <div
                  className={`absolute inset-y-0 left-0 transition-all ${
                    idx < currentIdx ? 'bg-emerald-400 w-full' : idx === currentIdx ? 'bg-brand-400 w-1/2' : 'w-0'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 状态信息 */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-neutral-50 rounded p-3">
          <div className="text-xs text-neutral-500 mb-1">当前阶段</div>
          <div className="text-sm font-semibold text-neutral-800">
            {stages.find(s => s.key === currentStage)?.label || currentStage}
          </div>
        </div>
        {daysInCurrentStage !== undefined && (
          <div className={`rounded p-3 ${isOverdue ? 'bg-amber-50' : 'bg-neutral-50'}`}>
            <div className={`text-xs mb-1 ${isOverdue ? 'text-amber-600' : 'text-neutral-500'}`}>
              已停留 {daysInCurrentStage} 天
              {maxDaysInStage !== undefined && ` / 建议 ${maxDaysInStage} 天`}
            </div>
            {isOverdue && (
              <div className="flex items-center gap-1 text-xs font-medium text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                <span>超时，需推进</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 商机阶段配置
const DEAL_STAGES = [
  { key: 'Registered', label: '报备' },
  { key: 'UnderReview', label: '审核' },
  { key: 'Approved', label: '立项' },
  { key: 'Solution', label: '方案' },
  { key: 'Commercial', label: '商务' },
  { key: 'Negotiation', label: '谈判' },
  { key: 'ClosedWon', label: '赢单' },
  { key: 'ClosedLost', label: '丢单' },
];

// 商机生命周期追踪组件
export function DealLifecycleTracker({
  dealId,
  currentStage,
  value,
  daysInCurrentStage,
  onAdvance,
}: {
  dealId: string;
  currentStage: DealLifecycleStageV2;
  value: number;
  daysInCurrentStage?: number;
  onAdvance?: (newStage: string) => void;
}) {
  const probability = LIFECYCLE_CONFIG.dealStageProbabilities[currentStage] || 0;
  const maxDays = LIFECYCLE_CONFIG.dealStageMaxDays[currentStage];
  const weightedValue = value * (probability / 100);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-brand-50 to-emerald-50 px-5 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-700" />
            <h3 className="font-semibold text-neutral-900">商机生命周期追踪</h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-neutral-500">赢单概率</span>
              <span className="ml-2 font-bold text-brand-700">{probability}%</span>
            </div>
            <div className="border-l border-neutral-300 pl-4">
              <span className="text-neutral-500">加权金额</span>
              <span className="ml-2 font-bold text-emerald-700">¥{(weightedValue / 10000).toFixed(1)}万</span>
            </div>
            <div className="border-l border-neutral-300 pl-4">
              <span className="text-neutral-500">商机金额</span>
              <span className="ml-2 font-bold text-neutral-800">¥{(value / 10000).toFixed(1)}万</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <LifecycleTracker
          currentStage={currentStage}
          stages={DEAL_STAGES}
          daysInCurrentStage={daysInCurrentStage}
          maxDaysInStage={maxDays}
          title={`商机阶段进度 (当前: ${currentStage})`}
          onStageClick={onAdvance}
        />
      </div>
    </div>
  );
}

// 合作伙伴阶段配置
const PARTNER_STAGES = [
  { key: 'Prospecting', label: '潜在' },
  { key: 'Application', label: '申请' },
  { key: 'UnderReview', label: '审核' },
  { key: 'Approved', label: '签约' },
  { key: 'Onboarding', label: '入职' },
  { key: 'Active', label: '活跃' },
  { key: 'RetentionReview', label: '续约' },
  { key: 'Renewed', label: '已续' },
  { key: 'Dormant', label: '休眠' },
  { key: 'Terminated', label: '终止' },
];

// 合作伙伴生命周期追踪组件
export function PartnerLifecycleTracker({
  partnerName,
  currentStage,
  daysInCurrentStage,
  healthScore,
  onAdvance,
}: {
  partnerName: string;
  currentStage: PartnerLifecycleStage;
  daysInCurrentStage?: number;
  healthScore?: number;
  onAdvance?: (newStage: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-brand-50 px-5 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-700" />
            <h3 className="font-semibold text-neutral-900">合作伙伴生命周期</h3>
            <span className="text-sm text-neutral-600 ml-2">{partnerName}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <LifecycleTracker
          currentStage={currentStage}
          stages={PARTNER_STAGES}
          daysInCurrentStage={daysInCurrentStage}
          healthScore={healthScore}
          onStageClick={onAdvance}
        />
      </div>
    </div>
  );
}

// 激励计划阶段配置
const INCENTIVE_STAGES = [
  { key: 'Draft', label: '草稿' },
  { key: 'Planning', label: '规划' },
  { key: 'Active', label: '进行中' },
  { key: 'Evaluation', label: '评估' },
  { key: 'Payout', label: '发放' },
  { key: 'Completed', label: '完成' },
  { key: 'Expired', label: '过期' },
];

// 营销活动阶段配置
const MARKETING_STAGES = [
  { key: 'Draft', label: '草案' },
  { key: 'Planning', label: '策划' },
  { key: 'Scheduled', label: '排期' },
  { key: 'Active', label: '进行中' },
  { key: 'Converting', label: '转化' },
  { key: 'Reporting', label: '复盘' },
  { key: 'Completed', label: '完成' },
  { key: 'Archived', label: '归档' },
];

// 健康度仪表盘小部件
export function HealthIndicator({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-24 h-24 text-lg',
  };

  const colorClasses = score >= 80
    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
    : score >= 60
      ? 'border-amber-400 bg-amber-50 text-amber-700'
      : score >= 40
        ? 'border-orange-400 bg-orange-50 text-orange-700'
        : 'border-red-400 bg-red-50 text-red-700';

  const statusText = score >= 80 ? '健康' : score >= 60 ? '关注' : score >= 40 ? '预警' : '风险';

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size]} ${colorClasses} border-4 rounded-full flex items-center justify-center font-bold`}>
        {score}
      </div>
      <span className="text-xs text-neutral-600 mt-2">{statusText}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// 合作伙伴关系深度生命周期追踪组件 (Partner Maturity Lifecycle)
// ────────────────────────────────────────────────────────────────────────────────
//
// 核心4阶段理念：
//   1. Transactional - 准入与匹配期（交易驱动）
//   2. Transitional  - 赋能与激活期（能力过渡）
//   3. Relational    - 协同与共创期（关系驱动）
//   4. Symbiotic     - 演进与共生期（战略驱动）

/** 4阶段关系深度进度条 */
export function PartnerMaturityTracker({
  partnerName,
  maturityHealth,
  events,
  onStageClick,
}: {
  partnerName: string;
  maturityHealth: PartnerMaturityHealth | null;
  events: PartnerMaturityEvent[];
  onStageClick?: (stage: PartnerMaturityStage) => void;
}) {
  // 4阶段配置
  const STAGES: { key: PartnerMaturityStage; label: string; short: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
    {
      key: 'Transactional',
      label: '准入期',
      short: '交易驱动',
      icon: <Zap className="w-4 h-4" />,
      color: 'text-sky-700',
      bgColor: 'bg-sky-50',
    },
    {
      key: 'Transitional',
      label: '赋能期',
      short: '能力过渡',
      icon: <BookOpen className="w-4 h-4" />,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
    },
    {
      key: 'Relational',
      label: '协同期',
      short: '关系驱动',
      icon: <Handshake className="w-4 h-4" />,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
    },
    {
      key: 'Symbiotic',
      label: '共生期',
      short: '战略驱动',
      icon: <Globe className="w-4 h-4" />,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
    },
  ];

  const currentStage = maturityHealth?.currentStage || 'Transactional';
  const currentIdx = STAGES.findIndex(s => s.key === currentStage);
  const currentConfig = MATURITY_STAGE_CONFIG[currentStage];

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
      {/* ── 头部：标题和总体健康度 ── */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 dark:from-indigo-950/50 dark:via-sky-950/30 dark:to-emerald-950/50 px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">关系深度生命周期</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{partnerName} · 从"交易合作"到"战略共生"</p>
            </div>
          </div>
          {/* 健康度徽章 */}
          {maturityHealth && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">综合评分</div>
                <div className={`text-2xl font-black ${maturityHealth.status === 'healthy' ? 'text-emerald-600' : maturityHealth.status === 'monitoring' ? 'text-amber-600' : 'text-red-600'}`}>
                  {maturityHealth.overallScore}
                </div>
              </div>
              <div className={`w-14 h-14 rounded-2xl border-4 flex items-center justify-center ${maturityHealth.status === 'healthy' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : maturityHealth.status === 'monitoring' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-red-400 bg-red-50 text-red-700'}`}>
                <span className="text-xs font-bold">
                  {maturityHealth.status === 'healthy' ? '健康' : maturityHealth.status === 'monitoring' ? '关注' : '预警'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4阶段进度条 ── */}
      <div className="px-6 py-6">
        <div className="flex items-stretch gap-2">
          {STAGES.map((stage, idx) => {
            const isActive = idx === currentIdx;
            const isPassed = idx < currentIdx;
            const isFuture = idx > currentIdx;
            const stageConfig = MATURITY_STAGE_CONFIG[stage.key];

            return (
              <React.Fragment key={stage.key}>
                {/* 阶段节点 */}
                <div
                  className={`relative flex-1 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                    isActive
                      ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-white shadow-lg ring-4 ring-indigo-100 dark:ring-indigo-950/50'
                      : isPassed
                        ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-white'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900'
                  }`}
                  onClick={() => onStageClick?.(stage.key)}
                >
                  <div className="p-4">
                    {/* 阶段编号和图标 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isActive ? 'bg-indigo-500 text-white' :
                        isPassed ? 'bg-emerald-500 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                          当前阶段
                        </span>
                      )}
                      {isPassed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                          已达成
                        </span>
                      )}
                    </div>

                    {/* 阶段标题 */}
                    <div className={`font-bold text-sm ${
                      isActive ? 'text-indigo-900 dark:text-indigo-100' :
                      isPassed ? 'text-emerald-900 dark:text-emerald-100' : 'text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {stage.label}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">{stage.short}</div>

                    {/* 阶段核心要点 */}
                    <div className="space-y-1.5 mt-3">
                      <div className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-neutral-400 mt-0.5 shrink-0">身份</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{stageConfig.identityPosition}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-neutral-400 mt-0.5 shrink-0">利益</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{stageConfig.benefitDriver}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-neutral-400 mt-0.5 shrink-0">管理</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{stageConfig.managementFocus}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-neutral-400 mt-0.5 shrink-0">基石</span>
                        <span className="text-neutral-700 dark:text-neutral-300">{stageConfig.stabilityFoundation}</span>
                      </div>
                    </div>

                    {/* 阶段停留时间 */}
                    {maturityHealth && isActive && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral-500 dark:text-neutral-400">
                            <Clock className="w-3 h-3 inline mr-1" />
                            已停留 {maturityHealth.daysInCurrentStage} 天
                          </span>
                          <span className="text-neutral-400 dark:text-neutral-500">
                            平均 {stageConfig.avgDaysInStage} 天
                          </span>
                        </div>
                        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                            style={{ width: `${Math.min(100, (maturityHealth.daysInCurrentStage / stageConfig.avgDaysInStage) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 阶段之间的箭头 */}
                {idx < STAGES.length - 1 && (
                  <div className="flex items-center justify-center w-8 shrink-0">
                    <div className={`p-1.5 rounded-full ${
                      idx < currentIdx ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500'
                    }`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── 6大维度能力雷达图 / 进度条 ── */}
      {maturityHealth && (
        <div className="px-6 pb-6">
          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-neutral-900 dark:text-white text-sm">6 大关系维度评估</h4>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                基于商机报备、培训参与、协同共创、系统使用等数据自动计算
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'dealActivity', label: '商机活跃度', score: maturityHealth.dimensionScores.dealActivity.score, trend: maturityHealth.dimensionScores.dealActivity.trend, icon: <Target className="w-3 h-3" /> },
                { key: 'capability', label: '能力建设', score: maturityHealth.dimensionScores.capability.score, trend: maturityHealth.dimensionScores.capability.trend, icon: <Shield className="w-3 h-3" /> },
                { key: 'enablement', label: '赋能参与', score: maturityHealth.dimensionScores.enablement.score, trend: maturityHealth.dimensionScores.enablement.trend, icon: <BookOpen className="w-3 h-3" /> },
                { key: 'collaboration', label: '协同共创', score: maturityHealth.dimensionScores.collaboration.score, trend: maturityHealth.dimensionScores.collaboration.trend, icon: <Handshake className="w-3 h-3" /> },
                { key: 'strategicAlignment', label: '战略对齐', score: maturityHealth.dimensionScores.strategicAlignment.score, trend: maturityHealth.dimensionScores.strategicAlignment.trend, icon: <Rocket className="w-3 h-3" /> },
                { key: 'systemIntegration', label: '系统耦合', score: maturityHealth.dimensionScores.systemIntegration.score, trend: maturityHealth.dimensionScores.systemIntegration.trend, icon: <Layers className="w-3 h-3" /> },
              ].map((dim) => (
                <div key={dim.key} className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-700 dark:text-neutral-300 font-semibold">
                      {dim.icon}
                      <span>{dim.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-bold ${
                        dim.score >= 70 ? 'text-emerald-600' : dim.score >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>{dim.score}</span>
                      {dim.trend === 'up' && <ChevronUp className="w-3 h-3 text-emerald-500" />}
                      {dim.trend === 'down' && <ChevronDown className="w-3 h-3 text-red-500" />}
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dim.score >= 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                        dim.score >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 晋级评估与差距分析 ── */}
      {maturityHealth && maturityHealth.promotionReadiness && (
        <div className="px-6 pb-6">
          <div className={`rounded-xl border-2 p-5 ${
            maturityHealth.promotionReadiness.canPromote
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800'
              : 'bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border-indigo-200 dark:border-indigo-800'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-neutral-900 dark:text-white text-sm">晋级评估</h4>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  下一阶段：{maturityHealth.promotionReadiness.nextStageLabel}
                </p>
              </div>
              {/* 晋级准备度圆环 */}
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-neutral-200 dark:text-neutral-700" />
                  <circle
                    cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - maturityHealth.promotionReadiness.readinessPercentage / 100)}`}
                    strokeLinecap="round"
                    className={maturityHealth.promotionReadiness.canPromote ? 'text-emerald-500' : 'text-indigo-500'}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">{maturityHealth.promotionReadiness.readinessPercentage}%</span>
                </div>
              </div>
            </div>

            {/* 差距分析 */}
            {maturityHealth.promotionReadiness.gapAnalysis.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">关键差距与改进建议：</p>
                <div className="space-y-2">
                  {maturityHealth.promotionReadiness.gapAnalysis.slice(0, 4).map((gap, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 bg-white/60 dark:bg-neutral-900/50 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold ${
                        gap.priority === 'high' ? 'bg-red-500' :
                        gap.priority === 'medium' ? 'bg-amber-500' : 'bg-sky-500'
                      }`}>
                        {gap.priority === 'high' ? '!' : gap.priority === 'medium' ? '·' : '·'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{gap.dimension}</span>
                          <span className="text-neutral-500 dark:text-neutral-400">
                            当前 {Math.round(gap.currentValue)} → 需 {Math.round(gap.requiredValue)}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">{gap.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {maturityHealth.promotionReadiness.canPromote && (
              <div className="mt-3 p-3 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  ✨ 已满足晋级条件！建议与渠道经理沟通，手动推进至下一阶段
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 风险预警 ── */}
      {maturityHealth && maturityHealth.riskAlerts.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-neutral-900 dark:text-white text-sm">风险预警与机会</h4>
            </div>
            <div className="space-y-2">
              {maturityHealth.riskAlerts.slice(0, 3).map((alert, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  alert.type === 'opportunity' ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800' :
                  alert.severity === 'high' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' :
                  alert.severity === 'medium' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' :
                  'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                }`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    alert.type === 'opportunity' ? 'bg-sky-500 text-white' :
                    alert.severity === 'high' ? 'bg-red-500 text-white' :
                    alert.severity === 'medium' ? 'bg-amber-500 text-white' : 'bg-neutral-400 text-white'
                  }`}>
                    {alert.type === 'opportunity' ? <Sparkles className="w-3 h-3" /> : '!'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{alert.title}</div>
                    <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">{alert.detail}</div>
                    {alert.action && (
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                        → {alert.action}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 跃迁事件时间线 ── */}
      {events && events.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-neutral-900 dark:text-white text-sm">关系深度演进事件</h4>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                共 {events.length} 个关键事件
              </span>
            </div>

            <div className="relative">
              {/* 时间线 */}
              <div className="space-y-3">
                {events.slice(0, 5).map((event, idx) => {
                  const stageInfo = MATURITY_STAGE_CONFIG[event.toStage];
                  return (
                    <div key={event.id || idx} className="flex items-start gap-3">
                      {/* 节点 */}
                      <div className="relative flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                          event.toStage === 'Symbiotic' ? 'bg-amber-500 text-white' :
                          event.toStage === 'Relational' ? 'bg-emerald-500 text-white' :
                          event.toStage === 'Transitional' ? 'bg-indigo-500 text-white' : 'bg-sky-500 text-white'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        {idx < Math.min(events.length, 5) - 1 && (
                          <div className="w-0.5 flex-1 bg-gradient-to-b from-neutral-300 dark:from-neutral-700 to-transparent min-h-[24px]" />
                        )}
                      </div>
                      {/* 内容 */}
                      <div className="flex-1 pb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            {event.fromStage ? `${MATURITY_STAGE_CONFIG[event.fromStage].label} → ` : ''}
                            {stageInfo.label}
                          </span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                            {new Date(event.eventDate).toLocaleDateString('zh-CN')}
                            {event.autoDetected && ' · 系统识别'}
                          </span>
                        </div>
                        {event.reason && (
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                            {event.reason}
                          </p>
                        )}
                        {event.operator && (
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-500 mt-1">
                            操作人：{event.operator}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 底部说明 ── */}
      <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30">
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          <Building2 className="w-3 h-3" />
          <span>
            <strong className="text-neutral-700 dark:text-neutral-300">关系深度管理理念：</strong>
            将合作伙伴从"外部独立的利益交易者"，通过持续的赋能与利益重构，
            转化为"深度耦合的战略共生体"。核心是关注合作关系的"质"而非仅仅"量"。
          </span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// 商机4阶段关系深度生命周期追踪组件 (Deal Maturity Tracker)
// ────────────────────────────────────────────────────────────────────────────────

/** 商机4阶段关系深度健康度追踪卡片 */
export function DealMaturityTracker({
  dealTitle,
  maturityHealth,
  events,
  onStageClick,
}: {
  dealTitle: string;
  maturityHealth: DealMaturityHealth | null;
  events: DealMaturityEvent[];
  onStageClick?: (stage: DealMaturityStage) => void;
}) {
  if (!maturityHealth) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
        <div className="flex flex-col items-center text-center gap-2">
          <Layers className="w-8 h-8 text-neutral-400" />
          <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">暂无商机评估数据</div>
          <div className="text-xs text-neutral-500">系统正在分析该商机的4阶段关系深度生命周期...</div>
        </div>
      </div>
    );
  }

  const STAGES: {
    key: DealMaturityStage; label: string; short: string; color: string; bgColor: string; borderColor: string;
    icon: React.ReactNode; description: string; avgDays: number;
  }[] = [
    { key: 'Registration', label: '报备期', short: 'Lead→Opp', color: 'text-sky-700', bgColor: 'bg-sky-50', borderColor: 'border-sky-200',
      icon: <FileText className="w-4 h-4" />, description: '确权与保护：将伙伴口中的"线索"转化为受保护的商机', avgDays: 3 },
    { key: 'Collaboration', label: '协同期', short: 'Co-selling', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200',
      icon: <Users className="w-4 h-4" />, description: '联合攻坚：厂商与伙伴通过能力互补打动客户', avgDays: 30 },
    { key: 'Closing', label: '成交期', short: 'Closing', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200',
      icon: <CheckCircle2 className="w-4 h-4" />, description: '利益博弈：临门一脚，合同签署确认前期投入', avgDays: 21 },
    { key: 'Expansion', label: '循环期', short: 'Expansion', color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200',
      icon: <Globe className="w-4 h-4" />, description: '生态循环：LTV、续约、增购，形成三方共赢', avgDays: 365 },
  ];

  const currentStageIndex = STAGES.findIndex(s => s.key === maturityHealth.currentStage);
  const pillarData = [
    { key: 'identity', label: '身份', score: maturityHealth.pillarScores.identity.score, trend: maturityHealth.pillarScores.identity.trend,
      evidence: maturityHealth.pillarScores.identity.evidence, weight: 0.25, description: '确权/保护/信息完整度' },
    { key: 'value', label: '价值', score: maturityHealth.pillarScores.value.score, trend: maturityHealth.pillarScores.value.trend,
      evidence: maturityHealth.pillarScores.value.evidence, weight: 0.30, description: '联合方案/PoC/需求匹配度' },
    { key: 'management', label: '管理', score: maturityHealth.pillarScores.management.score, trend: maturityHealth.pillarScores.management.trend,
      evidence: maturityHealth.pillarScores.management.evidence, weight: 0.25, description: '资源配置/响应效率/审批' },
    { key: 'stickiness', label: '粘性', score: maturityHealth.pillarScores.stickiness.score, trend: maturityHealth.pillarScores.stickiness.trend,
      evidence: maturityHealth.pillarScores.stickiness.evidence, weight: 0.20, description: '客户成功/交付/长期关系' },
  ];

  // 健康状态样式
  const statusStyle = (() => {
    switch (maturityHealth.status) {
      case 'healthy': return { text: '健康', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' };
      case 'monitoring': return { text: '关注', color: 'text-sky-700', bg: 'bg-sky-100', border: 'border-sky-200' };
      case 'at_risk': return { text: '预警', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' };
      case 'critical': return { text: '风险', color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200' };
    }
  })();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">

      {/* 头部：标题和总体健康度 */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-5 h-5 text-brand" />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">商机关系深度演进追踪</h3>
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {dealTitle} · 当前阶段 <span className="font-semibold text-neutral-700 dark:text-neutral-200">{maturityHealth.currentStageLabel}</span>
            · 已停留 <span className="font-semibold">{maturityHealth.daysInCurrentStage}</span> 天
          </div>
        </div>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${statusStyle.bg} ${statusStyle.border} border`}>
          <div>
            <div className={`text-xs font-bold uppercase tracking-wide ${statusStyle.color}`}>综合健康度</div>
            <div className={`text-3xl font-black ${statusStyle.color} leading-none`}>{maturityHealth.overallScore}</div>
          </div>
          <div className="w-px h-10 bg-white/30 mx-1" />
          <div>
            <div className={`text-xs font-semibold ${statusStyle.color}`}>{statusStyle.text}</div>
            <div className="text-xs text-neutral-500 mt-1">赢单概率 <span className="font-bold">{maturityHealth.winProbability}%</span></div>
          </div>
        </div>
      </div>

      {/* 4阶段进度条 */}
      <div className="p-6 bg-neutral-50/50 dark:bg-neutral-800/30">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center justify-between">
          <span>关系深度演进路径</span>
          <span className="text-neutral-400 normal-case">确权 → 联合攻坚 → 利益博弈 → 生态循环</span>
        </div>
        <div className="flex gap-2">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div key={stage.key} className="flex-1" onClick={() => onStageClick?.(stage.key)}>
                <div className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  isCurrent ? `${stage.bgColor} ${stage.borderColor} shadow-md ring-2 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 ring-brand/40`
                  : isCompleted ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? `${stage.bgColor} ${stage.color}` : 'bg-neutral-100 text-neutral-400'}`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stage.icon}
                    </div>
                    <div className={`text-xs font-bold ${isCurrent ? stage.color : isCompleted ? 'text-emerald-700' : 'text-neutral-400'}`}>{stage.short}</div>
                  </div>
                  <div className={`text-sm font-bold mb-1 ${isCurrent ? stage.color : isCompleted ? 'text-emerald-700' : 'text-neutral-700 dark:text-neutral-300'}`}>{stage.label}</div>
                  <div className="text-[11px] text-neutral-500 leading-relaxed">{stage.description}</div>
                  <div className="mt-3 pt-3 border-t border-white/50 dark:border-neutral-700/50 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500">平均 {stage.avgDays} 天</span>
                    {isCurrent && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stage.bgColor} ${stage.color}`}>
                        已停留 {maturityHealth.daysInCurrentStage}天
                      </span>
                    )}
                    {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </div>
                </div>
                {idx < STAGES.length - 1 && (
                  <div className="relative h-1 mx-4 -mt-1 mb-1">
                    <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                    {(isCompleted || isCurrent) && <div className={`absolute inset-y-0 left-0 ${isCurrent ? 'bg-brand/60' : 'bg-emerald-500'} rounded-full w-full`} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4支柱评分卡 */}
      <div className="p-6 border-t border-neutral-200 dark:border-neutral-800">
        <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          4支柱能力评估（综合评分：{maturityHealth.overallScore}）
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pillarData.map((pillar) => {
            const icon = pillar.key === 'identity' ? <Shield className="w-4 h-4" />
              : pillar.key === 'value' ? <Zap className="w-4 h-4" />
              : pillar.key === 'management' ? <Target className="w-4 h-4" />
              : <Users className="w-4 h-4" />;
            const isHigh = pillar.score >= 70;
            return (
              <div key={pillar.key} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isHigh ? 'bg-emerald-500/10 text-emerald-700' : pillar.score >= 40 ? 'bg-sky-500/10 text-sky-700' : 'bg-amber-500/10 text-amber-700'}`}>
                      {icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">{pillar.label}</div>
                      <div className="text-[10px] text-neutral-400">权重 {Math.round(pillar.weight * 100)}%</div>
                    </div>
                  </div>
                  <div className={`text-xl font-black ${isHigh ? 'text-emerald-600' : pillar.score >= 40 ? 'text-sky-600' : 'text-amber-600'}`}>{pillar.score}</div>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${isHigh ? 'bg-emerald-500' : pillar.score >= 40 ? 'bg-sky-500' : 'bg-amber-500'}`} style={{ width: `${pillar.score}%` }} />
                </div>
                <div className="text-[11px] text-neutral-500 mb-2">{pillar.description}</div>
                {pillar.evidence.length > 0 && (
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {pillar.evidence.slice(0, 3).map((ev, i) => (
                      <div key={i} className="text-[10px] text-neutral-500 flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 晋级评估与差距分析 */}
      <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-brand/5 to-sky-50/30 dark:from-brand/10 dark:to-sky-900/10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">晋级准备度</div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              迈向 <span className="font-bold">{maturityHealth.promotionReadiness.nextStageLabel}</span>
              {maturityHealth.promotionReadiness.canPromote && <span className="text-emerald-600 font-semibold ml-2">✓ 可晋级</span>}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-black ${maturityHealth.promotionReadiness.canPromote ? 'text-emerald-600' : 'text-sky-600'}`}>
              {maturityHealth.promotionReadiness.readinessPercentage}%
            </div>
            <div className="text-[10px] text-neutral-500">准备度</div>
          </div>
        </div>

        <div className="h-3 bg-neutral-200/60 dark:bg-neutral-700/50 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${maturityHealth.promotionReadiness.canPromote ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-sky-400 to-brand'}`}
            style={{ width: `${maturityHealth.promotionReadiness.readinessPercentage}%` }}
          />
        </div>

        {maturityHealth.promotionReadiness.gapAnalysis.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-brand" />
              待提升项（{maturityHealth.promotionReadiness.gapAnalysis.length}）
            </div>
            <div className="space-y-2">
              {maturityHealth.promotionReadiness.gapAnalysis.slice(0, 4).map((gap, idx) => (
                <div key={idx} className={`p-3 rounded-lg border text-xs ${
                  gap.priority === 'high' ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-900/10'
                  : gap.priority === 'medium' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10'
                  : 'border-sky-200 bg-sky-50/50 dark:border-sky-900/30 dark:bg-sky-900/10'
                }`}>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        gap.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        : gap.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                      }`}>{gap.priority === 'high' ? '高' : gap.priority === 'medium' ? '中' : '低'}</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-100">{gap.pillarLabel}支柱</span>
                    </div>
                    <div className="text-neutral-500 whitespace-nowrap">{gap.currentValue} / {gap.requiredValue}</div>
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{gap.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {maturityHealth.promotionReadiness.gapAnalysis.length === 0 && (
          <div className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            4支柱均已达标！继续保持健康的协同关系。
          </div>
        )}
      </div>

      {/* 风险预警 */}
      {maturityHealth.riskAlerts.length > 0 && (
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">风险预警（{maturityHealth.riskAlerts.length}）</span>
            </div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {maturityHealth.riskAlerts.slice(0, 5).map((alert, idx) => (
              <div key={idx} className={`p-3 rounded-lg border text-sm ${
                alert.severity === 'high' ? 'border-rose-200 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-900/10'
                : alert.severity === 'medium' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/10'
                : 'border-neutral-200 bg-neutral-50/50 dark:border-neutral-700 dark:bg-neutral-800/50'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm">{alert.title}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    alert.severity === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                    : alert.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}>{alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}</span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">{alert.detail}</div>
                {alert.action && (
                  <div className="text-[11px] text-neutral-500 bg-white/50 dark:bg-black/10 rounded p-2">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">建议行动 → </span>
                    {alert.action}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 阶段演进事件时间线 */}
      {events.length > 0 && (
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-800/20">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">演进事件时间线</span>
          </div>
          <div className="space-y-3">
            {events.slice(0, 6).map((event, idx) => {
              const fromCfg = event.fromStage ? STAGES.find(s => s.key === event.fromStage) : null;
              const toCfg = STAGES.find(s => s.key === event.toStage);
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-neutral-900 border-2 border-brand flex items-center justify-center text-[10px] font-bold text-brand shadow-sm">
                      {idx + 1}
                    </div>
                    {idx < events.length - 1 && idx < 5 && <div className="w-0.5 h-6 bg-brand/30 mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {fromCfg ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${fromCfg.bgColor} ${fromCfg.color}`}>{fromCfg.label}</span>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">首次建立</span>
                      )}
                      <ArrowRight className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      {toCfg && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${toCfg.bgColor} ${toCfg.color}`}>{toCfg.label}</span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mb-1">
                      {new Date(event.eventDate).toLocaleDateString()}
                      {event.operator && <span className="ml-2">由 {event.operator} 触发</span>}
                    </div>
                    {event.reason && <div className="text-xs text-neutral-600 dark:text-neutral-400">{event.reason}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部说明 */}
      <div className="p-4 bg-gradient-to-r from-neutral-50 to-transparent dark:from-neutral-800/30 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 flex items-start gap-2">
        <Sparkles className="w-3 h-3 text-brand flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">商机生命周期与传统销售漏斗的关键差异：</span>
          传统漏斗关注"成交"，伙伴生态下的商机关注"协同效率"。
          从 <span className="font-semibold">报备保护</span> → <span className="font-semibold">联合赋能</span> → <span className="font-semibold">利益分享</span> → <span className="font-semibold">生态循环</span>，
          将冰冷的销售数据转化为厂商与伙伴之间建立信任、输出能力、分享利益、达成共生的载体。
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════════
// 市场活动生命周期4阶段关系深度追踪组件
// 策划期 → 赋能期 → 执行期 → 闭环期
// 4支柱：身份（战略对齐）、价值（内容共创）、管理（预算/审批）、粘性（线索转化/ROI）
// ══════════════════════════════════════════════════════════════════════════════════
export function MarketingMaturityTracker({
  campaignName,
  maturityHealth,
  events,
  onStageClick,
}: {
  campaignName: string;
  maturityHealth: MarketingMaturityHealth | null;
  events: MarketingMaturityEvent[];
  onStageClick?: (stage: MarketingMaturityStage) => void;
}) {
  // 4阶段配置：策划期 → 赋能期 → 执行期 → 闭环期
  const STAGES: {
    key: MarketingMaturityStage; label: string; short: string; icon: React.ReactNode;
    color: string; bgColor: string; stageColor: string;
  }[] = [
    { key: 'Alignment', label: '策划期', short: '战略对齐', icon: <Target className="w-4 h-4" />, color: 'text-purple-700', bgColor: 'bg-purple-50 dark:bg-purple-900/30', stageColor: 'from-purple-500 to-purple-400' },
    { key: 'CoCreation', label: '赋能期', short: '内容共创', icon: <Sparkles className="w-4 h-4" />, color: 'text-violet-700', bgColor: 'bg-violet-50 dark:bg-violet-900/30', stageColor: 'from-violet-500 to-violet-400' },
    { key: 'Execution', label: '执行期', short: '协同爆发', icon: <Zap className="w-4 h-4" />, color: 'text-fuchsia-700', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-900/30', stageColor: 'from-fuchsia-500 to-fuchsia-400' },
    { key: 'Optimization', label: '闭环期', short: '价值沉淀', icon: <Globe className="w-4 h-4" />, color: 'text-pink-700', bgColor: 'bg-pink-50 dark:bg-pink-900/30', stageColor: 'from-pink-500 to-pink-400' },
  ];

  const currentStageIdx = Math.max(0, STAGES.findIndex(s => s.key === (maturityHealth?.currentStage || 'Alignment')));
  const overallScore = maturityHealth?.overallScore || 0;
  const scoreColor = overallScore >= 80 ? 'text-emerald-600' : overallScore >= 60 ? 'text-sky-600' : overallScore >= 40 ? 'text-amber-600' : 'text-rose-600';
  const scoreBg = overallScore >= 80 ? 'bg-emerald-500' : overallScore >= 60 ? 'bg-sky-500' : overallScore >= 40 ? 'bg-amber-500' : 'bg-rose-500';

  const pillarList: { key: 'identity' | 'value' | 'management' | 'stickiness'; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'identity', label: '身份', desc: '战略对齐 · 共同发起者', icon: <Target className="w-4 h-4" /> },
    { key: 'value', label: '价值', desc: '内容共创 · 联合方案', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'management', label: '管理', desc: 'MDF预算 · 审批流程', icon: <Shield className="w-4 h-4" /> },
    { key: 'stickiness', label: '粘性', desc: '线索转化 · ROI闭环', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const fmt = (v: number) => {
    if (!v || v === 0) return '0';
    if (v >= 10000) return (v / 10000).toFixed(1) + '万';
    return String(Math.round(v));
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">

      {/* 头部：标题 + 总体评分 + 当前阶段 */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-purple-50/80 via-white to-sky-50/60 dark:from-purple-900/20 dark:via-neutral-900 dark:to-sky-900/20">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1.5 tracking-wider uppercase">
              <Shield className="w-4 h-4" /> 市场活动关系深度 · 4阶段
            </div>
            <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">{campaignName}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              从战略对齐开始，经过资源赋能与联合执行，实现线索转化与品牌价值沉淀的闭环
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">综合评分</div>
              <div className={`text-4xl font-black ${scoreColor} tracking-tight`}>{overallScore}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">当前阶段</div>
              <div className={`text-lg font-bold ${STAGES[currentStageIdx].color} flex items-center gap-1.5`}>
                {STAGES[currentStageIdx].icon} {STAGES[currentStageIdx].label}
              </div>
            </div>
            {maturityHealth && maturityHealth.estimatedROI > 0 && (
              <div className="text-center">
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">ROI</div>
                <div className="text-lg font-bold text-emerald-600">{maturityHealth.estimatedROI}×</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4阶段进度条 */}
      <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          {/* 背景线 */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          {/* 已完成进度 */}
          <div className={`absolute top-5 left-0 h-1 bg-gradient-to-r ${STAGES[0].stageColor} rounded-full`}
               style={{ width: `${currentStageIdx === STAGES.length - 1 ? 100 : (currentStageIdx * 100 / (STAGES.length - 1))}%` }} />

          {/* 阶段节点 */}
          <div className="grid grid-cols-4 gap-2 relative">
            {STAGES.map((stage, idx) => {
              const isActive = idx === currentStageIdx;
              const isPast = idx < currentStageIdx;
              const isFuture = idx > currentStageIdx;
              return (
                <div key={stage.key} className="flex flex-col items-center">
                  <button
                    onClick={() => onStageClick?.(stage.key)}
                    className={`relative z-10 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive ? 'border-purple-500 bg-white dark:bg-neutral-800 scale-110 shadow-lg ring-4 ring-purple-100 dark:ring-purple-900/30' :
                      isPast ? 'border-purple-400 bg-gradient-to-br from-purple-400 to-violet-400 text-white' :
                      'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-400'
                    } hover:scale-105`}
                  >
                    {stage.icon}
                  </button>
                  <div className={`mt-2 text-sm font-bold ${isActive ? 'text-purple-700 dark:text-purple-300' : isPast ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {stage.label}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">{stage.short}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 当前阶段描述 */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 dark:from-purple-900/30 to-sky-50 dark:to-sky-900/20 border border-purple-100 dark:border-purple-800">
          <div className="text-xs text-purple-700 dark:text-purple-300 font-bold mb-1.5">
            {STAGES[currentStageIdx].label}：{MARKETING_MATURITY_STAGE_CONFIG[STAGES[currentStageIdx].key].identityPosition}
          </div>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {MARKETING_MATURITY_STAGE_CONFIG[STAGES[currentStageIdx].key].description}
          </p>
        </div>
      </div>

      {/* 4支柱评分 */}
      <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-800/30">
        <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand" />
          4支柱健康评估（决定推进到下一阶段的核心指标）
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pillarList.map((pillar) => {
            const data = maturityHealth?.pillarScores?.[pillar.key];
            const score = data?.score || 0;
            const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-sky-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500';
            const textColor = score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-sky-700' : score >= 40 ? 'text-amber-700' : 'text-rose-700';
            return (
              <div key={pillar.key} className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className={`flex items-center gap-1.5 text-sm font-bold ${textColor}`}>{pillar.icon}{pillar.label}</span>
                  <span className={`text-2xl font-black ${textColor}`}>{score}</span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mb-2">{pillar.desc}</p>
                {data && data.evidence.length > 0 && (
                  <ul className="text-[10px] text-neutral-600 dark:text-neutral-400 space-y-1">
                    {data.evidence.slice(0, 2).map((ev, i) => (
                      <li key={i} className="flex items-start gap-1.5"><span className="text-neutral-400 mt-0.5">·</span><span className="flex-1">{ev}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 晋级分析 */}
      {maturityHealth && maturityHealth.promotionReadiness.gapAnalysis.length > 0 && (
        <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                晋级准备度：推进到{maturityHealth.promotionReadiness.nextStageLabel}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">根据当前阶段4支柱评分，识别提升到下一阶段需补足的关键能力</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">准备度</div>
              <div className={`text-3xl font-black ${
                maturityHealth.promotionReadiness.readinessPercentage >= 80 ? 'text-emerald-600' :
                maturityHealth.promotionReadiness.readinessPercentage >= 60 ? 'text-sky-600' :
                maturityHealth.promotionReadiness.readinessPercentage >= 40 ? 'text-amber-600' : 'text-rose-600'
              }`}>{maturityHealth.promotionReadiness.readinessPercentage}%</div>
            </div>
          </div>

          <div className="space-y-3">
            {maturityHealth.promotionReadiness.gapAnalysis.map((gap, idx) => (
              <div key={idx} className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                gap.priority === 'high' ? 'border-rose-200 bg-rose-50/60 dark:bg-rose-900/20 dark:border-rose-800' :
                gap.priority === 'medium' ? 'border-amber-200 bg-amber-50/60 dark:bg-amber-900/20 dark:border-amber-800' :
                'border-sky-200 bg-sky-50/60 dark:bg-sky-900/20 dark:border-sky-800'
              }`}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-black text-white ${
                  gap.priority === 'high' ? 'bg-rose-500' : gap.priority === 'medium' ? 'bg-amber-500' : 'bg-sky-500'
                }`}>
                  {gap.currentValue}→{gap.requiredValue}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-neutral-900 dark:text-white mb-0.5">{gap.pillarLabel}支柱需提升</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{gap.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 风险预警 */}
      {maturityHealth && maturityHealth.riskAlerts.length > 0 && (
        <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/40 dark:bg-amber-900/10">
          <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            风险预警（{maturityHealth.riskAlerts.length}项）
          </h4>
          <div className="space-y-3">
            {maturityHealth.riskAlerts.slice(0, 6).map((alert, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-neutral-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-neutral-900 dark:text-white flex-shrink-0">{alert.title}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    alert.severity === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                    alert.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                  }`}>{alert.severity === 'critical' ? '紧急' : alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}</span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{alert.detail}</div>
                {alert.action && <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1.5">建议：{alert.action}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 事件时间线 */}
      {events.length > 0 && (
        <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800">
          <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" /> 阶段跃迁事件
          </h4>
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-neutral-200 dark:bg-neutral-700" />
            {events.slice(0, 10).map((event, idx) => (
              <div key={idx} className="relative mb-3 last:mb-0">
                <div className="absolute left-[-14px] top-1 w-4 h-4 rounded-full bg-brand ring-4 ring-white dark:ring-neutral-900 shadow-sm" />
                <div className="text-xs font-bold text-neutral-900 dark:text-white">{MARKETING_MATURITY_STAGE_CONFIG[event.toStage]?.label || event.toStage}</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {event.reason} · {new Date(event.eventDate).toLocaleDateString()} {event.operator ? `· ${event.operator}` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部：说明性文字 */}
      <div className="px-6 py-4 bg-gradient-to-r from-neutral-50 dark:from-neutral-800/50 to-transparent">
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">市场活动生命周期与传统营销的关键差异：</span>
          传统营销关注"创意"与"执行"，伙伴生态下关注<strong>战略对齐</strong>（能否一起玩）与<strong>价值闭环</strong>（线索能不能变成钱）。
          通过 <span className="font-semibold">战略策划</span> → <span className="font-semibold">内容共创</span> → <span className="font-semibold">协同执行</span> → <span className="font-semibold">价值沉淀</span>，
          将市场活动从一次性开销转化为厂商向伙伴投喂商机、借力获客的战略杠杆。
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 激励政策4阶段关系深度生命周期追踪组件 (Incentive Maturity Tracker)
// 设计期 → 引导期 → 兑现期 → 演进期
// ─────────────────────────────────────────────────────────────────────────────

/** 激励政策4阶段关系深度健康度追踪卡片 */
export function IncentiveMaturityTracker({
  planTitle,
  maturityHealth,
  events,
  onStageClick,
}: {
  planTitle: string;
  maturityHealth: IncentiveMaturityHealth | null;
  events: IncentiveMaturityEvent[];
  onStageClick?: (stage: IncentiveMaturityStage) => void;
}) {
  // 4阶段配置
  const STAGES: {
    key: IncentiveMaturityStage;
    label: string;
    short: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    stageColor: string;
    description: string;
  }[] = [
    {
      key: 'DesignAlignment',
      label: '设计期',
      short: '利益对齐',
      icon: <FileText className="w-4 h-4" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      stageColor: 'from-blue-400 to-blue-600',
      description: '规则确立：解决"如何吸引伙伴入局"的问题。从标准化向差异化演进。',
    },
    {
      key: 'GuidanceMotivation',
      label: '引导期',
      short: '行为驱动',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      stageColor: 'from-emerald-400 to-emerald-600',
      description: '过程干预：从公司级激励下沉到员工级激励，用关键行为指标（KBI）引导。',
    },
    {
      key: 'RealizationAudit',
      label: '兑现期',
      short: '价值确认',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      stageColor: 'from-amber-400 to-amber-600',
      description: '承诺履行：准时准确的返利结算，建立长期信任的关键阶段。',
    },
    {
      key: 'EvolutionOptimization',
      label: '演进期',
      short: '战略共生',
      icon: <Globe className="w-4 h-4" />,
      color: 'text-purple-700',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      stageColor: 'from-purple-400 to-purple-600',
      description: '利益共同体：续约分成、LTV奖励、联合投资，共同应对市场变化。',
    },
  ];

  const currentStage = maturityHealth?.currentStage || 'DesignAlignment';
  const currentStageIdx = STAGES.findIndex((s) => s.key === currentStage);
  const stageInfo = INCENTIVE_MATURITY_STAGE_CONFIG[currentStage];
  const overallScore = maturityHealth?.overallScore || 0;
  const status = maturityHealth?.status || 'monitoring';

  // 综合健康度样式
  const healthStyle =
    status === 'healthy'
      ? { text: '健康', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-100', progress: 'from-emerald-400 to-emerald-600' }
      : status === 'at_risk'
        ? { text: '预警', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', ring: 'ring-orange-100', progress: 'from-orange-400 to-orange-600' }
        : status === 'critical'
          ? { text: '风险', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', ring: 'ring-rose-100', progress: 'from-rose-400 to-rose-600' }
          : { text: '关注', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-100', progress: 'from-amber-400 to-amber-600' };

  // 4支柱
  const pillarList = [
    { key: 'identity' as const, label: '身份', desc: '战略对齐 + 差异化设计（行业/区域/级别）', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'value' as const, label: '价值', desc: '激励结构合理性 + 非金钱激励占比', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'management' as const, label: '管理', desc: '规则透明度 + KBI + 结算效率', icon: <Target className="w-3.5 h-3.5" /> },
    { key: 'stickiness' as const, label: '粘性', desc: '续约率 + LTV奖励 + 联合投资计划', icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
      {/* 头部：标题 + 综合健康度 */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-purple-950/30 px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">激励政策生命周期</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                {planTitle} · <span className="font-semibold text-neutral-800 dark:text-neutral-200">{STAGES[currentStageIdx].label}</span>
              </p>
            </div>
          </div>

          {/* 健康度徽章 */}
          <div className="flex items-center gap-4">
            <div className={`px-4 py-3 rounded-xl ${healthStyle.bg} ${healthStyle.border} border-2`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${healthStyle.color}`}>综合健康度</div>
              <div className={`text-3xl font-black ${healthStyle.color} leading-none`}>{overallScore}</div>
              <div className={`text-[11px] font-bold mt-1 ${healthStyle.color}`}>{healthStyle.text}</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">当前阶段</div>
              <div className={`text-lg font-extrabold ${STAGES[currentStageIdx].color}`}>{STAGES[currentStageIdx].label}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">停留 {maturityHealth?.daysInCurrentStage || 0} 天 / 平均 {stageInfo.avgDaysInStage} 天</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4阶段进度条 */}
      <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div
            className={`absolute top-6 left-0 h-1 bg-gradient-to-r ${STAGES[0].stageColor} rounded-full transition-all duration-700`}
            style={{ width: `${currentStageIdx === STAGES.length - 1 ? 100 : (currentStageIdx * 100) / (STAGES.length - 1)}%` }}
          />
          <div className="grid grid-cols-4 gap-2 relative">
            {STAGES.map((stage, idx) => {
              const isActive = idx === currentStageIdx;
              const isPast = idx < currentStageIdx;
              const isFuture = idx > currentStageIdx;
              return (
                <div key={stage.key} className="flex flex-col items-center">
                  <button
                    onClick={() => onStageClick?.(stage.key)}
                    className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive
                        ? 'border-white dark:border-neutral-800 bg-gradient-to-br ' + stage.stageColor + ' text-white scale-110 shadow-xl ring-4 ' + stage.bgColor.replace('bg-', 'ring-').replace('dark:bg-', ' dark:ring-')
                        : isPast
                          ? 'border-emerald-400 bg-emerald-500 text-white shadow-md'
                          : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-400'
                    } hover:scale-105`}
                  >
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : stage.icon}
                  </button>
                  <div className={`mt-2.5 text-sm font-extrabold ${isActive ? stage.color : isPast ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {stage.label}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">{stage.short}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 当前阶段深度描述 */}
        {maturityHealth && (
          <div className={`mt-6 p-4 rounded-xl border ${STAGES[currentStageIdx].bgColor} ${STAGES[currentStageIdx].color.replace('text-', 'border-')} dark:border-opacity-60`}>
            <div className={`text-xs font-extrabold mb-2 ${STAGES[currentStageIdx].color}`}>
              【{stageInfo.label}】{stageInfo.identityPosition}
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{stageInfo.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-xs text-neutral-700 dark:text-neutral-300">
              <div>
                <span className="font-bold text-neutral-500 dark:text-neutral-400">利益驱动：</span>
                {stageInfo.benefitDriver}
              </div>
              <div>
                <span className="font-bold text-neutral-500 dark:text-neutral-400">管理重心：</span>
                {stageInfo.managementFocus}
              </div>
              <div>
                <span className="font-bold text-neutral-500 dark:text-neutral-400">基石：</span>
                {stageInfo.stabilityFoundation}
              </div>
              <div>
                <span className="font-bold text-neutral-500 dark:text-neutral-400">典型工具：</span>
                {stageInfo.keyIncentiveTools.join('、')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4支柱健康评估 */}
      {maturityHealth && (
        <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-800/20">
          <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            4支柱健康评估 · 身份(25%) + 价值(30%) + 管理(25%) + 粘性(20%)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pillarList.map((pillar) => {
              const data = maturityHealth.pillarScores[pillar.key];
              const score = data?.score || 0;
              const trend = data?.trend || 'flat';
              const color =
                score >= 80
                  ? 'text-emerald-700 bg-emerald-500'
                  : score >= 60
                    ? 'text-sky-700 bg-sky-500'
                    : score >= 40
                      ? 'text-amber-700 bg-amber-500'
                      : 'text-rose-700 bg-rose-500';
              return (
                <div key={pillar.key} className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`flex items-center gap-1.5 text-sm font-extrabold ${color.split(' ')[0]}`}>
                      {pillar.icon}
                      {pillar.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`text-2xl font-black ${color.split(' ')[0]}`}>{score}</span>
                      {trend === 'up' && <ChevronUp className="w-4 h-4 text-emerald-500" />}
                      {trend === 'down' && <ChevronDown className="w-4 h-4 text-rose-500" />}
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-2">
                    <div className={`h-full ${color.split(' ')[1]} transition-all duration-700`} style={{ width: `${score}%` }} />
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug mb-2">{pillar.desc}</p>
                  {data && data.evidence.length > 0 && (
                    <ul className="text-[10px] text-neutral-600 dark:text-neutral-400 space-y-1">
                      {data.evidence.slice(0, 2).map((ev, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-neutral-400 mt-0.5">·</span>
                          <span className="flex-1">{ev}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 晋级评估与差距分析 */}
      {maturityHealth && maturityHealth.promotionReadiness.gapAnalysis.length > 0 && (
        <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                晋级准备度：迈向 {maturityHealth.promotionReadiness.nextStageLabel}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                根据当前4支柱评分，识别推进到下一阶段需补足的关键能力差距
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">准备度</div>
              <div
                className={`text-3xl font-black ${
                  maturityHealth.promotionReadiness.readinessPercentage >= 80
                    ? 'text-emerald-600'
                    : maturityHealth.promotionReadiness.readinessPercentage >= 60
                      ? 'text-sky-600'
                      : maturityHealth.promotionReadiness.readinessPercentage >= 40
                        ? 'text-amber-600'
                        : 'text-rose-600'
                }`}
              >
                {maturityHealth.promotionReadiness.readinessPercentage}%
              </div>
            </div>
          </div>

          {/* 准备度进度条 */}
          <div className="h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full bg-gradient-to-r ${
                maturityHealth.promotionReadiness.canPromote ? 'from-emerald-400 to-emerald-600' : 'from-indigo-400 to-purple-600'
              } transition-all duration-700`}
              style={{ width: `${maturityHealth.promotionReadiness.readinessPercentage}%` }}
            />
          </div>

          <div className="space-y-3">
            {maturityHealth.promotionReadiness.gapAnalysis.map((gap, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                  gap.priority === 'high'
                    ? 'border-rose-200 bg-rose-50/60 dark:bg-rose-900/20 dark:border-rose-800'
                    : gap.priority === 'medium'
                      ? 'border-amber-200 bg-amber-50/60 dark:bg-amber-900/20 dark:border-amber-800'
                      : 'border-sky-200 bg-sky-50/60 dark:bg-sky-900/20 dark:border-sky-800'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-xs ${
                    gap.priority === 'high' ? 'bg-rose-500' : gap.priority === 'medium' ? 'bg-amber-500' : 'bg-sky-500'
                  }`}
                >
                  {Math.round(gap.currentValue)}→{Math.round(gap.requiredValue)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-sm text-neutral-900 dark:text-white mb-0.5">{gap.pillarLabel}支柱需提升</div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{gap.recommendation}</div>
                </div>
              </div>
            ))}
          </div>

          {maturityHealth.promotionReadiness.canPromote && (
            <div className="mt-3 p-3 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                ✨ 已满足晋级条件！建议推动政策进入下一阶段
              </span>
            </div>
          )}
        </div>
      )}

      {/* 风险预警 */}
      {maturityHealth && maturityHealth.riskAlerts.length > 0 && (
        <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/40 dark:bg-amber-900/10">
          <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            风险预警（{maturityHealth.riskAlerts.length}项）
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {maturityHealth.riskAlerts.slice(0, 6).map((alert, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border bg-white dark:bg-neutral-900 ${
                  alert.severity === 'critical'
                    ? 'border-rose-300 dark:border-rose-800'
                    : alert.severity === 'high'
                      ? 'border-orange-300 dark:border-orange-800'
                      : alert.severity === 'medium'
                        ? 'border-amber-200 dark:border-amber-800'
                        : 'border-sky-200 dark:border-sky-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-extrabold text-sm text-neutral-900 dark:text-white flex-shrink-0">{alert.title}</div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      alert.severity === 'critical'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                        : alert.severity === 'high'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                          : alert.severity === 'medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
                    }`}
                  >
                    {alert.severity === 'critical' ? '紧急' : alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{alert.detail}</div>
                {alert.action && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                    → {alert.action}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 激励结构分析（四象限） */}
      {maturityHealth && maturityHealth.incentiveMix && (
        <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-violet-50/50 to-blue-50/50 dark:from-violet-900/20 dark:to-blue-900/20">
          <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-600" />
            激励结构分析 · 从"单纯发钱"到"多元激励"
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                key: 'cashReward',
                label: '金钱激励',
                value: maturityHealth.incentiveMix.cashReward,
                icon: <Zap className="w-4 h-4" />,
                desc: '现金、返点、折扣',
                color: 'from-amber-400 to-amber-600',
                textColor: 'text-amber-700',
              },
              {
                key: 'resourceReward',
                label: '资源激励',
                value: maturityHealth.incentiveMix.resourceReward,
                icon: <Building2 className="w-4 h-4" />,
                desc: 'MDF、市场基金、技术支持',
                color: 'from-sky-400 to-sky-600',
                textColor: 'text-sky-700',
              },
              {
                key: 'capabilityReward',
                label: '能力激励',
                value: maturityHealth.incentiveMix.capabilityReward,
                icon: <Target className="w-4 h-4" />,
                desc: '培训、认证、职级',
                color: 'from-emerald-400 to-emerald-600',
                textColor: 'text-emerald-700',
              },
              {
                key: 'ltvReward',
                label: '长期价值',
                value: maturityHealth.incentiveMix.ltvReward,
                icon: <Globe className="w-4 h-4" />,
                desc: '续约分成、LTV、联合投资',
                color: 'from-violet-400 to-violet-600',
                textColor: 'text-violet-700',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`flex items-center gap-1.5 text-sm font-extrabold ${item.textColor}`}>
                    {item.icon}
                    {item.label}
                  </span>
                  <span className={`text-xl font-black ${item.textColor}`}>{item.value}%</span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${item.color} transition-all duration-700`} style={{ width: `${item.value}%` }} />
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-2 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 事件时间线 */}
      {events && events.length > 0 && (
        <div className="px-6 py-6 border-b border-neutral-200 dark:border-neutral-800">
          <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" />
            阶段演进事件（共 {events.length} 项）
          </h4>
          <div className="relative pl-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-300 dark:from-indigo-700 via-neutral-200 dark:via-neutral-700 to-transparent" />
            {events.slice(0, 8).map((event, idx) => {
              const toStageInfo = INCENTIVE_MATURITY_STAGE_CONFIG[event.toStage];
              const colorIdx = STAGES.findIndex((s) => s.key === event.toStage);
              const color = colorIdx === 0 ? 'bg-blue-500' : colorIdx === 1 ? 'bg-emerald-500' : colorIdx === 2 ? 'bg-amber-500' : 'bg-purple-500';
              return (
                <div key={event.id || idx} className="relative mb-3 last:mb-0">
                  <div className={`absolute left-[-14px] top-1 w-4 h-4 rounded-full ${color} ring-4 ring-white dark:ring-neutral-900 shadow-sm`} />
                  <div className="text-xs font-extrabold text-neutral-900 dark:text-white">
                    {event.fromStage ? `${INCENTIVE_MATURITY_STAGE_CONFIG[event.fromStage].label} → ` : ''}
                    {toStageInfo.label}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {event.reason || '阶段迁移'} · {new Date(event.eventDate).toLocaleDateString('zh-CN')}
                    {event.operator ? ` · ${event.operator}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部：激励政策理念说明 */}
      <div className="px-6 py-4 bg-gradient-to-r from-neutral-50 dark:from-neutral-800/50 to-transparent">
        <div className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <span className="font-bold text-neutral-800 dark:text-neutral-200">激励政策生命周期理念：</span>
          从单纯的「<span className="font-bold">给钱求办事</span>」（交易型），走向「<span className="font-bold">给资源、给能力、给身份</span>」（关系型）。
          通过 <span className="font-semibold">设计期</span> → <span className="font-semibold">引导期</span> → <span className="font-semibold">兑现期</span> → <span className="font-semibold">演进期</span>
          四个阶段，把激励政策从一次性开销转化为驱动伙伴生态进化的战略杠杆。
        </div>
      </div>
    </div>
  );
}

export default LifecycleTracker;
