// ─────────────────────────────────────────────────────────────────────────────
// 配置服务 - 运行时加载评分配置
// ─────────────────────────────────────────────────────────────────────────────
// 支持从数据库动态加载配置，实现权重可调整
// 包含 5 分钟缓存，避免频繁查询数据库
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase';
import type {
  ScoringConfig,
  ScoringConfigItem,
  NegativePenaltyConfig,
  ChurnThresholdConfig,
  MonthlySnapshotConfig,
} from '../types/config';

// 默认配置（数据库不可用时的降级值）
const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  tierBaseline: {
    Diamond: 80,
    Platinum: 70,
    Gold: 58,
    Silver: 45,
    Standard: 35,
    Registered: 25,
    default: 40,
  },
  tierCertExpectation: {
    Diamond: 15,
    Platinum: 10,
    Gold: 6,
    Silver: 3,
    Standard: 2,
    Registered: 1,
    default: 3,
  },
  healthWeights: {
    activity: 0.25,
    capability: 0.25,
    loyalty: 0.20,
    pipelineHealth: 0.15,
    growth: 0.15,
  },
  growthWeights: {
    years: 0.15,
    pipeline: 0.40,
    certification: 0.30,
    mdf: 0.15,
  },
  willingnessWeights: {
    resource: 0.20,
    capital: 0.15,
    response: 0.20,
    commitment: 0.25,
    training: 0.20,
  },
  fitWeights: {
    customerOverlap: 0.30,
    productComplement: 0.25,
    modelSimilarity: 0.25,
    geoMatch: 0.20,
  },
  capabilityWeights: {
    sales: 0.25,
    tech: 0.30,
    delivery: 0.25,
    marketing: 0.20,
  },
  incentiveWeights: {
    mdf: 0.40,
    certification: 0.30,
    marketing: 0.30,
  },
  negativePenalty: {
    noPipelineYears: 1,
    noCertEngineersYears: 2,
    noMdfYears: 1,
    maxPenalty: 50,
    noPipelinePenalty: 15,
    noCertPenalty: 10,
    noMdfPenalty: 8,
    inactivePenalty: 25,
    lowWinRatePenalty: 8,
  },
  churnThresholds: {
    notCooperating: 35,
    expiryThreshold: 2,
    expiryBonus: 20,
    pipelineThreshold: 1000000,
    pipelineLow: 20,
    winRateThreshold: 40,
    winRateLow: 15,
    mdfThreshold: 30,
    mdfLow: 10,
  },
  monthlySnapshot: {
    enabled: true,
    autoRunDay: 1,
    autoRunHour: 2,
    retentionMonths: 36,
  },
};

// 静态映射：数据库 configKey → ScoringConfig 字段
const CONFIG_KEY_MAP: Record<string, keyof ScoringConfig> = {
  tier_baseline: 'tierBaseline',
  tier_cert_expectation: 'tierCertExpectation',
  health_weights: 'healthWeights',
  growth_weights: 'growthWeights',
  willingness_weights: 'willingnessWeights',
  fit_weights: 'fitWeights',
  capability_weights: 'capabilityWeights',
  incentive_weights: 'incentiveWeights',
  negative_penalty: 'negativePenalty',
  churn_thresholds: 'churnThresholds',
  monthly_snapshot: 'monthlySnapshot',
};

class ScoringConfigService {
  private config: ScoringConfig | null = null;
  private lastFetch = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 加载评分配置
   * - 优先从缓存返回
   * - 缓存过期后从数据库加载
   * - 数据库不可用时降级使用默认配置
   */
  async loadConfig(): Promise<ScoringConfig> {
    const now = Date.now();

    // 缓存未过期，直接返回
    if (this.config && now - this.lastFetch < this.CACHE_TTL) {
      return this.config;
    }

    try {
      const { data, error } = await supabase
        .from('scoring_config')
        .select('config_key, config_value, description, category, is_active')
        .eq('is_active', true);

      if (error || !data || data.length === 0) {
        console.warn('[ScoringConfig] 数据库加载失败，使用默认配置');
        this.config = DEFAULT_SCORING_CONFIG;
        this.lastFetch = now;
        return this.config;
      }

      // 构建配置对象
      const loadedConfig: Partial<ScoringConfig> = {};

      for (const item of data as any[]) {
        const configKey = CONFIG_KEY_MAP[item.config_key];
        if (configKey) {
          (loadedConfig as any)[configKey] = item.config_value;
        }
      }

      // 合并默认配置（缺失的配置项使用默认值）
      this.config = this.mergeWithDefaults(loadedConfig);
      this.lastFetch = now;

      return this.config;
    } catch (err) {
      console.error('[ScoringConfig] 配置加载异常:', err);
      this.config = DEFAULT_SCORING_CONFIG;
      this.lastFetch = now;
      return this.config;
    }
  }

