// ─────────────────────────────────────────────────────────────────────────────
// 月度数据快照服务
// ─────────────────────────────────────────────────────────────────────────────
// 自动采集和存储伙伴的月度统计数据，支持同比/环比增长的历史对比
//
// 功能：
// 1. 手动触发月度快照
// 2. 自动月结定时任务配置
// 3. 历史数据查询
// 4. 数据置信度计算
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase';
import { scoringConfigService } from './config-service';
import type { PartnerMonthlyStats, GrowthConfidence } from '../types/config';

// ─────────────────────────────────────────────────────────────────────────────
// 1. 月度快照采集
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 采集单个伙伴的月度统计数据
 */
export async function collectPartnerMonthlyStats(partner: any, year: number, month: number): Promise<Partial<PartnerMonthlyStats>> {
  const now = new Date();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  // 判断本月是否新增
  const partnerStart = new Date(partner.startDate || '');
  const isNew = !isNaN(partnerStart.getTime()) && partnerStart >= startOfMonth && partnerStart <= endOfMonth;

  // 判断本月是否流失
  const inactiveDate = partner.inactiveDate ? new Date(partner.inactiveDate) : null;
  const isLost = inactiveDate && !isNaN(inactiveDate.getTime()) && inactiveDate >= startOfMonth && inactiveDate <= endOfMonth;

  return {
    partnerId: partner.id,
    year,
    month,
    isNew,
    isLost,
    isActive: partner.status === 'Cooperating',
    pipelineRegistered: partner.pipeline?.registered || 0,
    pipelineWon: partner.pipeline?.won || 0,
    revenue: partner.totalRevenue || 0,
    mdfUsed: partner.mdf?.used || 0,
    mdfTotal: partner.mdf?.total || 0,
    certificationCount: partner.enablement?.certifiedEngineers || 0,
    marketingActivityCount: partner.marketingActivities || 0,
  };
}

/**
 * 执行月度快照（采集所有伙伴的本月数据）
 */
