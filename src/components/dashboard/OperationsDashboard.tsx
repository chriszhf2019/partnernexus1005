/**
 * Operations Dashboard
 * 运营视角：详细指标 + 维度分析 + 下钻能力
 * 
 * 设计原则：
 * - 详细指标卡片（可展开）
 * - 多维度分析（区域/伙伴类型/等级/行业）
 * - TOP 伙伴 + 问题伙伴列表（可点击下钻）
 * - 诊断横幅（问题说明 + 建议动作）
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Building2,
  Layers,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Package,
  Target,
  Users,
  ArrowRight,
} from 'lucide-react';
import type { OperationsDashboardData, OperationsMetricCard } from './types';
import { cn, formatCurrency } from '../../lib/utils';
import { ProgressBar } from '../ui/ProgressBar';
import { getHealthLevelLabel, getHealthLevelColor } from '../../lib/metricEngine/partnerHealthScore';

// ===== 指标卡片组件 =====

const MetricCard: React.FC<{
  metric: OperationsMetricCard;
  expanded?: boolean;
  onExpand?: () => void;
}> = ({ metric, expanded = false, onExpand }) => {
  const statusColors = {
    excellent: { bg: 'bg-emerald-500', text: 'text-emerald-700' },
    good: { bg: 'bg-blue-500', text: 'text-blue-700' },
    warning: { bg: 'bg-amber-500', text: 'text-amber-700' },
    danger: { bg: 'bg-red-500', text: 'text-red-700' },
  };

  const achievementStatus = metric.achievementRate >= 100 ? 'excellent' :
    metric.achievementRate >= 80 ? 'good' :
    metric.achievementRate >= 50 ? 'warning' : 'danger';

  const colors = statusColors[achievementStatus];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 shadow-sm">
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors.bg}`} />
          <span className="text-sm font-semibold text-neutral-800">{metric.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {metric.yoy !== undefined && (
            <span className={`text-xs ${metric.yoy >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              YoY {metric.yoy >= 0 ? '+' : ''}{metric.yoy}%
            </span>
          )}
          {onExpand && (
            <button onClick={onExpand} className="text-neutral-400 hover:text-neutral-600">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 数值行 */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-neutral-800">
          {formatCurrency(metric.currentValue, 'CNY')}
        </span>
        <span className="text-sm text-neutral-500">
          / {formatCurrency(metric.targetValue, 'CNY')}
        </span>
      </div>

      {/* 进度条 */}
      <ProgressBar
        value={Math.min(metric.achievementRate, 100)}
        max={100}
        variant={achievementStatus === 'excellent' || achievementStatus === 'good' ? 'success' : achievementStatus === 'warning' ? 'warning' : 'danger'}
        size="md"
        showPercentage
        label={`${Math.min(metric.achievementRate, 999)}%`}
      />

      {/* 展开内容 */}
      {expanded && metric.breakdown && metric.breakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <div className="text-xs text-neutral-500 mb-2">分解明细</div>
          <div className="space-y-2">
            {metric.breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{formatCurrency(item.value, 'CNY')}</span>
                  <span className={`text-xs ${item.rate >= 100 ? 'text-emerald-600' : 'text-neutral-500'}`}>
                    {Math.min(item.rate, 999)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ===== 维度分析卡片 =====

const DimensionAnalysisCard: React.FC<{
  dimension: 'region' | 'partner_type' | 'partner_tier' | 'industry' | 'product';
  data: Array<{ name: string; current: number; target: number; rate: number; yoy?: number }>;
  diagnosis?: { finding: string; detail: string; action: string };
  onDrilldown?: (dimension: string, name: string) => void;
}> = ({ dimension, data, diagnosis, onDrilldown }) => {
  const dimensionLabels = {
    region: '区域',
    partner_type: '伙伴类型',
    partner_tier: '伙伴等级',
    industry: '行业',
    product: '产品',
  };

  const dimensionIcons = {
    region: MapPin,
    partner_type: Building2,
    partner_tier: Layers,
    industry: BarChart3,
    product: Package,
  };

  const Icon = dimensionIcons[dimension];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-neutral-500" />
          <span className="text-sm font-semibold text-neutral-800">{dimensionLabels[dimension]}分析</span>
        </div>
      </div>

      {/* 数据列表 */}
      <div className="space-y-2">
        {data.slice(0, 5).map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
            onClick={() => onDrilldown?.(dimension, item.name)}
          >
            <span className="text-sm text-neutral-700">{item.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{formatCurrency(item.current, 'CNY')}</span>
              <ProgressBar
                value={Math.min(item.rate, 100)}
                max={100}
                variant={item.rate >= 100 ? 'success' : item.rate >= 80 ? 'default' : 'warning'}
                size="sm"
                showPercentage
                label={`${Math.min(item.rate, 999)}%`}
                className="w-16"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 诊断 */}
      {diagnosis && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">{diagnosis.finding}</span>
          </div>
          <p className="text-xs text-amber-600 mb-2">{diagnosis.detail}</p>
          <div className="flex items-center gap-1 text-xs text-amber-700">
            <span>建议：</span>
            <span className="font-medium">{diagnosis.action}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== TOP 伙伴列表 =====

const TopPartnerList: React.FC<{
  partners: Array<{
    id: string;
    name: string;
    tier: string;
    revenue: number;
    pipelineCount: number;
    healthScore: any;
  }>;
  onViewPartner?: (id: string) => void;
}> = ({ partners, onViewPartner }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-neutral-800">TOP 伙伴</span>
        </div>
        <span className="text-xs text-neutral-500">本季度贡献最高</span>
      </div>

      <div className="space-y-2">
        {partners.slice(0, 5).map((partner, idx) => (
          <div
            key={partner.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
            onClick={() => onViewPartner?.(partner.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-neutral-400 w-5">{idx + 1}</span>
              <div>
                <span className="text-sm font-medium text-neutral-800">{partner.name}</span>
                <span className="text-xs text-neutral-500 ml-2">{partner.tier}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{formatCurrency(partner.revenue, 'CNY')}</span>
              <span className="text-xs text-neutral-500">{partner.pipelineCount} 商机</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== 问题伙伴列表 =====

const AtRiskPartnerList: React.FC<{
  partners: Array<{
    id: string;
    name: string;
    status: string;
    daysInactive: number;
    healthScore: any;
    riskFactors: string[];
  }>;
  onViewPartner?: (id: string) => void;
}> = ({ partners, onViewPartner }) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-red-200 dark:border-red-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-semibold text-neutral-800">问题伙伴</span>
        </div>
        <span className="text-xs text-red-500">{partners.length} 家需关注</span>
      </div>

      <div className="space-y-2">
        {partners.slice(0, 5).map((partner) => (
          <div
            key={partner.id}
            className="flex items-center justify-between p-2 rounded-lg bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
            onClick={() => onViewPartner?.(partner.id)}
          >
            <div>
              <span className="text-sm font-medium text-neutral-800">{partner.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded bg-${getHealthLevelColor(partner.healthScore.level)}-100 text-${getHealthLevelColor(partner.healthScore.level)}-700`}>
                  {getHealthLevelLabel(partner.healthScore.level)}
                </span>
                {partner.daysInactive > 30 && (
                  <span className="text-xs text-red-500">{partner.daysInactive} 天无活动</span>
                )}
              </div>
            </div>
            <div className="text-xs text-neutral-500">
              {partner.riskFactors.slice(0, 2).join('、')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== 诊断横幅 =====

const DiagnosticsBanner: React.FC<{
  banner: OperationsDashboardData['diagnosticsBanner'];
  onAction?: (path: string) => void;
}> = ({ banner, onAction }) => {
  if (!banner.hasIssues) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">业务运行良好</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <span className="text-sm font-bold text-amber-700">业务诊断</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">有问题需关注</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {banner.issues.map((issue, idx) => {
          const statusColors = {
            success: { bg: 'bg-emerald-100', border: 'border-emerald-200', icon: 'text-emerald-600', title: 'text-emerald-800' },
            warning: { bg: 'bg-amber-100', border: 'border-amber-200', icon: 'text-amber-600', title: 'text-amber-800' },
            danger: { bg: 'bg-red-100', border: 'border-red-200', icon: 'text-red-600', title: 'text-red-800' },
          };
          const colors = statusColors[issue.status];

          return (
            <div key={idx} className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <Target className={`w-4 h-4 ${colors.icon}`} />
                <span className={`text-sm font-medium ${colors.title}`}>{issue.dimension}</span>
              </div>
              <p className="text-xs text-neutral-700 mb-2">{issue.description}</p>
              {issue.actions && issue.actions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {issue.actions.map((action, actionIdx) => (
                    <button
                      key={actionIdx}
                      onClick={() => onAction?.(action.path)}
                      className="text-xs px-2 py-1 rounded bg-white hover:bg-neutral-50 text-neutral-700 flex items-center gap-1"
                    >
                      {action.label}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== Operations Dashboard 主组件 =====

export const OperationsDashboard: React.FC<{
  data: OperationsDashboardData;
  onDrilldown?: (dimension: string, name: string) => void;
  onViewPartner?: (id: string) => void;
  onAction?: (path: string) => void;
  onBack?: () => void;
}> = ({ data, onDrilldown, onViewPartner, onAction, onBack }) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const { metrics, dimensionalAnalysis, topPartners, atRiskPartners, diagnosticsBanner } = data;

  return (
    <div className="space-y-6">
      {/* ===== 标题行 ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-neutral-400 hover:text-neutral-600">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h2 className="text-lg font-bold text-neutral-800">运营指标详情</h2>
        </div>
      </div>

      {/* ===== 诊断横幅 ===== */}
      <DiagnosticsBanner banner={diagnosticsBanner} onAction={onAction} />

      {/* ===== 指标卡片网格 ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            expanded={expandedMetric === metric.id}
            onExpand={() => setExpandedMetric(expandedMetric === metric.id ? null : metric.id)}
          />
        ))}
      </div>

      {/* ===== 维度分析 + 伙伴列表 ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 维度分析 */}
        {dimensionalAnalysis.slice(0, 2).map((dim) => (
          <DimensionAnalysisCard
            key={dim.dimension}
            dimension={dim.dimension}
            data={dim.data}
            diagnosis={dim.diagnosis}
            onDrilldown={onDrilldown}
          />
        ))}

        {/* TOP 伙伴 */}
        <TopPartnerList partners={topPartners} onViewPartner={onViewPartner} />
      </div>

      {/* ===== 问题伙伴 ===== */}
      {atRiskPartners.length > 0 && (
        <AtRiskPartnerList partners={atRiskPartners} onViewPartner={onViewPartner} />
      )}
    </div>
  );
};

// ===== 数据转换函数 =====

export function transformToOperationsDashboard(
  cockpitData: any,
  metrics: any
): OperationsDashboardData {
  const { revenue, activePartners, pipeline, leadsConversion, marketing } = cockpitData;

  // 指标卡片
  const metricCards: OperationsMetricCard[] = [
    {
      id: 'revenue',
      category: 'revenue',
      title: '季度营收',
      currentValue: revenue?.achievements?.quarterly?.current || metrics?.quarter?.value || 0,
      targetValue: revenue?.achievements?.quarterly?.target || metrics?.quarterlyTarget || 0,
      achievementRate: Math.min(revenue?.achievements?.quarterly?.rate || metrics?.quarterRate || 0, 999),
      yoy: revenue?.yoy || 0,
      qoq: revenue?.qoq || 0,
      monthlyTrend: revenue?.monthly_data || [],
      breakdown: revenue?.dimensional_achievements?.[0]?.data || [],
      drilldownPath: 'ecosystem-revenue',
    },
    {
      id: 'pipeline',
      category: 'pipeline',
      title: 'Pipeline 商机额',
      currentValue: pipeline?.current_value || metrics?.pipelineValue || 0,
      targetValue: pipeline?.achievements?.quarterly?.target || metrics?.quarterlyTarget * 2 || 0,
      achievementRate: Math.min(pipeline?.achievements?.quarterly?.rate || metrics?.pipelineCoverageRatio || 0, 999),
      yoy: pipeline?.yoy || 0,
      qoq: pipeline?.qoq || 0,
      monthlyTrend: pipeline?.monthly_data || [],
      drilldownPath: 'deals-pipeline',
    },
    {
      id: 'partners',
      category: 'partners',
      title: '活跃伙伴数',
      currentValue: activePartners?.current_value || metrics?.quarter?.partners || 0,
      targetValue: activePartners?.total_partners || metrics?.quarter?.partners || 0,
      achievementRate: Math.min(activePartners?.achievements?.quarterly?.rate || 0, 999),
      yoy: activePartners?.yoy || 0,
      qoq: activePartners?.qoq || 0,
      monthlyTrend: activePartners?.monthly_data || [],
      drilldownPath: 'partners-active',
    },
    {
      id: 'conversion',
      category: 'conversion',
      title: '线索转化率',
      currentValue: leadsConversion?.current_value || metrics?.dealConversionRate || 0,
      targetValue: leadsConversion?.achievements?.quarterly?.target || 30,
      achievementRate: Math.min(leadsConversion?.achievements?.quarterly?.rate || 0, 999),
      yoy: leadsConversion?.yoy || 0,
      qoq: leadsConversion?.qoq || 0,
      monthlyTrend: leadsConversion?.monthly_data || [],
      drilldownPath: 'ecosystem-conversion',
    },
  ];

  // 维度分析
  const dimensionalAnalysis = (revenue?.dimensional_achievements || []).map((dim: any) => ({
    dimension: dim.type as any,
    data: dim.data || [],
    diagnosis: dim.data?.length >= 2 ? {
      finding: `${dim.data[0]?.name}领跑，${dim.data[dim.data.length - 1]?.name}落后`,
      detail: `差距达 ${Math.round((dim.data[0]?.rate || 0) - (dim.data[dim.data.length - 1]?.rate || 0))}%`,
      action: '启动专项招募',
    } : undefined,
  }));

  // TOP 伙伴
  const topPartners = (metrics?.topPartners || []).map((p: any) => ({
    id: p.id || p.name,
    name: p.name,
    tier: p.tier || 'Standard',
    revenue: p.value || 0,
    pipelineCount: p.count || 0,
    healthScore: { level: 'good', overall: 70 },
  }));

  // 问题伙伴
  const atRiskPartners = (activePartners?.partner_health_summary?.criticalPartners || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    daysInactive: p.daysSinceLastActivity || 0,
    healthScore: p.healthScore || { level: 'critical', overall: 30 },
    riskFactors: p.riskFactors || ['零产出伙伴'],
  }));

  // 诊断横幅
  const diagnosticsBanner = {
    hasIssues: metrics?.diagnostics?.isBehindSchedule || metrics?.diagnostics?.isPipelineShort || metrics?.diagnostics?.hasTopHeavyPartners,
    issues: [
      metrics?.diagnostics?.isBehindSchedule ? {
        dimension: '业绩进展',
        status: 'danger',
        title: '落后时间进度',
        description: `完成率 ${metrics?.quarterRate}% 落后于时间进度 ${metrics?.quarterTimeProgress}%`,
        actions: [{ label: '推进管线流转', path: 'deals-pipeline' }],
      } : null,
      metrics?.diagnostics?.hasTopHeavyPartners ? {
        dimension: '伙伴集中度',
        status: 'warning',
        title: '伙伴过度集中',
        description: `TOP1伙伴贡献超过70%`,
        actions: [{ label: '查看伙伴分布', path: 'partners-active' }],
      } : null,
      metrics?.diagnostics?.isPipelineShort ? {
        dimension: '商机储备',
        status: 'danger',
        title: '管线严重不足',
        description: `管线储备仅覆盖缺口的 ${metrics?.pipelineCoverageRatio}%`,
        actions: [{ label: '拓展新商机', path: 'deals-pipeline' }],
      } : null,
    ].filter(Boolean) as any[],
  };

  return {
    metrics: metricCards,
    dimensionalAnalysis,
    pipelineDetails: pipeline?.pipeline_batch || {},
    topPartners,
    atRiskPartners,
    diagnosticsBanner,
  };
}