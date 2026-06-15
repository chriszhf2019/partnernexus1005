import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useMarketingData } from '../../hooks/useData';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { marketingService } from '../../services/marketing-service';
import { 
  Wallet, Users, TrendingUp, Target, AlertTriangle, CheckCircle, XCircle, 
  Clock, DollarSign, BarChart3, PieChart, Award, Zap, Shield, 
  ChevronRight, Plus, RefreshCw, X, Edit, Eye, FileText, Settings,
  ArrowUpRight, ArrowDownRight, Minus, Activity, Globe, Building2,
  Filter, Search, MoreHorizontal, Pause, Play, ExternalLink, Layers
} from 'lucide-react';
import { ProgramReportDrawer } from './enablement/ProgramReportDrawer';
import { cn } from '../../lib/utils';

// 数字简化函数
const simplifyNumber = (num: number): string => {
  if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
  if (num >= 10000000) return (num / 10000000).toFixed(1) + 'M';
  if (num >= 10000) return (num / 10000).toFixed(1) + '万';
  return num.toString();
};

// 状态颜色映射
type StatusColor = 'green' | 'yellow' | 'red';
const getStatusColor = (status: StatusColor): string => {
  const colors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500'
  };
  return colors[status];
};

// ============================================
// 第一部分：顶层战略展示层（三大核心看板）
// ============================================

// 激励执行看板
const IncentiveExecutionBoard: React.FC<{ programs: any[]; cur: Function }> = ({ programs, cur }) => {
  if (programs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">激励执行看板</h3>
              <p className="text-[10px] text-neutral-500">钱花得快不快</p>
            </div>
          </div>
        </div>
        <div className="text-center py-8 text-neutral-400 text-sm">暂无激励计划数据</div>
      </div>
    );
  }
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const quarterEnd = new Date(quarterStart.getTime() + 92 * 86400000);
  const calendarPct = Math.min(Math.round(((now.getTime() - quarterStart.getTime()) / (quarterEnd.getTime() - quarterStart.getTime())) * 100), 100);

  const totalBudget = programs.reduce((s: number, p: any) => s + (Number(p.total_budget || p.totalBudget || 0)), 0);
  const totalClaimed = programs.reduce((s: number, p: any) => s + (Number(p.claimed_amount || p.claimedAmount || 0)), 0);
  const frozenAmount = Math.round(totalClaimed * 0.2);
  const settledAmount = totalClaimed - frozenAmount;
  const remainingAmount = Math.max(0, totalBudget - totalClaimed);
  const budgetPct = totalBudget > 0 ? Math.round((totalClaimed / totalBudget) * 100) : 0;
  
  const isOverConsuming = budgetPct > calendarPct + 15;
  const isUnderConsuming = budgetPct < calendarPct - 15;

  // 平均处理周期（天）
  const avgCycleDays = 18;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">激励执行看板</h3>
            <p className="text-[10px] text-neutral-500">钱花得快不快</p>
          </div>
        </div>
        <Badge variant={isOverConsuming ? 'danger' : isUnderConsuming ? 'warning' : 'success'}>
          {isOverConsuming ? '超支预警' : isUnderConsuming ? '进度滞后' : '正常运行'}
        </Badge>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
          <p className="text-[10px] text-neutral-500">预算消耗率</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={cn('text-2xl font-bold', isOverConsuming ? 'text-red-600' : 'text-neutral-900 dark:text-white')}>
              {budgetPct}%
            </span>
            <span className="text-[10px] text-neutral-400">/ {calendarPct}%</span>
          </div>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
          <p className="text-[10px] text-neutral-500">打款完成率</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-emerald-600">
              {totalBudget > 0 ? Math.round((settledAmount / totalBudget) * 100) : 0}%
            </span>
            <span className="text-[10px] text-neutral-400">已结算</span>
          </div>
        </div>
      </div>

      {/* 消耗节奏双线图 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <p className="text-[10px] text-neutral-500 mb-2">消耗节奏 vs 时间进度</p>
        <div className="relative h-16">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          </div>
          <div className="absolute inset-0 flex items-center">
            <div 
              className="h-2 bg-amber-400 rounded-full transition-all"
              style={{ width: `${Math.min(budgetPct, 100)}%` }}
            ></div>
          </div>
          <div className="absolute inset-0 flex items-center">
            <div 
              className={cn('h-1 rounded-full', isOverConsuming ? 'bg-red-500' : 'bg-emerald-500')}
              style={{ width: `${Math.min(calendarPct, 100)}%` }}
            ></div>
          </div>
          <div className="absolute bottom-0 left-0 text-[8px] text-neutral-400">0%</div>
          <div className="absolute bottom-0 right-0 text-[8px] text-neutral-400">100%</div>
        </div>
        <div className="flex justify-between mt-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-1 bg-amber-400 rounded"></div>
            <span className="text-[8px] text-neutral-500">消耗线</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn('w-2 h-1 rounded', isOverConsuming ? 'bg-red-500' : 'bg-emerald-500')}></div>
            <span className="text-[8px] text-neutral-500">时间线</span>
          </div>
        </div>
        {isOverConsuming && (
          <p className="text-[9px] text-red-500 mt-1">⚠️ 消耗比时间进度快{budgetPct - calendarPct}%，可能需要追加预算</p>
        )}
      </div>

      {/* 资金流状态 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <p className="text-[10px] text-neutral-500 mb-2">资金流状态</p>
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden flex">
          <div className="h-full bg-blue-500" style={{ width: `${totalBudget > 0 ? Math.round((settledAmount / totalBudget) * 100) : 0}%` }}></div>
          <div className="h-full bg-blue-300" style={{ width: `${totalBudget > 0 ? Math.round((frozenAmount / totalBudget) * 100) : 0}%` }}></div>
          <div className="h-full bg-emerald-400" style={{ width: `${totalBudget > 0 ? Math.round((remainingAmount / totalBudget) * 100) : 0}%` }}></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2 text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded"></div>
            <span className="text-neutral-500">已结算 {cur(settledAmount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-300 rounded"></div>
            <span className="text-neutral-500">冻结中 {cur(frozenAmount)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-400 rounded"></div>
            <span className="text-neutral-500">剩余 {cur(remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* 时效监控 */}
      <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] text-neutral-500">伙伴从提交到收款平均周期</span>
        </div>
        <span className="text-sm font-semibold text-neutral-900 dark:text-white">{avgCycleDays}天</span>
      </div>
    </div>
  );
};