export async function runMonthlySnapshot(year?: number, month?: number): Promise<{ success: boolean; count: number; error?: string }> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;

  try {
    // 1. 获取所有伙伴列表
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*');

    if (partnersError || !partners) {
      return { success: false, count: 0, error: partnersError?.message || '获取伙伴列表失败' };
    }

    // 2. 采集每个伙伴的数据
    const stats: Partial<PartnerMonthlyStats>[] = [];
    for (const partner of partners) {
      const stat = await collectPartnerMonthlyStats(partner, targetYear, targetMonth);
      stats.push(stat);
    }

    // 3. 批量写入数据库（使用 upsert）
    const { error: upsertError } = await supabase
      .from('partner_monthly_stats')
      .upsert(
        stats.map(s => ({
          partner_id: s.partnerId,
          year: s.year,
          month: s.month,
          is_new: s.isNew,
          is_lost: s.isLost,
          is_active: s.isActive,
          pipeline_registered: s.pipelineRegistered,
          pipeline_won: s.pipelineWon,
          revenue: s.revenue,
          mdf_used: s.mdfUsed,
          mdf_total: s.mdfTotal,
          certification_count: s.certificationCount,
          marketing_activity_count: s.marketingActivityCount,
        })),
        { onConflict: 'partner_id,year,month' }
      );

    if (upsertError) {
      return { success: false, count: 0, error: upsertError.message };
    }

    return { success: true, count: stats.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 历史数据查询
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取指定伙伴的历史月度统计数据
 */
export async function getPartnerMonthlyHistory(
  partnerId: string,
  months: number = 12
): Promise<PartnerMonthlyStats[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  const { data, error } = await supabase
    .from('partner_monthly_stats')
    .select('*')
    .eq('partner_id', partnerId)
    .gte('year', startDate.getFullYear())
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    partnerId: item.partner_id,
    year: item.year,
    month: item.month,
    isNew: item.is_new,
    isLost: item.is_lost,
    isActive: item.is_active,
    pipelineRegistered: Number(item.pipeline_registered) || 0,
    pipelineWon: Number(item.pipeline_won) || 0,
    revenue: Number(item.revenue) || 0,
    mdfUsed: Number(item.mdf_used) || 0,
    mdfTotal: Number(item.mdf_total) || 0,
    certificationCount: item.certification_count || 0,
    marketingActivityCount: item.marketing_activity_count || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

/**
 * 获取所有伙伴的月度统计数据（用于列表页）
 */
export async function getAllPartnersMonthlyStats(
  year: number,
  month: number
): Promise<Map<string, PartnerMonthlyStats>> {
  const { data, error } = await supabase
    .from('partner_monthly_stats')
    .select('*')
    .eq('year', year)
    .eq('month', month);

  if (error || !data) {
    return new Map();
  }

  const map = new Map<string, PartnerMonthlyStats>();
  for (const item of data) {
    const stats: PartnerMonthlyStats = {
      id: item.id,
      partnerId: item.partner_id,
      year: item.year,
      month: item.month,
      isNew: item.is_new,
      isLost: item.is_lost,
      isActive: item.is_active,
      pipelineRegistered: Number(item.pipeline_registered) || 0,
      pipelineWon: Number(item.pipeline_won) || 0,
      revenue: Number(item.revenue) || 0,
      mdfUsed: Number(item.mdf_used) || 0,
      mdfTotal: Number(item.mdf_total) || 0,
      certificationCount: item.certification_count || 0,
      marketingActivityCount: item.marketing_activity_count || 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
    map.set(item.partner_id, stats);
  }

  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 数据置信度计算
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 计算增长数据的置信度
 * 
 * 置信度判断标准：
 * - high: 有24个月以上的历史数据
 * - medium: 有12个月以上的历史数据
 * - low: 有6个月以上的历史数据
 * - insufficient: 不足6个月数据
 */
export async function calculateGrowthConfidence(partnerId: string): Promise<GrowthConfidence> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 查询历史数据月份数
  const { data, error } = await supabase
    .from('partner_monthly_stats')
    .select('year, month')
    .eq('partner_id', partnerId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error || !data || data.length === 0) {
    return {
      yoyGrowth: null,
      qoqGrowth: null,
      incentiveExecution: null,
      confidence: 'low',
      dataMonths: 0,
      dataHistoryYears: 0,
    };
  }

  const typedData = data as any[];
  const dataMonths = typedData.length;

  // 计算数据覆盖的年份数
  const years = new Set(typedData.map((d) => d.year));
  const dataHistoryYears = years.size;

  // 获取本月数据
  const currentMonthData = typedData.find((d) => d.year === currentYear && d.month === currentMonth);

  // 获取去年同月数据
  const lastYearSameMonth = typedData.find((d) => 
    d.year === currentYear - 1 && d.month === currentMonth
  );

  // 获取上月数据
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastMonthData = typedData.find((d) => 
    d.year === lastMonthYear && d.month === lastMonth
  );

  // 计算同比增长
  let yoyGrowth: number | null = null;
  if (currentMonthData && lastYearSameMonth) {
    const currentNew = currentMonthData.is_new ? 1 : 0;
    const lastYearNew = lastYearSameMonth.is_new ? 1 : 0;
    if (lastYearNew > 0) {
      yoyGrowth = Math.round(((currentNew - lastYearNew) / lastYearNew) * 100);
    } else if (currentNew > 0) {
      yoyGrowth = 100;
    }
  }

  // 计算环比增长
  let qoqGrowth: number | null = null;
  if (currentMonthData && lastMonthData) {
    const currentNew = currentMonthData.is_new ? 1 : 0;
    const lastNew = lastMonthData.is_new ? 1 : 0;
    if (lastNew > 0) {
      qoqGrowth = Math.round(((currentNew - lastNew) / lastNew) * 100);
    } else if (currentNew > 0) {
      qoqGrowth = 100;
    }
  }

  // 计算激励执行率（基于最近一个月的数据）
  let incentiveExecution: number | null = null;
  const latestData = typedData[0];
  if (latestData) {
    const mdfScore = latestData.mdf_total > 0 
      ? (latestData.mdf_used / latestData.mdf_total) * 100 
      : 0;
    incentiveExecution = Math.round(mdfScore * 0.4 + (latestData.certification_count > 0 ? 30 : 0) + (latestData.marketing_activity_count > 0 ? 30 : 0));
  }

  // 确定置信度
  let confidence: 'high' | 'medium' | 'low' | 'insufficient';
  if (dataMonths >= 24) {
    confidence = 'high';
  } else if (dataMonths >= 12) {
    confidence = 'medium';
  } else if (dataMonths >= 6) {
    confidence = 'low';
  } else {
    confidence = 'insufficient';
  }

  return {
    yoyGrowth,
    qoqGrowth,
    incentiveExecution,
    confidence,
    dataMonths,
    dataHistoryYears,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 定时任务配置
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 检查是否需要执行月度快照
 * 基于配置中的 autoRunDay 和 autoRunHour
 */
export async function shouldRunSnapshot(): Promise<boolean> {
  const config = await scoringConfigService.getMonthlySnapshotConfig();
  
  if (!config.enabled) {
    return false;
  }

  const now = new Date();
  const currentDay = now.getDate();
  const currentHour = now.getHours();

  // 检查是否是配置的执行日
  if (currentDay !== config.autoRunDay) {
    return false;
  }

  // 检查是否是配置的执行时间（允许前后1小时的窗口）
  if (Math.abs(currentHour - config.autoRunHour) > 1) {
    return false;
  }

  return true;
}

/**
 * 获取最近一次快照的时间
 */
export async function getLastSnapshotTime(): Promise<{ year: number; month: number; timestamp: string } | null> {
  const { data, error } = await supabase
    .from('partner_monthly_stats')
    .select('year, month, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return {
    year: data[0].year,
    month: data[0].month,
    timestamp: data[0].created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. 数据清理
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 清理过期数据（保留配置中指定月数的数据）
 */
export async function cleanupOldData(): Promise<{ deleted: number; error?: string }> {
  const config = await scoringConfigService.getMonthlySnapshotConfig();
  const retentionMonths = config.retentionMonths;

  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - retentionMonths, 1);

  const { error } = await supabase
    .from('partner_monthly_stats')
    .delete()
    .or(`and(year.lt.${cutoffDate.getFullYear()},month.lt.${cutoffDate.getMonth() + 1})`);

  if (error) {
    return { deleted: 0, error: error.message };
  }

  return { deleted: -1 }; // -1 表示成功但不返回具体数量
}

// ─────────────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────────────

export const monthlySnapshotService = {
  collectPartnerMonthlyStats,
  runMonthlySnapshot,
  getPartnerMonthlyHistory,
  getAllPartnersMonthlyStats,
  calculateGrowthConfidence,
  shouldRunSnapshot,
  getLastSnapshotTime,
  cleanupOldData,
};

export default monthlySnapshotService;
