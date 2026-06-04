// AI Service - calls Vercel API route which proxies to AI provider
// API key configured in Settings → AI 配置

interface AIConfig {
  aiApiKey?: string;
  aiBaseUrl?: string;
  aiModel?: string;
}

async function callAI(prompt: string, system: string, config?: AIConfig): Promise<string> {
  const apiKey = config?.aiApiKey || '';
  const baseURL = config?.aiBaseUrl || 'https://api.deepseek.com';
  const model = config?.aiModel || 'deepseek-chat';

  if (!apiKey) {
    return '[AI 未配置] 请在 设置 → AI 配置 中填写 API Key';
  }

  try {
    const res = await fetch('/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, system, apiKey, baseUrl: baseURL, model }),
    });
    const data = await res.json();
    if (data.error) return `[AI 调用失败] ${data.error}`;
    return data.text || JSON.stringify(data);
  } catch (err: any) {
    return `[AI 调用失败] ${err.message}`;
  }
}

export async function analyzePartner(partnerData: Record<string, any>, config?: AIConfig): Promise<string> {
  return callAI(
    `分析以下合作伙伴：名称${partnerData.name}，等级${partnerData.tier}，类型${partnerData.type}，地区${partnerData.region || partnerData.city || '未知'}，行业${partnerData.industry || '未填'}，合作年限${partnerData.years || 0}年，赢单率${partnerData.winRate || 0}%。请给出：1)健康度评估 2)关键发现 3)行动建议`,
    '你是合作伙伴管理系统的 AI 分析专家。用中文简洁回复，格式：健康度评估、关键发现（2-3条）、行动建议（1-2条）。',
    config
  );
}

export async function predictDealOutcome(dealData: Record<string, any>, config?: AIConfig): Promise<string> {
  return callAI(
    `评估商机：客户${dealData.customerName}，行业${dealData.customerIndustry}，金额${dealData.value}，阶段${dealData.stage}，伙伴${dealData.partnerName}。请给出赢单概率（低/中/高）和下一步建议。`,
    '你是商机分析专家，用中文简洁回复，不超过150字。',
    config
  );
}

export async function optimizeMarketingPlan(planData: Record<string, any>, config?: AIConfig): Promise<string> {
  return callAI(
    `营销预算：年度${planData.annualBudget}，Q1:${planData.q1} Q2:${planData.q2} Q3:${planData.q3} Q4:${planData.q4}。历史执行率${planData.executionRate || '未知'}。请给出各季度预算分配建议。`,
    '你是营销预算规划专家，用中文简洁回复，不超过200字。',
    config
  );
}

export async function aiQuery(prompt: string, context?: string, config?: AIConfig): Promise<string> {
  return callAI(prompt, context || '你是 PartnerNexus 的 AI 助手，请用中文简洁回复。', config);
}

export function isAIConfigured(config?: AIConfig): boolean {
  return !!(config?.aiApiKey);
}