  /**
   * 合并加载的配置与默认配置
   */
  private mergeWithDefaults(loaded: Partial<ScoringConfig>): ScoringConfig {
    return {
      tierBaseline: { ...DEFAULT_SCORING_CONFIG.tierBaseline, ...loaded.tierBaseline },
      tierCertExpectation: { ...DEFAULT_SCORING_CONFIG.tierCertExpectation, ...loaded.tierCertExpectation },
      healthWeights: { ...DEFAULT_SCORING_CONFIG.healthWeights, ...loaded.healthWeights },
      growthWeights: { ...DEFAULT_SCORING_CONFIG.growthWeights, ...loaded.growthWeights },
      willingnessWeights: { ...DEFAULT_SCORING_CONFIG.willingnessWeights, ...loaded.willingnessWeights },
      fitWeights: { ...DEFAULT_SCORING_CONFIG.fitWeights, ...loaded.fitWeights },
      capabilityWeights: { ...DEFAULT_SCORING_CONFIG.capabilityWeights, ...loaded.capabilityWeights },
      incentiveWeights: { ...DEFAULT_SCORING_CONFIG.incentiveWeights, ...loaded.incentiveWeights },
      negativePenalty: { ...DEFAULT_SCORING_CONFIG.negativePenalty, ...loaded.negativePenalty },
      churnThresholds: { ...DEFAULT_SCORING_CONFIG.churnThresholds, ...loaded.churnThresholds },
      monthlySnapshot: { ...DEFAULT_SCORING_CONFIG.monthlySnapshot, ...loaded.monthlySnapshot },
    };
  }

  /**
   * 更新单个配置项
   */
  async updateConfig(key: string, value: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scoring_config')
        .update({
          config_value: value,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', key);

      if (error) {
        console.error('[ScoringConfig] 配置更新失败:', error);
        return false;
      }

      // 清除缓存，下次加载会读取新值
      this.clearCache();
      return true;
    } catch (err) {
      console.error('[ScoringConfig] 配置更新异常:', err);
      return false;
    }
  }

  /**
   * 获取所有配置项（用于管理后台）
   */
  async getAllConfigItems(): Promise<ScoringConfigItem[]> {
    try {
      const { data, error } = await supabase
        .from('scoring_config')
        .select('*')
        .order('category', { ascending: true })
        .order('config_key', { ascending: true });

      if (error || !data) {
        return [];
      }

      return data.map((item: any) => ({
        id: item.id,
        configKey: item.config_key,
        configValue: item.config_value,
        description: item.description,
        category: item.category,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch (err) {
      console.error('[ScoringConfig] 获取配置列表异常:', err);
      return [];
    }
  }

  /**
   * 清除缓存（配置更新后调用）
   */
  clearCache(): void {
    this.config = null;
    this.lastFetch = 0;
  }

  /**
   * 获取默认配置（不查询数据库）
   */
  getDefaultConfig(): ScoringConfig {
    return DEFAULT_SCORING_CONFIG;
  }

  /**
   * 获取负反馈配置（便捷方法）
   */
  async getNegativePenaltyConfig(): Promise<NegativePenaltyConfig> {
    const config = await this.loadConfig();
    return config.negativePenalty;
  }

  /**
   * 获取流失风险阈值（便捷方法）
   */
  async getChurnThresholds(): Promise<ChurnThresholdConfig> {
    const config = await this.loadConfig();
    return config.churnThresholds;
  }

  /**
   * 获取月度快照配置（便捷方法）
   */
  async getMonthlySnapshotConfig(): Promise<MonthlySnapshotConfig> {
    const config = await this.loadConfig();
    return config.monthlySnapshot;
  }

  /**
   * 验证权重配置是否有效（各项之和应接近1）
   */
  validateWeights(weights: Record<string, number>): { valid: boolean; sum: number; message?: string } {
    const sum = Object.values(weights).reduce((acc, v) => acc + v, 0);
    const valid = Math.abs(sum - 1) < 0.01;

    return {
      valid,
      sum: Math.round(sum * 100) / 100,
      message: valid
        ? '权重配置有效'
        : `权重之和为 ${Math.round(sum * 100)}%，应为 100%`,
    };
  }
}

// 单例导出
const scoringConfigService = new ScoringConfigService();
export { scoringConfigService };
export default scoringConfigService;
