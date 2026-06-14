import { supabase, db } from '../lib/supabase';
import type { GlobalConfig } from '../types';

const defaultConfig: GlobalConfig = {
  sections: { revenueAlignment: true, partnershipMatrix: true, ecosystemNetwork: true, mdfEfficiency: true },
  partnerTiers: ['Platinum', 'Gold', 'Silver', 'Registered', 'Diamond'],
  partnerTypes: ['Reseller', 'ISV', 'SI', 'Service', 'VAD', 'VAR', 'OEM'],
  partnerStatuses: ['Cooperating', 'Inactive', 'Prospective'],
  partnerVendors: ['华为', '浪潮', '新华三', '联想', '曙光', 'Oracle', 'Microsoft', 'AWS', '阿里云', '腾讯云'],
  cooperationLevels: ['战略级', '金牌代理', '银牌代理', '认证代理', '注册代理'],
  salesStages: ['1. 需求发现', '2. 方案阶段', '3. 商务洽谈', '4. 合同签约', '5. 售后回访'],
  industries: ['金融', '医疗', '政务', '制造', '教育'],
  regions: ['华北', '华东', '华南', '西部'],
  currency: 'CNY',
  productTypes: ['云原生平台', '大数据平台', 'AI 智算平台', '安全合规', '混合云方案', 'SaaS 应用', '运维服务'],
  ctaButtonLabel: '合作伙伴中心',
};

export const configService = {
  getDefaultConfig: (): GlobalConfig => defaultConfig,

  subscribe: (
    onData: (config: GlobalConfig) => void,
    onError?: (error: Error) => void,
  ): (() => void) => {
    // Try to load from Supabase, fall back to default
    void db.settings().select('data').eq('id', 'global').single().then((res: any) => {
      const result = res as { data: { data: GlobalConfig } | null; error: any } | null;
      if (result?.data?.data) {
        // Merge Supabase data with defaults so missing fields get sensible values
        onData({ ...defaultConfig, ...result.data.data });
      } else {
        onData(defaultConfig);
      }
    }, (err: Error) => {
      onError?.(err);
      onData(defaultConfig);
    });

    const channel = supabase
      .channel('config-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload: any) => {
        if (payload.new?.data) {
          onData(payload.new.data as GlobalConfig);
        }
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  },

  update: async (current: GlobalConfig, partial: Partial<GlobalConfig>): Promise<void> => {
    const merged = { ...current, ...partial };
    await db.settings().upsert({ id: 'global', data: merged, updated_at: new Date().toISOString() });
  },
};