// 激励覆盖看板
const IncentiveCoverageBoard: React.FC<{ programs: any[]; cur: Function; onFilterChange: (filter: string) => void; activeFilter: string }> = ({ programs, cur, onFilterChange, activeFilter }) => {
  if (programs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">激励覆盖看板</h3>
              <p className="text-[10px] text-neutral-500">钱花得广不广</p>
            </div>
          </div>
        </div>
        <div className="text-center py-8 text-neutral-400 text-sm">暂无激励计划数据</div>
      </div>
    );
  }
  const totalPartners = 150; // 模拟总伙伴数
  const totalParticipants = programs.reduce((s: number, p: any) => s + (Number(p.participants_count || p.participantsCount || 0)), 0);
  const coverageRate = Math.round((totalParticipants / totalPartners) * 100);

  // 行业分布（模拟数据）
  const industryData = [
    { name: '医疗', value: 35, color: 'bg-emerald-500' },
    { name: '教育', value: 25, color: 'bg-blue-500' },
    { name: '政府', value: 18, color: 'bg-purple-500' },
    { name: '企业', value: 12, color: 'bg-amber-500' },
    { name: '制造', value: 10, color: 'bg-red-500' },
  ];

  // 地域分布（模拟数据）
  const regionData = [
    { name: '华东区', value: 30 },
    { name: '华南区', value: 25 },
    { name: '华北区', value: 22 },
    { name: '西南区', value: 12 },
    { name: '西北区', value: 8 },
    { name: '东北区', value: 3 },
  ];

  // 伙伴类型参与度（模拟数据）
  const partnerTypeData = [
    { name: 'ISV', value: 45, color: '#2563eb' },
    { name: '代理商', value: 35, color: '#059669' },
    { name: '服务商', value: 20, color: '#7c3aed' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">激励覆盖看板</h3>
            <p className="text-[10px] text-neutral-500">钱花得广不广</p>
          </div>
        </div>
        <Badge variant={coverageRate > 60 ? 'success' : coverageRate > 30 ? 'warning' : 'danger'}>
          {coverageRate}%覆盖率
        </Badge>
      </div>

      {/* 核心指标 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <p className="text-[10px] text-neutral-500">伙伴参与覆盖率</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-emerald-600">{totalParticipants}</span>
          <span className="text-[10px] text-neutral-400">/ {totalPartners} 伙伴</span>
        </div>
        <div className="mt-2">
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${coverageRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 地域与行业渗透热力矩阵 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <p className="text-[10px] text-neutral-500 mb-2">地域 × 行业渗透矩阵</p>
        <div className="grid grid-cols-6 gap-1">
          <div className="text-[8px] text-neutral-400"></div>
          {industryData.map(ind => (
            <div key={ind.name} className="text-[8px] text-neutral-400 text-center">{ind.name}</div>
          ))}
          {regionData.map(region => (
            <React.Fragment key={region.name}>
              <div className="text-[8px] text-neutral-400">{region.name}</div>
              {industryData.map(ind => {
                const intensity = ((industryData.indexOf(ind) + regionData.indexOf(region)) % 5 + 3) / 10;
                return (
                  <div 
                    key={`${region.name}-${ind.name}`}
                    className={cn(
                      'rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-brand',
                      activeFilter === `${region.name}-${ind.name}` && 'ring-2 ring-brand'
                    )}
                    style={{ 
                      backgroundColor: ind.color,
                      opacity: intensity > 0.3 ? intensity : 0.3
                    }}
                    onClick={() => onFilterChange(`${region.name}-${ind.name}`)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 伙伴类型参与度 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <p className="text-[10px] text-neutral-500 mb-2">伙伴类型参与度</p>
        <div className="flex items-center gap-3">
          <svg width="60" height="60" viewBox="0 0 40 40" className="shrink-0">
            <circle cx="20" cy="20" r="14" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
            <circle cx="20" cy="20" r="14" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray="39.6 88" strokeDashoffset="0" transform="rotate(-90 20 20)"/>
            <circle cx="20" cy="20" r="14" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray="30.8 88" strokeDashoffset="-39.6" transform="rotate(-90 20 20)"/>
            <circle cx="20" cy="20" r="14" fill="none" stroke="#7c3aed" strokeWidth="8" strokeDasharray="17.6 88" strokeDashoffset="-70.4" transform="rotate(-90 20 20)"/>
          </svg>
          <div className="flex-1 space-y-1.5">
            {partnerTypeData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-[10px] text-neutral-600 flex-1">{item.name}</span>
                <span className="text-[10px] font-medium text-neutral-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 等级公平性 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-neutral-500">等级公平性</p>
          <span className="text-[9px] text-amber-600">⚠ 头部倾斜</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-neutral-400 w-8">金牌</span>
            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <span className="text-[9px] text-neutral-500 w-8">45%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-neutral-400 w-8">银牌</span>
            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-400 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <span className="text-[9px] text-neutral-500 w-8">30%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-neutral-400 w-8">铜牌</span>
            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-300 dark:bg-neutral-600 rounded-full" style={{ width: '15%' }}></div>
            </div>
            <span className="text-[9px] text-neutral-500 w-8">15%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-neutral-400 w-8">普通</span>
            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-200 dark:bg-neutral-600 rounded-full" style={{ width: '10%' }}></div>
            </div>
            <span className="text-[9px] text-neutral-500 w-8">10%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 激励效果看板
const IncentiveOutcomeBoard: React.FC<{ programs: any[]; cur: Function }> = ({ programs, cur }) => {
  if (programs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">激励效果看板</h3>
              <p className="text-[10px] text-neutral-500">钱花得值不值</p>
            </div>
          </div>
        </div>
        <div className="text-center py-8 text-neutral-400 text-sm">暂无激励计划数据</div>
      </div>
    );
  }
  const totalPayout = programs.reduce((s: number, p: any) => s + (Number(p.claimed_amount || p.claimedAmount || 0)), 0);
  const totalBudget = programs.reduce((s: number, p: any) => s + (Number(p.total_budget || p.totalBudget || 0)), 0);
  
  // 计算综合ROI
  const avgROI = totalPayout > 0 ? (totalBudget / totalPayout).toFixed(1) : '0.0';
  
  // 带动总GMV（模拟：预算 * ROI系数）
  const estimatedGMV = totalPayout * Number(avgROI);

  // 新客户占比（模拟）
  const newLogoRate = 28;

  // 重点产品销售占比（模拟）
  const keyProductRate = 42;

  // 单产分析
  const perYuanOutput = avgROI;

  // 增长引擎对比
  const incentiveGroupGrowth = 35; // 激励组增长%
  const nonIncentiveGroupGrowth = 12; // 非激励组增长%

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">激励效果看板</h3>
            <p className="text-[10px] text-neutral-500">钱花得值不值</p>
          </div>
        </div>
        <Badge variant={Number(avgROI) >= 2 ? 'success' : Number(avgROI) >= 1 ? 'warning' : 'danger'}>
          ROI {avgROI}x
        </Badge>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
          <p className="text-[10px] text-neutral-500">综合ROI</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-purple-600">{avgROI}x</span>
          </div>
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
          <p className="text-[10px] text-neutral-500">激励带动GMV</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">{simplifyNumber(estimatedGMV)}</span>
          </div>
        </div>
      </div>

      {/* 战略价值贡献 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <p className="text-[10px] text-neutral-500 mb-2">战略价值贡献</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Award className="w-3 h-3 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500">新客户(New Logo)</p>
              <p className="text-sm font-semibold text-emerald-600">{newLogoRate}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Target className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500">重点产品销售</p>
              <p className="text-sm font-semibold text-blue-600">{keyProductRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 单产分析 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <p className="text-[10px] text-neutral-500 mb-2">单产分析</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] text-neutral-500">每投入1元激励金</span>
          </div>
          <span className="text-sm font-bold text-purple-600">带动 {perYuanOutput} 元商机</span>
        </div>
      </div>

      {/* 增长引擎 */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3">
        <p className="text-[10px] text-neutral-500 mb-2">增长引擎对比</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-[9px] text-neutral-400 mb-1">激励组</p>
            <div className="flex items-center justify-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
              <span className="text-lg font-bold text-emerald-600">{incentiveGroupGrowth}%</span>
            </div>
            <p className="text-[8px] text-neutral-400">业绩增长</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-neutral-400 mb-1">非激励组</p>
            <div className="flex items-center justify-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-neutral-400" />
              <span className="text-lg font-bold text-neutral-500">{nonIncentiveGroupGrowth}%</span>
            </div>
            <p className="text-[8px] text-neutral-400">业绩增长</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-[9px] text-emerald-600 text-center">
            激励组效果提升 {Math.round((incentiveGroupGrowth - nonIncentiveGroupGrowth) / nonIncentiveGroupGrowth * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 第二部分：诊断层（AI诊断结论）
// ============================================

interface Diagnosis {
  id: string;
  type: 'over-budget' | 'low-participation' | 'quality-warning';
  icon: React.ReactNode;
  title: string;
  logic: string;
  conclusion: string;
  severity: 'high' | 'medium' | 'low';
  program?: string;
  filterContext?: string;
}

const DiagnosisSection: React.FC<{ 
  programs: any[]; 
  cur: Function; 
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}> = ({ programs, cur, activeFilter, onFilterChange }) => {
  const [expandedDiagnosis, setExpandedDiagnosis] = useState<string | null>(null);

  // 生成诊断结论
  const diagnoses = useMemo<Diagnosis[]>(() => {
    const results: Diagnosis[] = [];

    // 诊断A：超支/低效风险
    programs.forEach(p => {
      const budget = Number(p.total_budget || p.totalBudget || 0);
      const claimed = Number(p.claimed_amount || p.claimedAmount || 0);
      const roi = budget > 0 && claimed > 0 ? (p.effective_revenue || p.revenue || budget * 2) / claimed : 0;

      if (budget > 0 && (claimed / budget) > 1) {
        results.push({
          id: `overbudget-${p.id}`,
          type: 'over-budget' as const,
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          title: '超支/低效风险',
          logic: `「${p.title}」激励预算消耗达 ${Math.round((claimed / budget) * 100)}%，但 ROI ${roi.toFixed(1)}x 远超平均水平。`,
          conclusion: '建议追加预算 100w，以捕捉当前高增长红利。',
          severity: 'high' as const,
          program: p.title,
        });
      }
    });

    // 诊断B：参与度洼地
    const regionIndustry = activeFilter.split('-');
    if (regionIndustry.length === 2) {
      const zeroParticipation = {
        id: 'low-participation',
        type: 'low-participation' as const,
        icon: <Users className="w-4 h-4 text-amber-500" />,
        title: '参与度洼地',
        logic: `${regionIndustry[0]} ${regionIndustry[1]}行业专项激励参与人数为 0。`,
        conclusion: '诊断为该区域准入门槛过高，建议下调门槛或指派区域经理跟进赋能。',
        severity: 'medium' as const,
        filterContext: activeFilter,
      };
      results.push(zeroParticipation);
    }

    // 诊断C：获客质量预警
    programs.forEach(p => {
      const claimed = Number(p.claimed_amount || p.claimedAmount || 0);
      if (claimed > 50000) {
        results.push({
          id: `quality-${p.id}`,
          type: 'quality-warning' as const,
          icon: <Shield className="w-4 h-4 text-blue-500" />,
          title: '获客质量预警',
          logic: `某专项激励带动了大量订单，但新客户占比低于 5%。`,
          conclusion: '警惕"老客户续约"占用了过多激励，建议调整政策偏向"拓新"。',
          severity: 'medium' as const,
          program: p.title,
        });
      }
    });

    // 如果没有具体诊断，生成通用健康诊断
    if (results.length === 0) {
      results.push({
        id: 'healthy',
        type: 'over-budget' as const,
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        title: '运行健康',
        logic: '所有激励计划运行正常，预算消耗和参与率均在健康范围。',
        conclusion: '继续保持当前策略执行节奏。',
        severity: 'low' as const,
      });
    }

    return results;
  }, [programs, activeFilter]);

  const getSeverityColor = (severity: Diagnosis['severity']) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10';
      case 'medium': return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10';
      case 'low': return 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <Activity className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">AI智能诊断</h3>
          <p className="text-[10px] text-neutral-500">决策建议区</p>
        </div>
      </div>

      <div className="space-y-2">
        {diagnoses.map(d => (
          <div 
            key={d.id}
            className={cn(
              'border-l-4 rounded-lg p-3 transition-all cursor-pointer',
              getSeverityColor(d.severity)
            )}
            onClick={() => setExpandedDiagnosis(expandedDiagnosis === d.id ? null : d.id)}
          >
            <div className="flex items-start gap-2">
              <div className="shrink-0 mt-0.5">{d.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-neutral-900 dark:text-white">{d.title}</span>
                  {d.program && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-500">
                      {d.program}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 line-clamp-2">{d.logic}</p>
                
                {expandedDiagnosis === d.id && (
                  <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      💡 {d.conclusion}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {d.type === 'over-budget' && (
                        <>
                          <Button variant="brand" size="sm" className="text-[9px] h-6">
                            <Plus className="w-3 h-3 mr-1" />追加预算
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[9px] h-6">
                            <Clock className="w-3 h-3 mr-1" />延长执行期
                          </Button>
                        </>
                      )}
                      {d.type === 'low-participation' && (
                        <>
                          <Button variant="brand" size="sm" className="text-[9px] h-6">
                            <Settings className="w-3 h-3 mr-1" />调整门槛
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[9px] h-6">
                            <Users className="w-3 h-3 mr-1" />指派跟进
                          </Button>
                        </>
                      )}
                      {d.type === 'quality-warning' && (
                        <>
                          <Button variant="brand" size="sm" className="text-[9px] h-6">
                            <Target className="w-3 h-3 mr-1" />偏向拓新
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[9px] h-6">
                            <Eye className="w-3 h-3 mr-1" />审计详情
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <ChevronRight className={cn(
                'w-4 h-4 text-neutral-400 shrink-0 transition-transform',
                expandedDiagnosis === d.id && 'rotate-90'
              )} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// 第三部分：执行层（政策卡片与决策执行）
// ============================================

interface ProgramCardProps {
  program: any;
  cur: Function;
  roi: string;
  onEdit: (p: any) => void;
  onReport: (p: any) => void;
  onPause: (p: any) => void;
  isSelected: boolean;
  onClick: () => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, cur, roi, onEdit, onReport, onPause, isSelected, onClick }) => {
  const budget = Number(program.total_budget || program.totalBudget || 0);
  const claimed = Number(program.claimed_amount || program.claimedAmount || 0);
  const participants = Number(program.participants_count || program.participantsCount || 0);
  const pct = budget > 0 ? Math.round((claimed / budget) * 100) : 0;
  
  const frozenAmount = Math.round(claimed * 0.2);
  const remainingAmount = Math.max(0, budget - claimed - frozenAmount);
  
  const daysRemaining = (() => {
    const endDate = program.end_date || program.endDate;
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / 86400000);
  })();

  const isOverBudget = pct > 90;
  const isNearEnd = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isEnded = program.status === 'Ended' || (daysRemaining !== null && daysRemaining <= 0);

  // 确定卡片状态
  const getCardStatus = (): StatusColor => {
    if (isEnded) return 'green';
    if (isOverBudget) return 'red';
    if (isNearEnd || pct > 70) return 'yellow';
    return 'green';
  };

  const status = getCardStatus();

  return (
    <div 
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl border transition-all cursor-pointer',
        isSelected ? 'border-brand ring-2 ring-brand/20' : 'border-neutral-200 dark:border-neutral-800',
        'hover:shadow-md'
      )}
      onClick={onClick}
    >
      {/* 状态颜色条 */}
      <div className={cn('h-1 rounded-t-xl', getStatusColor(status))}></div>
      
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={cn(
              'w-2 h-2 rounded-full shrink-0',
              status === 'green' ? 'bg-emerald-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-red-500'
            )}></span>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">{program.title}</h4>
              <p className="text-[9px] text-neutral-500">{program.trigger_type || program.trigger} · {program.payout_type || program.payoutType}</p>
            </div>
          </div>
          <Badge 
            variant={isEnded ? 'default' : isOverBudget ? 'danger' : isNearEnd ? 'warning' : 'success'}
            size="sm"
          >
            {isEnded ? '已结束' : isOverBudget ? '⚠超支' : isNearEnd ? '⚠临期' : '进行中'}
          </Badge>
        </div>

        {/* 核心数据摘要 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2 text-center">
            <p className="text-[8px] text-neutral-400">当前ROI</p>
            <p className="text-[12px] font-bold text-purple-600">{roi}x</p>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2 text-center">
            <p className="text-[8px] text-neutral-400">参与伙伴</p>
            <p className="text-[12px] font-bold text-emerald-600">{participants}</p>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-2 text-center">
            <p className="text-[8px] text-neutral-400">剩余预算</p>
            <p className="text-[12px] font-bold text-blue-600">{simplifyNumber(remainingAmount)}</p>
          </div>
        </div>

        {/* 预算使用进度 */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-neutral-500">预算使用</span>
            <span className={cn('font-semibold', isOverBudget ? 'text-red-500' : 'text-neutral-700')}>{pct}%</span>
          </div>
          <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }}></div>
            <div className="h-full bg-blue-300 transition-all" style={{ width: `${Math.round((frozenAmount / Math.max(budget, 1)) * 100)}%` }}></div>
          </div>
        </div>

        {/* 快捷决策按钮 */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {!isEnded ? (
            <>
              {isOverBudget ? (
                <>
                  <Button variant="danger" size="sm" className="text-[9px] h-6 flex-1" onClick={(e) => { e.stopPropagation(); }}>
                    <Plus className="w-3 h-3 mr-0.5" />追加预算
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[9px] h-6" onClick={(e) => { e.stopPropagation(); onPause(program); }}>
                    <Pause className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" size="sm" className="text-[9px] h-6 flex-1" onClick={(e) => { e.stopPropagation(); onEdit(program); }}>
                    <Edit className="w-3 h-3 mr-0.5" />编辑
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[9px] h-6" onClick={(e) => { e.stopPropagation(); onReport(program); }}>
                    <Eye className="w-3 h-3" />
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button variant="brand" size="sm" className="text-[9px] h-6 flex-1" onClick={(e) => { e.stopPropagation(); }}>
              <FileText className="w-3 h-3 mr-0.5" />生成评估报告
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-[9px] h-6">
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 主页面组件
// ============================================

const IncentivesOverview: React.FC = () => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const navigate = useNavigate();
  const { incentivePrograms, incentiveStats } = useMarketingData();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', trigger_type: 'Pipeline Gap', payout_type: 'Cash', total_budget: '', description: '', start_date: '', end_date: '' });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [reportProgram, setReportProgram] = useState<any>(null);
  const [editProgram, setEditProgram] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: '', trigger_type: '', payout_type: '', total_budget: '', description: '', start_date: '', end_date: '', status: '' });
  const [editing, setEditing] = useState(false);
  const [topPartners, setTopPartners] = useState<{name:string;tier:string;total:number;count:number}[]>([]);
  const [localPrograms, setLocalPrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('');

  // Sync incentivePrograms to local state for mutable updates
  useEffect(() => { setLocalPrograms(incentivePrograms); }, [incentivePrograms]);

  // Load real top partners
  useEffect(() => {
    marketingService.getIncentiveTopPartners(undefined, 5).then(setTopPartners).catch(() => {});
  }, []);

  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const handleCreate = async () => {
    if (!form.title || !form.total_budget) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('incentive_programs').insert({
        title: form.title, trigger_type: form.trigger_type, payout_type: form.payout_type,
        total_budget: Number(form.total_budget), description: form.description,
        start_date: form.start_date, end_date: form.end_date, status: 'Active',
        claimed_amount: 0, participants_count: 0,
      });
      if (error) throw new Error(error.message);
      setShowCreate(false);
      setForm({ title: '', trigger_type: 'Pipeline Gap', payout_type: 'Cash', total_budget: '', description: '', start_date: '', end_date: '' });
    } catch (err) {
      console.error('Failed to create incentive program:', err);
    } finally {
      setCreating(false);
    }
  };

  // ROI estimate
  const estimateROI = (p: any) => {
    const claimed = Number(p.claimed_amount || p.claimedAmount || 0);
    if (claimed <= 0) return '0.0';
    const actualRevenue = Number(p.effective_revenue || p.revenue || 0);
    if (actualRevenue > 0) {
      return (actualRevenue / claimed).toFixed(1);
    }
    const trigger = p.trigger_type || p.trigger || '';
    const multiplier = trigger === 'New Product' ? 3.5 : trigger === 'Pipeline Gap' ? 2.8 : trigger === 'Competitive' ? 2.5 : 2.0;
    return multiplier.toFixed(1);
  };

  // Filtered programs
  const filteredPrograms = useMemo(() => {
    let result = [...localPrograms];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p: any) => p.title?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s) || (p.trigger_type || p.trigger || '')?.toLowerCase().includes(s));
    }
    if (statusFilter !== 'all') result = result.filter((p: any) => p.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter((p: any) => (p.trigger_type || p.trigger) === typeFilter);
    return result;
  }, [localPrograms, search, statusFilter, typeFilter]);

  const triggerTypes = useMemo(() => [...new Set(localPrograms.map((p: any) => p.trigger_type || p.trigger).filter(Boolean))], [localPrograms]);

  const handlePause = async (p: any) => {
    if (confirm(`确定暂停「${p.title}」吗？`)) {
      const { error } = await supabase.from('incentive_programs').update({ status: 'Ended', description: (p.description||'') + ' [已暂停]' }).eq('id', p.id);
      if (!error) {
        setLocalPrograms((prev: any[]) => prev.map(prog => prog.id === p.id ? { ...prog, status: 'Ended', description: (prog.description||'') + ' [已暂停]' } : prog));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('incentives.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">钱花得怎么样，发给了谁，值不值</p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />新建激励计划
        </Button>
      </div>

      {/* ============================================ */}
      {/* 第一部分：顶层战略展示层（三大核心看板） */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20">
          <IncentiveExecutionBoard programs={localPrograms} cur={cur} />
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/20">
          <IncentiveCoverageBoard 
            programs={localPrograms} 
            cur={cur} 
            onFilterChange={setActiveFilter}
            activeFilter={activeFilter}
          />
        </Card>
        <Card className="bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20">
          <IncentiveOutcomeBoard programs={localPrograms} cur={cur} />
        </Card>
      </div>

      {/* ============================================ */}
      {/* 第二部分：诊断层（AI诊断结论） */}
      {/* ============================================ */}
      <Card className="bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-blue-50/30 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-blue-950/20">
        <DiagnosisSection 
          programs={localPrograms} 
          cur={cur} 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </Card>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-1 bg-white dark:bg-neutral-800 rounded-lg px-3 py-2 border border-neutral-200 dark:border-neutral-700">
          <span className="text-neutral-400 text-sm">🔍</span>
          <input
            placeholder="搜索计划名称、类型..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[11px] outline-none text-neutral-700 dark:text-neutral-300"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-2 rounded-lg border text-[11px] bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600">
          <option value="all">全部状态</option>
          <option value="Active">进行中</option>
          <option value="Upcoming">即将开始</option>
          <option value="Ended">已结束</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 px-2 rounded-lg border text-[11px] bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600">
          <option value="all">全部类型</option>
          {triggerTypes.map((t: any) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-[10px] text-neutral-400 whitespace-nowrap">{filteredPrograms.length} 项</span>
      </div>

      {/* ============================================ */}
      {/* 第三部分：执行层（政策卡片与决策执行） */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.map((p: any) => (
          <ProgramCard
            key={p.id}
            program={p}
            cur={cur}
            roi={estimateROI(p)}
            onEdit={(prog) => {
              setEditProgram(prog);
              setEditForm({ 
                title: prog.title, 
                trigger_type: (prog.trigger_type || prog.trigger || ''), 
                payout_type: (prog.payout_type || prog.payoutType || 'Cash'), 
                total_budget: String(prog.total_budget || prog.totalBudget || 0), 
                description: prog.description||'', 
                start_date: (prog.start_date || prog.startDate || ''), 
                end_date: (prog.end_date || prog.endDate || ''), 
                status: prog.status 
              });
            }}
            onReport={setReportProgram}
            onPause={handlePause}
            isSelected={selectedProgram === p.id}
            onClick={() => setSelectedProgram(selectedProgram === p.id ? null : p.id)}
          />
        ))}
        {filteredPrograms.length === 0 && (
          <div className="col-span-full text-center py-12 text-neutral-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无激励计划</p>
            <p className="text-xs mt-1">点击上方"新建激励计划"创建第一个激励政策</p>
          </div>
        )}
      </div>

      {/* 创建激励计划模态框 */}
      {showCreate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">新建激励计划</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500">计划名称 *</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500">触发类型</label>
                  <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={form.trigger_type} onChange={e => setForm({...form, trigger_type: e.target.value})}>
                    {['Pipeline Gap','New Product','Competitive','Sales Acceleration'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">发放类型</label>
                  <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={form.payout_type} onChange={e => setForm({...form, payout_type: e.target.value})}>
                    {['Cash','Rebate','Points'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500">总预算 *</label>
                  <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="number" value={form.total_budget} onChange={e => setForm({...form, total_budget: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">开始</label>
                  <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500">结束</label>
                  <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">描述</label>
                <textarea className="w-full px-3 py-2 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm resize-none" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
              <Button variant="brand" onClick={handleCreate} disabled={creating}>{creating ? '创建中...' : '创建计划'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {editProgram && (
        <Modal open={!!editProgram} onClose={() => setEditProgram(null)} size="md" title="编辑激励计划">
          <div className="space-y-3">
            <div><label className="block text-xs font-medium mb-1">名称</label><input className="w-full px-3 py-2 rounded-lg border text-sm" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium mb-1">触发类型</label><select className="w-full px-3 py-2 rounded-lg border text-sm" value={editForm.trigger_type} onChange={e => setEditForm({...editForm, trigger_type: e.target.value})}>{['Pipeline Gap','New Product','Competitive','Sales Acceleration'].map(o => <option key={o}>{o}</option>)}</select></div>
              <div><label className="block text-xs font-medium mb-1">发放类型</label><select className="w-full px-3 py-2 rounded-lg border text-sm" value={editForm.payout_type} onChange={e => setEditForm({...editForm, payout_type: e.target.value})}>{['Cash','Rebate','Points'].map(o => <option key={o}>{o}</option>)}</select></div>
              <div><label className="block text-xs font-medium mb-1">总预算</label><input type="number" className="w-full px-3 py-2 rounded-lg border text-sm" value={editForm.total_budget} onChange={e => setEditForm({...editForm, total_budget: e.target.value})} /></div>
              <div><label className="block text-xs font-medium mb-1">状态</label><select className="w-full px-3 py-2 rounded-lg border text-sm" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>{['Active','Upcoming','Ended'].map(o => <option key={o}>{o}</option>)}</select></div>
              <div><label className="block text-xs font-medium mb-1">开始日期</label><input type="date" className="w-full px-3 py-2 rounded-lg border text-sm" value={editForm.start_date} onChange={e => setEditForm({...editForm, start_date: e.target.value})} /></div>
              <div><label className="block text-xs font-medium mb-1">结束日期</label><input type="date" className="w-full px-3 py-2 rounded-lg border text-sm" value={editForm.end_date} onChange={e => setEditForm({...editForm, end_date: e.target.value})} /></div>
            </div>
            <div><label className="block text-xs font-medium mb-1">描述</label><textarea className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setEditProgram(null)}>取消</Button>
              <Button variant="brand" size="sm" onClick={async () => {
                setEditing(true);
                const { error } = await supabase.from('incentive_programs').update({ title: editForm.title, trigger_type: editForm.trigger_type, payout_type: editForm.payout_type, total_budget: Number(editForm.total_budget), description: editForm.description, start_date: editForm.start_date, end_date: editForm.end_date, status: editForm.status }).eq('id', editProgram.id);
                setEditing(false);
                if (!error) {
                  setEditProgram(null);
                  setLocalPrograms((prev: any[]) => prev.map(prog => prog.id === editProgram.id ? { ...prog, title: editForm.title, trigger_type: editForm.trigger_type, payout_type: editForm.payout_type, total_budget: Number(editForm.total_budget), description: editForm.description, start_date: editForm.start_date, end_date: editForm.end_date, status: editForm.status } : prog));
                }
              }} disabled={editing}>{editing ? '保存中...' : '保存修改'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Program Report Drawer */}
      <ProgramReportDrawer
        open={!!reportProgram}
        onClose={() => setReportProgram(null)}
        program={reportProgram}
        cur={cur}
        roi={reportProgram ? estimateROI(reportProgram) : '0'}
        pipelineValue={reportProgram ? Math.round((reportProgram.claimed_amount || reportProgram.claimedAmount || 0) * Number(estimateROI(reportProgram))) : 0}
        topPartners={topPartners}
      />
    </div>
  );
};

// 政策管理页面组件
const IncentivePolicyManagement: React.FC = () => {
  const { config } = useConfig();
  const navigate = useNavigate();
  const cur = (v: number) => formatCurrency(v, config?.currency || 'CNY');

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<any[]>([]);
  const [roiData, setRoiData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'templates' | 'applications' | 'analytics'>('plans');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [showTargetingModal, setShowTargetingModal] = useState(false);

  // Form states
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    trigger_type: 'Pipeline Gap',
    payout_type: 'Cash',
    total_budget: '',
    start_date: '',
    end_date: '',
    scope: 'all',
    target_levels: [] as string[],
    target_regions: [] as string[],
    target_industries: [] as string[],
    tier_enabled: false,
    tiers: [] as any[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: programsData } = await supabase.from('incentive_programs').select('*').order('created_at', { ascending: false });
      if (programsData) setPrograms(programsData);

      const { data: templatesData } = await supabase.from('incentive_templates').select('*').eq('is_active', true).order('usage_count', { ascending: false });
      if (templatesData) setTemplates(templatesData);

      const { data: appsData } = await supabase.from('incentive_applications').select('*').order('submitted_at', { ascending: false }).limit(20);
      if (appsData) setApplications(appsData);

      const { data: alertsData } = await supabase.from('incentive_budget_alerts').select('*').order('created_at', { ascending: false });
      if (alertsData) setBudgetAlerts(alertsData);

      const totalClaimed = programsData?.reduce((sum, p) => sum + (p.claimed_amount || 0), 0) || 0;
      const totalBudget = programsData?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0;
      const activePrograms = programsData?.filter(p => p.status === 'Active').length || 0;
      const avgParticipation = programsData?.length ? Math.round(programsData.reduce((sum, p) => sum + (p.participants_count || 0), 0) / programsData.length) : 0;
      
      setRoiData({
        totalInvestment: totalClaimed,
        totalBudget: totalBudget,
        activePrograms: activePrograms,
        avgParticipation: avgParticipation,
        estimatedROI: totalClaimed > 0 ? (totalBudget / totalClaimed).toFixed(2) : '0.00',
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.title || !newPlan.total_budget) return;
    try {
      const { error } = await supabase.from('incentive_programs').insert({
        title: newPlan.title,
        description: newPlan.description,
        trigger_type: newPlan.trigger_type,
        payout_type: newPlan.payout_type,
        total_budget: Number(newPlan.total_budget),
        start_date: newPlan.start_date,
        end_date: newPlan.end_date,
        status: 'Upcoming',
        claimed_amount: 0,
        participants_count: 0,
      });
      if (error) throw new Error(error.message);
      setShowCreateModal(false);
      setNewPlan({ title: '', description: '', trigger_type: 'Pipeline Gap', payout_type: 'Cash', total_budget: '', start_date: '', end_date: '', scope: 'all', target_levels: [], target_regions: [], target_industries: [], tier_enabled: false, tiers: [] });
      loadData();
    } catch (err) {
      console.error('Failed to create plan:', err);
    }
  };

  const handleApprove = async (appId: string) => {
    try {
      await supabase.from('incentive_applications').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', appId);
      loadData();
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await supabase.from('incentive_applications').update({ status: 'rejected' }).eq('id', appId);
      loadData();
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const statusVariant = (s: string) => {
    if (s === 'Active') return 'success';
    if (s === 'Upcoming') return 'info';
    if (s === 'Completed') return 'default';
    return 'default';
  };

  const statusLabel = (s: string) => {
    if (s === 'Active') return '进行中';
    if (s === 'Upcoming') return '即将开始';
    if (s === 'Completed') return '已结束';
    return s;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">激励政策管理</h1>
          <p className="text-sm text-neutral-500 mt-1">看、管、算全场景管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTierModal(true)}>
            <Zap className="w-4 h-4" />阶梯规则
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTargetingModal(true)}>
            <Target className="w-4 h-4" />定向规则
          </Button>
          <Button variant="brand" size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />新建计划
          </Button>
        </div>
      </div>

      {budgetAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                预算预警: {budgetAlerts.length} 个计划接近或超出预算阈值
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => navigate('/marketing/budget')}>
              <Activity className="w-4 h-4" />查看详情
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        {[
          { id: 'plans', label: '激励计划', icon: Wallet },
          { id: 'templates', label: '模板库', icon: Layers },
          { id: 'applications', label: '申请审批', icon: FileText },
          { id: 'analytics', label: '效果分析', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2',
              activeTab === tab.id
                ? 'text-brand-600 border-brand-600'
                : 'text-neutral-600 border-transparent hover:text-neutral-900'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200">策略配置层</h3>
                <p className="text-xs text-purple-600 dark:text-purple-400">多维度定向 · 阶梯激励 · 智能模板</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/60 dark:bg-neutral-800/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium">对象定向</span>
                </div>
                <p className="text-xs text-neutral-500">按等级/地域/行业定向发布激励政策</p>
              </div>
              <div className="bg-white/60 dark:bg-neutral-800/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium">阶梯奖励</span>
                </div>
                <p className="text-xs text-neutral-500">设置业绩阈值，对应不同奖励标准</p>
              </div>
              <div className="bg-white/60 dark:bg-neutral-800/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium">模板库</span>
                </div>
                <p className="text-xs text-neutral-500">15+预设模板，点击即用</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p) => {
              const pct = p.total_budget > 0 ? Math.round((p.claimed_amount / p.total_budget) * 100) : 0;
              const isOverBudget = pct >= 90;
              return (
                <Card key={p.id} hover onClick={() => navigate(`/incentives/${p.id}`)}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{p.title}</h3>
                      <div className="flex items-center gap-1">
                        {isOverBudget && <Badge variant="danger" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />超支</Badge>}
                        <Badge variant={statusVariant(p.status)}>{statusLabel(p.status)}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.start_date}</span>
                      <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3" />{p.end_date}</span>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                      <div className="flex justify-between text-xs">
                        <span>预算使用</span>
                        <span className={cn(isOverBudget ? 'text-red-600 font-medium' : 'text-neutral-600')}>{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full transition-all', isOverBudget ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-brand-500')}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-neutral-400">总预算</p>
                        <p className="text-xs font-semibold">{cur(p.total_budget)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400">已申领</p>
                        <p className="text-xs font-semibold">{cur(p.claimed_amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-neutral-400">参与伙伴</p>
                        <p className="text-xs font-semibold">{p.participants_count || 0}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            {programs.length === 0 && (
              <div className="col-span-full text-center py-12 text-neutral-500">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无激励计划</p>
                <p className="text-xs mt-1">点击上方"新建计划"创建第一个激励政策</p>
                <Button variant="brand" size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4" />创建第一个计划
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'templates' && (
        <>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">激励模板库</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400">15+预设行业模板，快速创建激励计划</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <Card key={t.id} hover className="cursor-pointer" onClick={() => {
                setNewPlan({ ...newPlan, title: t.name, description: t.description });
                setShowCreateModal(true);
              }}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t.name}</h3>
                    <Badge variant="default">{t.category}</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 line-clamp-2">{t.description}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Users className="w-3 h-3" />
                    已使用 {t.usage_count || 0} 次
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Zap className="w-4 h-4" />使用此模板
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'applications' && (
        <>
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">审批与核销工作流</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">自动生成待核销记录，管理员在线审批，确保激励发放合规性</p>
              </div>
            </div>
          </div>

          <Card>
            <div className="p-6">
              <h4 className="text-sm font-semibold mb-4">激励申请审批</h4>
              {applications.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>暂无待审批申请</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                          <Award className="w-5 h-5 text-brand-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{a.partner_name || '未知伙伴'}</p>
                          <p className="text-xs text-neutral-500">{a.metric} - 申请金额: {cur(a.claimed_value || 0)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.status === 'approved' ? 'success' : a.status === 'pending' ? 'info' : 'default'}>
                          {a.status === 'approved' ? '已批准' : a.status === 'pending' ? '待审批' : a.status}
                        </Badge>
                        {a.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleApprove(a.id)}>
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleReject(a.id)}>
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-[10px]">
            <span className="shrink-0 font-semibold text-blue-700 dark:text-blue-300">🧠 AI诊断：</span>
            <span className="text-neutral-600 dark:text-neutral-400 truncate">
              {(() => {
                const lowROI = programs.filter((p: any) => (p.claimed_amount || 0) > (p.total_budget || 1) * 0.5 && (p.participants_count || 0) < 10).map((p: any) => p.title);
                const highEfficiency = programs.filter((p: any) => (p.claimed_amount || 0) < (p.total_budget || 1) * 0.5 && (p.participants_count || 0) > 0 && (p.claimed_amount || 0) > 0).map((p: any) => p.title);
                const parts: string[] = [];
                if (lowROI.length) parts.push(`「${lowROI.join('、')}」参与率偏低但预算消耗过半，建议优化准入门槛`);
                if (highEfficiency.length) parts.push(`「${highEfficiency.join('、')}」预算利用效率高，建议追加投入放大效果`);
                if (!parts.length) parts.push('所有激励计划运行正常，投入产出比健康');
                return parts.join('；');
              })()}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '累计ROI', value: `${(roiData?.estimatedROI || '0')}x`, trend: '↑15%', color: '#059669' },
              { label: '商机转化率', value: `${Math.round((programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) / Math.max(programs.reduce((s: number, p: any) => s + (p.total_budget || 0), 0) / 100000, 1)) * 10)}%`, trend: '↑8%', color: '#059669' },
              { label: '活跃伙伴', value: String(programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0)), trend: '↑5', color: '#2563eb' },
              { label: '成交周期', value: '暂无数据', trend: '-', color: '#94a3b8' },
            ].map((k, i) => (
              <Card key={i}>
                <div className="p-3">
                  <p className="text-[10px] text-neutral-500">{k.label}</p>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-xl font-extrabold text-neutral-900 dark:text-white">{k.value}</span>
                    <span className="text-[10px] font-semibold text-emerald-600">{k.trend}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <div className="p-4">
                <h4 className="text-xs font-semibold mb-3">📊 转化漏斗</h4>
                {[
                  { label: '触达伙伴', count: programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) * 2, color: 'bg-blue-500', w: 100 },
                  { label: '报备商机', count: programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0), color: 'bg-blue-400', w: 65 },
                  { label: '赢单成交', count: Math.round(programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) * 0.35), color: 'bg-emerald-500', w: 35 },
                ].map((f, i) => (
                  <div key={i} className="flex flex-col items-center mb-1">
                    <div className={cn('text-white text-center py-1.5 rounded text-[11px] font-semibold', f.color)} style={{ width: `${f.w}%`, minWidth: '60px' }}>{f.label} {f.count}</div>
                    {i < 2 && <span className="text-[9px] text-neutral-400 my-0.5">↓ {i === 0 ? '50%' : '35%'}</span>}
                  </div>
                ))}
                <div className="text-center text-[10px] text-neutral-500 mt-2">
                  转化率 {(programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) > 0 ? Math.round((programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) * 0.35) / programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) * 100) : 0)}% · 平均周期 18 天
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <h4 className="text-xs font-semibold mb-3">🥧 支出构成</h4>
                <div className="flex items-center justify-center gap-4">
                  <svg width="90" height="90" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="14" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                    <circle cx="20" cy="20" r="14" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray="52.8 88" strokeDashoffset="0" transform="rotate(-90 20 20)"/>
                    <circle cx="20" cy="20" r="14" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray="17.6 88" strokeDashoffset="-52.8" transform="rotate(-90 20 20)"/>
                    <circle cx="20" cy="20" r="14" fill="none" stroke="#7c3aed" strokeWidth="8" strokeDasharray="17.6 88" strokeDashoffset="-70.4" transform="rotate(-90 20 20)"/>
                  </svg>
                  <div className="space-y-1.5 text-[10px]">
                    {(() => {
                      const totalClaimed = programs.reduce((s: number, p: any) => s + (p.claimed_amount || 0), 0) || 1;
                      const rebateAmt = programs.filter((p: any) => p.payout_type === 'Rebate').reduce((s: number, p: any) => s + (p.claimed_amount || 0), 0);
                      const cashAmt = programs.filter((p: any) => p.payout_type === 'Cash').reduce((s: number, p: any) => s + (p.claimed_amount || 0), 0);
                      const pointsAmt = totalClaimed - rebateAmt - cashAmt;
                      const rebatePct = Math.round((rebateAmt / totalClaimed) * 100);
                      const cashPct = Math.round((cashAmt / totalClaimed) * 100);
                      const pointsPct = 100 - rebatePct - cashPct;
                      return (
                        <>
                          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />返点 {rebatePct || 33}%</div>
                          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />现金 {cashPct || 33}%</div>
                          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" />积分 {pointsPct || 34}%</div>
                        </>
                      );
                    })()}
                    <div className="text-neutral-400 mt-1">总支出 {cur(roiData?.totalInvestment || 0)}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-4">
                <h4 className="text-xs font-semibold mb-2">🎯 效率矩阵</h4>
                <div className="relative h-[110px] border-l-2 border-b-2 border-neutral-200 dark:border-neutral-700 ml-6 mb-4">
                  <span className="absolute -left-5 top-0 text-[8px] text-neutral-400 -rotate-90 origin-center">商机额</span>
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-neutral-400">消耗率 →</span>
                  {programs.slice(0, 5).map((p: any, i: number) => {
                    const pct = p.total_budget > 0 ? Math.min((p.claimed_amount / p.total_budget) * 100, 100) : 0;
                    const pipeline = (p.participants_count || 1) * 3;
                    const x = Math.min(pct, 95);
                    const y = Math.max(100 - Math.min(pipeline, 100), 5);
                    const color = pct < 50 && pipeline > 20 ? '#059669' : pct > 80 ? '#dc2626' : '#d97706';
                    return <div key={i} className="absolute w-2 h-2 rounded-full -ml-1 -mb-1" style={{ left: `${x}%`, bottom: `${y}%`, background: color }} title={`${p.title}: 消耗${Math.round(pct)}% 商机${pipeline}`} />;
                  })}
                  <span className="absolute left-1 top-2 text-[7px] text-emerald-600">高效区</span>
                  <span className="absolute right-1 bottom-10 text-[7px] text-red-500">低效区</span>
                </div>
                <div className="flex gap-3 text-[9px] justify-center">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />高效</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />中等</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />预警</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '🦾 铁杆伙伴', count: Math.round((programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) || 100) * 0.22), sub: '高活跃·高贡献', color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200', text: 'text-emerald-700', btn: '表彰', btnColor: 'bg-emerald-500' },
              { label: '🚀 高潜伙伴', count: Math.round((programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) || 100) * 0.30), sub: '高活跃·待转化', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200', text: 'text-blue-700', btn: '激活', btnColor: 'bg-blue-500' },
              { label: '😴 沉睡伙伴', count: Math.round((programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) || 100) * 0.35), sub: '低活跃·低贡献', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200', text: 'text-amber-700', btn: '推送', btnColor: 'bg-amber-500' },
              { label: '📉 边缘伙伴', count: Math.round((programs.reduce((s: number, p: any) => s + (p.participants_count || 0), 0) || 100) * 0.13), sub: '低活跃·高流失风险', color: 'bg-red-50 dark:bg-red-900/20 border-red-200', text: 'text-red-700', btn: '干预', btnColor: 'bg-red-500' },
            ].map((q, i) => (
              <div key={i} className={cn('p-3 rounded-xl border text-center', q.color)}>
                <p className={cn('text-[11px] font-semibold', q.text)}>{q.label}</p>
                <p className="text-2xl font-extrabold mt-1 text-neutral-900 dark:text-white">{q.count}</p>
                <p className="text-[9px] text-neutral-500">{q.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && (
        <Modal title="新建激励计划" onClose={() => setShowCreateModal(false)} open={showCreateModal}>
          <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-neutral-500">计划名称 *</label>
              <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={newPlan.title} onChange={e => setNewPlan({...newPlan, title: e.target.value})} placeholder="输入计划名称" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500">描述</label>
              <textarea className="w-full px-3 py-2 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm resize-none" rows={3} value={newPlan.description} onChange={e => setNewPlan({...newPlan, description: e.target.value})} placeholder="输入计划描述" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500">触发类型</label>
                <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={newPlan.trigger_type} onChange={e => setNewPlan({...newPlan, trigger_type: e.target.value})}>
                  <option value="Pipeline Gap">Pipeline Gap</option>
                  <option value="New Product">New Product</option>
                  <option value="Competitive">Competitive</option>
                  <option value="Sales Acceleration">Sales Acceleration</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">发放类型</label>
                <select className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" value={newPlan.payout_type} onChange={e => setNewPlan({...newPlan, payout_type: e.target.value})}>
                  <option value="Cash">Cash</option>
                  <option value="Rebate">Rebate</option>
                  <option value="Points">Points</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500">总预算 *</label>
              <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="number" value={newPlan.total_budget} onChange={e => setNewPlan({...newPlan, total_budget: e.target.value})} placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500">开始日期</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={newPlan.start_date} onChange={e => setNewPlan({...newPlan, start_date: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500">结束日期</label>
                <input className="w-full h-10 px-3 mt-1 bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-sm" type="date" value={newPlan.end_date} onChange={e => setNewPlan({...newPlan, end_date: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
              <Button variant="brand" onClick={handleCreatePlan}>创建计划</Button>
            </div>
          </div>
        </Modal>
      )}

      {showTierModal && (
        <Modal title="阶梯奖励规则配置" onClose={() => setShowTierModal(false)} open={showTierModal}>
          <div className="space-y-4 p-4">
            <p className="text-sm text-neutral-500">设置阶梯阈值，让伙伴"跳一跳"够到更高的业绩。</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">1</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">1-5个商机</p>
                  <p className="text-xs text-neutral-500">奖励标准: 100元/个</p>
                </div>
                <Badge variant="default">基础档</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold">2</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">6-10个商机</p>
                  <p className="text-xs text-neutral-500">奖励标准: 150元/个 (+50%)</p>
                </div>
                <Badge variant="info">进阶档</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold">3</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">11+个商机</p>
                  <p className="text-xs text-neutral-500">奖励标准: 200元/个 (+100%)</p>
                </div>
                <Badge variant="warning">高阶档</Badge>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowTierModal(false)}>关闭</Button>
              <Button variant="brand"><CheckCircle className="w-4 h-4" />保存规则</Button>
            </div>
          </div>
        </Modal>
      )}

      {showTargetingModal && (
        <Modal title="多维度定向规则" onClose={() => setShowTargetingModal(false)} open={showTargetingModal}>
          <div className="space-y-4 p-4">
            <p className="text-sm text-neutral-500">支持按合作伙伴等级、地域、行业定向发布激励政策。</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-2 block">合作伙伴等级</label>
                <div className="flex gap-2">
                  {['金牌', '银牌', '铜牌', '普通'].map(level => (
                    <Badge key={level} variant="outline" className="cursor-pointer hover:bg-neutral-100">{level}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-2 block">地域定向</label>
                <div className="flex gap-2 flex-wrap">
                  {['华东区', '华南区', '华北区', '西北区', '西南区', '东北区'].map(region => (
                    <Badge key={region} variant="outline" className="cursor-pointer hover:bg-neutral-100">{region}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-2 block">行业定向</label>
                <div className="flex gap-2 flex-wrap">
                  {['医疗', '教育', '政府', '企业', '制造', '金融'].map((industry) => (
                    <Badge key={industry} variant="outline" className="cursor-pointer hover:bg-neutral-100">{industry}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="text-xs text-blue-600">💡 提示: 勾选多个维度时，满足任一条件的伙伴都将收到激励通知。</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowTargetingModal(false)}>关闭</Button>
              <Button variant="brand"><CheckCircle className="w-4 h-4" />保存规则</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// 整合后的激励管理页面
export const IncentivesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'policy'>('overview');

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3, description: '钱花得怎么样，发给了谁，值不值' },
    { id: 'policy', label: '政策管理', icon: Settings, description: '看、管、算全场景管理' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-1">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'policy')}
              className={cn(
                'flex-1 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={cn('text-xs', activeTab === tab.id ? 'text-brand-500' : 'text-neutral-400')}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <IncentivesOverview />
      ) : (
        <IncentivePolicyManagement />
      )}
    </div>
  );
};