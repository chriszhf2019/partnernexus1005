import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { GlobalConfig } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// 本地配置服务 - 管理 GlobalConfig（与评分配置 scoringConfigService 不同）
// ─────────────────────────────────────────────────────────────────────────────
interface ConfigSubscriber {
  onData: (data: GlobalConfig) => void;
  onError: (error: Error) => void;
}

const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  sections: {
    revenueAlignment: true,
    partnershipMatrix: true,
    ecosystemNetwork: true,
    mdfEfficiency: true,
  },
  partnerTiers: ['Diamond', 'Platinum', 'Gold', 'Silver', 'Standard', 'Registered'],
  partnerTypes: ['VAD', 'VAR', 'ISV', 'SI', 'OEM', 'Service'],
  partnerStatuses: ['Cooperating', 'Inactive', 'Prospective', 'Rejected'],
  partnerVendors: [],
  cooperationLevels: [],
  salesStages: [],
  industries: [],
  regions: [],
  currency: 'CNY',
};

class LocalConfigService {
  private config: GlobalConfig;
  private subscribers: Set<ConfigSubscriber> = new Set();

  constructor() {
    this.config = { ...DEFAULT_GLOBAL_CONFIG };
  }

  getDefaultConfig(): GlobalConfig {
    return { ...this.config };
  }

  subscribe(onData: (data: GlobalConfig) => void, onError: (error: Error) => void): () => void {
    const subscriber: ConfigSubscriber = { onData, onError };
    this.subscribers.add(subscriber);
    
    // 立即调用一次，传递当前数据
    onData(this.config);
    
    // 返回取消订阅函数
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  async update(oldConfig: GlobalConfig, newConfig: Partial<GlobalConfig>): Promise<void> {
    // 更新本地配置
    this.config = { ...this.config, ...newConfig };
    
    // 通知所有订阅者
    for (const subscriber of this.subscribers) {
      try {
        subscriber.onData(this.config);
      } catch (err) {
        subscriber.onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }
}

// 单例
const configService = new LocalConfigService();

interface ConfigContextType {
  config: GlobalConfig;
  updateConfig: (newConfig: Partial<GlobalConfig>) => Promise<void>;
  isLoading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<GlobalConfig>(configService.getDefaultConfig());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = configService.subscribe(
      (data) => {
        setConfig(data);
        setIsLoading(false);
      },
      (error) => {
        console.error('Config subscription error:', error);
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<GlobalConfig>) => {
    const merged = { ...config, ...newConfig };
    await configService.update(config, newConfig);
    setConfig(merged);
  }, [config]);

  // useMemo: prevent value object recreation on every render
  const value = useMemo<ConfigContextType>(() => ({
    config, updateConfig, isLoading,
  }), [config, updateConfig, isLoading]);

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
