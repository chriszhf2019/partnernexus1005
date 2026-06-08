// AI 语义标签规则引擎 — 前端关键词匹配，无需后端 API
// 匹配优先级：负面 > 正面 > 中性，每个反馈最多 3 个标签

interface TagRule {
  keywords: string[];
  label: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const rules: TagRule[] = [
  // ── 负面标签（优先匹配）──
  { keywords: ['过时', '老版本', '旧版本', '不更新', '更新不及时'], label: '内容过时', sentiment: 'negative' },
  { keywords: ['录音不清', '听不清', '不清晰', '音质差', '杂音'], label: '录音不清', sentiment: 'negative' },
  { keywords: ['版本滞后', '版本旧', '不是最新', '还在用'], label: '版本滞后', sentiment: 'negative' },
  { keywords: ['无法打开', '打不开', '404', '报错', '崩溃', '加载失败'], label: '无法访问', sentiment: 'negative' },
  { keywords: ['卡顿', '很慢', '加载慢', '响应慢', '延迟'], label: '体验卡顿', sentiment: 'negative' },
  { keywords: ['严重过时', '完全不', '太差', '失望', '浪费'], label: '严重不满', sentiment: 'negative' },
  // ── 正面标签 ──
  { keywords: ['清晰', '讲得清楚', '深入浅出', '通俗易懂', '透彻'], label: '讲解清晰', sentiment: 'positive' },
  { keywords: ['实用', '有用', '能用上', '立竿见影', '直接用到'], label: '实用性强', sentiment: 'positive' },
  { keywords: ['案例丰富', '案例多', '贴近实战', '真实案例'], label: '案例丰富', sentiment: 'positive' },
  { keywords: ['上手快', '容易上手', '快速上手', '学了就能'], label: '上手快', sentiment: 'positive' },
  { keywords: ['推荐', '强烈推荐', '最好', '最棒', '太棒了'], label: '强烈推荐', sentiment: 'positive' },
  { keywords: ['模板', '工具包', '配套', '拿来就用'], label: '配套完善', sentiment: 'positive' },
  // ── 中性/建议标签 ──
  { keywords: ['时长偏长', '时间太长', '太长了', '课程太长', '拆分章节'], label: '时长偏长', sentiment: 'neutral' },
  { keywords: ['重复', '重复率高', '基础内容多', '新人友好但'], label: '重复率高', sentiment: 'neutral' },
  { keywords: ['缺少练习', '练习少', '想练习', '模拟练习', '角色扮演'], label: '缺少练习', sentiment: 'neutral' },
  { keywords: ['需要更新', '希望能更新', '建议更新', '希望改进'], label: '需要更新', sentiment: 'neutral' },
  { keywords: ['分级教学', '分层', '分级', '初级和高级'], label: '建议分级', sentiment: 'neutral' },
  { keywords: ['镜像', '环境搭建', '实验环境', '网络'], label: '环境问题', sentiment: 'neutral' },
];

export interface TagResult {
  label: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export function analyzeTags(content: string): TagResult[] {
  const results: TagResult[] = [];
  const usedLabels = new Set<string>();

  // 先匹配负面，再正面，最后中性
  for (const sentiment of ['negative', 'positive', 'neutral'] as const) {
    for (const rule of rules.filter(r => r.sentiment === sentiment)) {
      if (usedLabels.has(rule.label)) continue;
      if (results.length >= 3) break;
      const matched = rule.keywords.some(kw => content.includes(kw));
      if (matched) {
        results.push({ label: rule.label, sentiment: rule.sentiment });
        usedLabels.add(rule.label);
      }
    }
  }

  return results.slice(0, 3);
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
    case 'neutral': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
    case 'negative': return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    default: return 'bg-neutral-100 text-neutral-600';
  }
}

export function getSentimentRatio(feedbackList: Array<{ content: string }>): { positive: number; neutral: number; negative: number } {
  let positive = 0, neutral = 0, negative = 0;
  feedbackList.forEach(f => {
    const tags = analyzeTags(f.content);
    const hasNeg = tags.some(t => t.sentiment === 'negative');
    const hasPos = tags.some(t => t.sentiment === 'positive');
    if (hasNeg) negative++;
    else if (hasPos) positive++;
    else neutral++;
  });
  const total = feedbackList.length || 1;
  return {
    positive: Math.round((positive / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    negative: Math.round((negative / total) * 100),
  };
}
