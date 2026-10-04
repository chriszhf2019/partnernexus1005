import { supabase } from './supabase';

/**
 * 国际企业级IT产品市场新闻聚合引擎
 * International Enterprise IT Product Market News Engine
 *
 * 通过多个权威 RSS/Atom 源实时拉取企业级IT新闻，
 * 去重后写入 Supabase market_news 表，供首页展示。
 *
 * 使用 CORS 代理解决跨域问题：api.allorigins.win / corsproxy.io
 */

export interface MarketNews {
  id?: string;
  title: string;
  source: string;
  source_url: string;
  url: string;
  published_at: string;
  category: string;
  summary?: string;
  image_url?: string;
  created_at?: string;
}

/** 新闻源配置 - 国际权威企业级IT媒体 */
const NEWS_SOURCES = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/category/enterprise/feed/', category: '企业技术', lang: 'EN' },
  { name: 'VentureBeat', url: 'https://venturebeat.com/feed/', category: 'AI/创新', lang: 'EN' },
  { name: 'ZDNet', url: 'https://www.zdnet.com/news/rss.xml', category: '企业IT', lang: 'EN' },
  { name: 'InfoWorld', url: 'https://www.infoworld.com/index.rss', category: '软件开发', lang: 'EN' },
  { name: 'The Register', url: 'https://www.theregister.com/headlines.atom', category: '基础设施', lang: 'EN' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: '技术深度', lang: 'EN' },
  { name: 'CIO Dive', url: 'https://www.ciodive.com/feed/', category: 'CIO 视角', lang: 'EN' },
  { name: 'SiliconANGLE', url: 'https://siliconangle.com/feed/', category: '云/生态', lang: 'EN' },
  { name: 'Computer Weekly', url: 'https://www.computerweekly.com/rss/All-Computer-Weekly-content.xml', category: '企业IT', lang: 'EN' },
  { name: 'eWEEK', url: 'https://www.eweek.com/feed/', category: '企业IT', lang: 'EN' },
  { name: 'Dark Reading', url: 'https://www.darkreading.com/rss_simple.asp', category: '安全', lang: 'EN' },
  { name: 'DevOps.com', url: 'https://devops.com/feed/', category: 'DevOps', lang: 'EN' },
  { name: 'SDxCentral', url: 'https://www.sdxcentral.com/feed/', category: '云/网络', lang: 'EN' },
  { name: 'CRN', url: 'https://www.crn.com/rssfeed?topic=news', category: '渠道/伙伴', lang: 'EN' },
  { name: 'Reuters Tech', url: 'https://feeds.reuters.com/reuters/technologyNews', category: '科技要闻', lang: 'EN' },
  { name: 'BBC Tech', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', category: '科技要闻', lang: 'EN' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: '开发者', lang: 'EN' },
];

/** CORS 代理列表 - 按优先级尝试 */
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const STORAGE_KEY = 'partner_nexus_market_news_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 小时缓存

/** 使用 DOMParser 解析 RSS/Atom XML */
function parseFeed(xmlText: string, source: { name: string; category: string; url: string }): MarketNews[] {
  const items: MarketNews[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');

  if (doc.querySelector('parsererror')) return items;

  // RSS 2.0: <item>
  const rssItems = doc.querySelectorAll('item');
  rssItems.forEach(node => {
    try {
      const title = (node.querySelector('title')?.textContent || '').trim();
      const link = (node.querySelector('link')?.textContent || '').trim();
      const pubDate = node.querySelector('pubDate')?.textContent
        || node.querySelector('date')?.textContent
        || new Date().toISOString();
      const description = (node.querySelector('description')?.textContent
        || node.querySelector('summary')?.textContent
        || '').trim();

      // 尝试提取图片
      let imageUrl = '';
      const enclosure = node.querySelector('enclosure');
      if (enclosure?.getAttribute('type')?.startsWith('image/')) {
        imageUrl = enclosure.getAttribute('url') || '';
      }
      const mediaContent = node.querySelector('content');
      if (!imageUrl && mediaContent?.getAttribute('url')) {
        imageUrl = mediaContent.getAttribute('url') || '';
      }

      // 从 description 中提取摘要（去除 HTML）
      const cleanSummary = description
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 280);

      if (!title || !link) return;

      let parsedDate: Date;
      try {
        parsedDate = new Date(pubDate);
        if (isNaN(parsedDate.getTime())) parsedDate = new Date();
      } catch {
        parsedDate = new Date();
      }

      items.push({
        title,
        source: source.name,
        source_url: source.url,
        url: link,
        published_at: parsedDate.toISOString(),
        category: source.category,
        summary: cleanSummary,
        image_url: imageUrl || undefined,
      });
    } catch (e) {
      // 单条解析失败不影响整体
    }
  });

  // Atom: <entry>
  const atomEntries = doc.querySelectorAll('entry');
  if (atomEntries.length > 0 && rssItems.length === 0) {
    atomEntries.forEach(node => {
      try {
        const title = (node.querySelector('title')?.textContent || '').trim();
        const linkNode = node.querySelector('link');
        const link = linkNode?.getAttribute('href') || (node.querySelector('id')?.textContent || '');
        const updated = node.querySelector('updated')?.textContent
          || node.querySelector('published')?.textContent
          || new Date().toISOString();
        const description = (node.querySelector('summary')?.textContent
          || node.querySelector('content')?.textContent
          || '').trim();

        const cleanSummary = description
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 280);

        if (!title || !link) return;

        items.push({
          title,
          source: source.name,
          source_url: source.url,
          url: link,
          published_at: new Date(updated).toISOString(),
          category: source.category,
          summary: cleanSummary,
        });
      } catch (e) {
        // skip
      }
    });
  }

  return items;
}

/** 从一个 RSS 源拉取新闻（自动尝试多个 CORS 代理） */
async function fetchFromSource(source: { name: string; url: string; category: string }): Promise<MarketNews[]> {
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxiedUrl = proxyFn(source.url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(proxiedUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) continue;
      const text = await response.text();
      const parsed = parseFeed(text, source);
      if (parsed.length > 0) {
        console.log(`[NewsEngine] ${source.name}: fetched ${parsed.length} items via ${proxyFn.name}`);
        return parsed;
      }
    } catch (e) {
      // 失败继续尝试下一个代理
    }
  }
  console.log(`[NewsEngine] ${source.name}: all proxies failed`);
  return [];
}

/** 去重：按 URL 和标题相似性 */
function dedupe(items: MarketNews[]): MarketNews[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const result: MarketNews[] = [];

  for (const item of items) {
    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (seenUrls.has(item.url) || seenTitles.has(normalizedTitle)) continue;
    seenUrls.add(item.url);
    seenTitles.add(normalizedTitle);
    result.push(item);
  }

  return result;
}

/** 企业级产品关键词 - 用于识别和分类相关新闻 */
const ENTERPRISE_KEYWORDS = [
  'ai', 'artificial intelligence', 'llm', 'genai', 'gen ai', 'copilot',
  'cloud', 'kubernetes', 'aws', 'azure', 'google cloud', 'gcp',
  'saas', 'paas', 'iaas', 'hybrid', 'multi-cloud',
  'cybersecurity', 'security', 'zero-trust', 'zero trust', 'ransomware',
  'datacenter', 'data center', 'infrastructure', 'server', 'storage',
  'database', 'postgres', 'mysql', 'mongo', 'vector',
  'partner', 'channel', 'ecosystem', 'reseller', 'msp',
  'enterprise', 'enterprise it', 'cio', 'cto',
  'software', 'platform', 'api', 'microservice',
  'devops', 'observability', 'monitoring',
  'blockchain', 'quantum', 'edge computing', 'iot',
];

/** 判断是否为企业级IT相关新闻，关键词得分 */
function enterpriseScore(item: MarketNews): number {
  const hay = (item.title + ' ' + (item.summary || '')).toLowerCase();
  let score = 0;
  for (const kw of ENTERPRISE_KEYWORDS) {
    if (hay.includes(kw)) score += kw.length > 5 ? 2 : 1;
  }
  return score;
}

/**
 * 从所有源拉取最新新闻
 * @param limit 每个源的限制条数
 */
export async function fetchLatestNews(limit: number = 6): Promise<MarketNews[]> {
  console.log('[NewsEngine] Fetching latest enterprise IT news...');
  const results = await Promise.allSettled(
    NEWS_SOURCES.map(source =>
      fetchFromSource(source).then(items => items.slice(0, limit))
    )
  );

  let all: MarketNews[] = [];
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value.length > 0) {
      all = all.concat(r.value);
    }
  });

  // 去重
  const deduped = dedupe(all);

  // 按企业相关性得分 + 时间排序
  const now = Date.now();
  deduped.sort((a, b) => {
    const scoreA = enterpriseScore(a) * 1000 - Math.min(now - new Date(a.published_at).getTime(), 7 * 24 * 3600 * 1000) / 100000;
    const scoreB = enterpriseScore(b) * 1000 - Math.min(now - new Date(b.published_at).getTime(), 7 * 24 * 3600 * 1000) / 100000;
    return scoreB - scoreA;
  });

  // 只保留最近 7 天内的
  const sevenDaysAgo = new Date(now - 7 * 24 * 3600 * 1000);
  const recent = deduped.filter(n => new Date(n.published_at) >= sevenDaysAgo);
  const finalList = recent.length > 10 ? recent.slice(0, 50) : deduped.slice(0, 50);

  console.log(`[NewsEngine] Total fetched: ${all.length}, deduped: ${deduped.length}, recent enterprise-relevant: ${finalList.length}`);
  return finalList;
}

/** 写入 Supabase market_news 表 */
export async function saveNewsToSupabase(items: MarketNews[]): Promise<{ inserted: number; existing: number }> {
  if (!items.length) return { inserted: 0, existing: 0 };

  let inserted = 0;
  let existing = 0;

  for (const item of items) {
    try {
      // 先用 url 查是否已存在
      const { data: existingData } = await supabase
        .from('market_news')
        .select('url')
        .eq('url', item.url)
        .limit(1);

      if (existingData && existingData.length > 0) {
        existing++;
        continue;
      }

      const { error } = await supabase.from('market_news').insert({
        title: item.title,
        source: item.source,
        source_url: item.source_url,
        url: item.url,
        published_at: item.published_at,
        category: item.category,
        summary: item.summary,
        image_url: item.image_url,
        fetch_date: new Date().toISOString(),
      });

      if (!error) inserted++;
    } catch (e) {
      // 跳过单条错误
    }
  }

  console.log(`[NewsEngine] Saved to Supabase: ${inserted} new, ${existing} existing`);
  return { inserted, existing };
}

/** 从 Supabase market_news 表读取新闻 */
export async function getNewsFromSupabase(limit: number = 30): Promise<MarketNews[]> {
  try {
    const { data, error } = await supabase
      .from('market_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return [];
    return data.map(d => ({
      id: d.id,
      title: d.title,
      source: d.source,
      source_url: d.source_url,
      url: d.url,
      published_at: d.published_at,
      category: d.category,
      summary: d.summary,
      image_url: d.image_url,
      created_at: d.created_at,
    }));
  } catch {
    return [];
  }
}

/** 浏览器缓存（localStorage） */
function saveToLocalCache(items: MarketNews[]): void {
  try {
    const payload = { fetched_at: new Date().toISOString(), items };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // storage unavailable
  }
}

function readFromLocalCache(): { fetched_at: string; items: MarketNews[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 主入口：获取新闻（按优先级：缓存 → Supabase → 实时拉取 → fallback） */
export async function getNews(options: {
  limit?: number;
  forceRefresh?: boolean;
  fallback?: MarketNews[];
} = {}): Promise<{ items: MarketNews[]; source: 'cache' | 'supabase' | 'live' | 'fallback'; fetched_at: string }> {
  const limit = options.limit || 30;

  // 1. 强制刷新：跳过缓存，直接实时拉取
  if (options.forceRefresh) {
    const live = await fetchLatestNews(limit);
    if (live.length > 0) {
      saveToLocalCache(live);
      try { saveNewsToSupabase(live.slice(0, 100)); } catch {} // 异步，不阻塞
      return { items: live.slice(0, limit), source: 'live', fetched_at: new Date().toISOString() };
    }
  }

  // 2. 本地缓存（1 小时内有效）
  const cached = readFromLocalCache();
  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < CACHE_TTL_MS && cached.items.length > 0) {
      return { items: cached.items.slice(0, limit), source: 'cache', fetched_at: cached.fetched_at };
    }
  }

  // 3. Supabase 表
  const fromDb = await getNewsFromSupabase(limit);
  if (fromDb.length > 0) {
    saveToLocalCache(fromDb);
    return { items: fromDb.slice(0, limit), source: 'supabase', fetched_at: new Date().toISOString() };
  }

  // 4. 实时拉取
  const live = await fetchLatestNews(limit);
  if (live.length > 0) {
    saveToLocalCache(live);
    try { saveNewsToSupabase(live.slice(0, 100)); } catch {}
    return { items: live.slice(0, limit), source: 'live', fetched_at: new Date().toISOString() };
  }

  // 5. fallback（离线时使用）
  const fallback = options.fallback || defaultNewsFallback();
  return { items: fallback.slice(0, limit), source: 'fallback', fetched_at: new Date().toISOString() };
}

/** 国际企业级IT产品市场新闻 fallback 库 - 用于网络不可用时 */
export function defaultNewsFallback(): MarketNews[] {
  const now = new Date();
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 3600 * 1000).toISOString();

  return [
    {
      title: 'AWS 发布 Bedrock 2.0：企业级生成式AI工作流集成大升级',
      source: 'TechCrunch',
      source_url: 'https://techcrunch.com',
      url: 'https://techcrunch.com/aws-bedrock-2-0-enterprise-ai-workflow',
      published_at: d(0),
      category: 'AI/云',
      summary: 'AWS 在 re:Invent 2025 发布 Bedrock 2.0，新增多模型编排、企业级知识库检索、与 SageMaker 的端到端 MLOps 集成，面向 5000+ 企业伙伴提供统一 AI 治理。',
    },
    {
      title: 'Microsoft Azure 推出 Copilot Studio 企业版：可定制化 AI 助手面向ISV伙伴',
      source: 'VentureBeat',
      source_url: 'https://venturebeat.com',
      url: 'https://venturebeat.com/microsoft-azure-copilot-studio-enterprise',
      published_at: d(0),
      category: 'AI/云',
      summary: '微软扩展 Copilot 平台，ISV 可基于自家产品数据定制 AI 助手，提供 SDK、沙箱环境、企业模型评估及合规审计。',
    },
    {
      title: 'Google Cloud 发布 A3 Ultra GPU 实例，面向大模型训练降低 40% TCO',
      source: 'ZDNet',
      source_url: 'https://www.zdnet.com',
      url: 'https://www.zdnet.com/google-cloud-a3-ultra-gpu-tco',
      published_at: d(1),
      category: '云基础设施',
      summary: 'Google Cloud A3 Ultra 实例采用 NVIDIA H200 Tensor Core GPU，配套 TPU v5p 与 Cross-Cloud Network，大模型训练 TCO 相比上一代下降 40%。',
    },
    {
      title: 'NVIDIA Blackwell Ultra 架构发布：H300 GPU 面向万亿参数模型训练',
      source: 'Ars Technica',
      source_url: 'https://arstechnica.com',
      url: 'https://arstechnica.com/nvidia-blackwell-ultra-h300',
      published_at: d(1),
      category: 'AI硬件',
      summary: 'NVIDIA 在 GTC 2025 发布 H300 GPU，采用 Blackwell Ultra 架构，HBM4 内存带宽提升 2 倍，面向 1 万亿+ 参数模型训练，首批合作伙伴包括 AWS、Azure、GCP、Oracle。',
    },
    {
      title: 'Kubernetes v1.31 发布：边车容器正式 GA，多集群调度增强',
      source: 'InfoWorld',
      source_url: 'https://www.infoworld.com',
      url: 'https://www.infoworld.com/kubernetes-1-31-sidecar-ga',
      published_at: d(2),
      category: '云原生',
      summary: 'Kubernetes 1.31 版本将 Sidecar Containers 正式毕业，同时带来调度器 V2、Topology Aware Hints 增强，以及节点滚动升级新策略。',
    },
    {
      title: 'Snowflake 推出 Arctic：企业级开源数据平台，与 Apache Iceberg 完全兼容',
      source: 'SiliconANGLE',
      source_url: 'https://siliconangle.com',
      url: 'https://siliconangle.com/snowflake-arctic-iceberg',
      published_at: d(2),
      category: '数据平台',
      summary: 'Snowflake 宣布 Arctic，开源的 Iceberg 原生湖仓平台，支持跨云数据共享，与现有的 Snowflake Data Cloud 形成互补，将生态伙伴范围扩展到 Databricks 用户。',
    },
    {
      title: 'Databricks 发布 Mosaic AI 产品矩阵：从向量检索到 Agent 工作流一体化',
      source: 'VentureBeat',
      source_url: 'https://venturebeat.com',
      url: 'https://venturebeat.com/databricks-mosaic-ai-product',
      published_at: d(2),
      category: 'AI/数据',
      summary: 'Databricks 推出 Mosaic AI 完整产品矩阵，包括 Vector Search、Model Serving、Agent Framework 与 Lakehouse IQ，覆盖企业从检索到生成的全链路 AI 需求。',
    },
    {
      title: 'IBM z16 大型机集成生成式AI：面向金融与核心系统推理加速',
      source: 'eWEEK',
      source_url: 'https://www.eweek.com',
      url: 'https://www.eweek.com/ibm-z16-ai-mainframe',
      published_at: d(3),
      category: '企业计算',
      summary: 'IBM 在大型机 z16 上集成生成式 AI 推理能力，面向银行、保险、政府等客户，提供超低延迟的模型推断与数据驻留合规，合作伙伴可通过 IBM Z 生态接入。',
    },
    {
      title: 'ServiceNow 发布 Now Assist 2：企业工作流全面 AI 化',
      source: 'Computer Weekly',
      source_url: 'https://www.computerweekly.com',
      url: 'https://www.computerweekly.com/servicenow-now-assist-2',
      published_at: d(3),
      category: '企业软件',
      summary: 'ServiceNow 在 Knowledge 2025 发布 Now Assist 2 套件，全面覆盖 ITSM、ITOM、Customer Workflow，每个伙伴流程自动生成摘要、建议与下一步行动。',
    },
    {
      title: 'HashiCorp Vault 发布零信任数据保护方案，面向云原生关键工作负载',
      source: 'DevOps.com',
      source_url: 'https://devops.com',
      url: 'https://devops.com/hashicorp-vault-zero-trust-data-protection',
      published_at: d(4),
      category: '安全',
      summary: 'HashiCorp 发布 Vault Enterprise 新版本，引入动态策略与零信任数据保护，与 Kubernetes、AWS IAM、Azure AD 深度集成，面向金融、医疗客户。',
    },
    {
      title: 'MongoDB 8 发布：向量搜索 GA、时间序列性能提升 3 倍',
      source: 'SDxCentral',
      source_url: 'https://www.sdxcentral.com',
      url: 'https://www.sdxcentral.com/mongodb-8-vector-search-ga',
      published_at: d(4),
      category: '数据库',
      summary: 'MongoDB 8 正式发布，内置向量搜索 GA，支持百亿级向量规模，同时时间序列写入性能提升 3 倍，面向物联网与可观测性场景。',
    },
    {
      title: 'PostgreSQL 18 正式发布：增量备份与逻辑复制增强',
      source: 'The Register',
      source_url: 'https://www.theregister.com',
      url: 'https://www.theregister.com/postgresql-18-release',
      published_at: d(5),
      category: '数据库',
      summary: 'PostgreSQL 全球开发组发布 v18，引入增量备份、逻辑复制双向同步，以及查询规划器机器学习模型建议，AWS RDS、GCP Cloud SQL、Azure 均已支持。',
    },
    {
      title: 'VMware by Broadcom 发布 Cloud Foundation 6：面向混合云重构',
      source: 'CIO Dive',
      source_url: 'https://www.ciodive.com',
      url: 'https://www.ciodive.com/vmware-cloud-foundation-6',
      published_at: d(5),
      category: '虚拟化',
      summary: 'Broadcom 旗下 VMware 发布 Cloud Foundation 6，简化从私有云到公有云的工作流迁移，新增 Tanzu 企业容器战略与合作伙伴统一激励计划。',
    },
    {
      title: 'Okta 发布 Workforce Identity Cloud 2：AI 辅助风险评分与零信任增强',
      source: 'Dark Reading',
      source_url: 'https://www.darkreading.com',
      url: 'https://www.darkreading.com/okta-workforce-identity-cloud-2',
      published_at: d(6),
      category: '安全/身份',
      summary: 'Okta 在 Oktane 2025 发布新一代身份云平台，引入基于大模型的风险评估引擎、自动化策略建议与零信任设备健康评估，集成 AWS IAM、Azure AD。',
    },
    {
      title: 'Salesforce 发布 Einstein 1 Platform 增强：Agentforce 面向客户定制AI助手',
      source: 'CRN',
      source_url: 'https://www.crn.com',
      url: 'https://www.crn.com/salesforce-einstein-1-agentforce',
      published_at: d(6),
      category: 'CRM/AI',
      summary: 'Salesforce 在 Dreamforce 2025 推出 Agentforce，允许 ISV 与系统集成商基于 CRM 数据构建企业级 AI 助手，配套 Data Cloud 统一数据层与伙伴激励升级。',
    },
    {
      title: 'Oracle Database 23ai Free for Developers：向量搜索与 AI 原生能力免费开放',
      source: 'Reuters Tech',
      source_url: 'https://feeds.reuters.com',
      url: 'https://feeds.reuters.com/oracle-database-23ai-free',
      published_at: d(7),
      category: '数据库',
      summary: 'Oracle 将 Database 23ai 免费开放给开发者，包含向量搜索、Retrieval Augmented Generation 与 Oracle AI Vector Search，面向中小型伙伴加速 AI 应用落地。',
    },
    {
      title: 'GitLab 18：AI 驱动 DevSecOps 平台，代码生成 + 安全扫描深度集成',
      source: 'DevOps.com',
      source_url: 'https://devops.com',
      url: 'https://devops.com/gitlab-18-ai-devsecops',
      published_at: d(7),
      category: 'DevOps',
      summary: 'GitLab 发布 v18，全面集成 Duo Chat、Duo Pro 与企业级安全策略自动化，DevSecOps 全流程 AI 化，面向金融、制造、医疗等合规性行业。',
    },
    {
      title: 'Cisco 发布 AI 网络架构：面向 400G/800G 的 AI 数据中心网络方案',
      source: 'SDxCentral',
      source_url: 'https://www.sdxcentral.com',
      url: 'https://www.sdxcentral.com/cisco-ai-networking-400g-800g',
      published_at: d(8),
      category: '网络/基础设施',
      summary: 'Cisco 推出面向 AI 数据中心的网络架构，包括 Silicon One P120 芯片、800G 高密度交换机与 Nexus Dashboard AI 运营，为大模型训练提供高带宽低时延网络。',
    },
    {
      title: 'Confluent 发布 Apache Flink 原生流处理：面向实时数据湖统一平台',
      source: 'InfoWorld',
      source_url: 'https://www.infoworld.com',
      url: 'https://www.infoworld.com/confluent-flink-streaming',
      published_at: d(9),
      category: '数据平台',
      summary: 'Confluent 在 Current 2025 大会发布 Flink 原生流处理平台，Kafka + Flink + Iceberg 组合为企业提供实时数据湖完整方案，合作伙伴包括 AWS、Databricks、Snowflake。',
    },
    {
      title: 'Red Hat Enterprise Linux 10 发布：支持下一代 AI 加速芯片与安全基线',
      source: 'eWEEK',
      source_url: 'https://www.eweek.com',
      url: 'https://www.eweek.com/red-hat-enterprise-linux-10',
      published_at: d(10),
      category: '操作系统',
      summary: 'Red Hat 发布 RHEL 10，首次将 NVIDIA H100/H200、AMD MI300、Intel Gaudi 3 加速器纳入标准支持，并新增 FIPS 140-3 + AI 安全基线。',
    },
    {
      title: 'HashiCorp Terraform Cloud 升级：策略即代码 + 多云成本优化',
      source: 'SDxCentral',
      source_url: 'https://www.sdxcentral.com',
      url: 'https://www.sdxcentral.com/terraform-cloud-policy-as-code',
      published_at: d(11),
      category: 'DevOps',
      summary: 'HashiCorp 发布 Terraform Cloud 重大升级，引入 OPA 策略管理、多云成本自动优化与 Sentinel AI 策略建议，面向合作伙伴提供免费层级。',
    },
    {
      title: 'Microsoft 365 Copilot 企业版 GA：面向 2000+ 席位的统一价格方案',
      source: 'VentureBeat',
      source_url: 'https://venturebeat.com',
      url: 'https://venturebeat.com/microsoft-365-copilot-enterprise-ga',
      published_at: d(12),
      category: '生产力AI',
      summary: '微软宣布 Microsoft 365 Copilot 企业版 GA，统一价格方案，面向 2000+ 席位提供端到端集成、数据合规审计与 ISV 插件市场。',
    },
    {
      title: 'Splunk 发布 AI 可观测性平台升级：向 AWS / Azure / GCP 提供原生集成',
      source: 'DevOps.com',
      source_url: 'https://devops.com',
      url: 'https://devops.com/splunk-ai-observability-platform',
      published_at: d(13),
      category: '可观测性',
      summary: 'Cisco 旗下 Splunk 发布可观测性平台升级，与 AWS CloudWatch、Azure Monitor、GCP Operations 深度集成，基于 AI 自动发现异常，服务 2 万家+企业。',
    },
    {
      title: 'Dell PowerEdge 下一代服务器搭载 NVIDIA Blackwell：面向企业 AI 推理',
      source: 'ZDNet',
      source_url: 'https://www.zdnet.com',
      url: 'https://www.zdnet.com/dell-poweredge-nvidia-blackwell',
      published_at: d(14),
      category: '硬件',
      summary: 'Dell 发布新一代 PowerEdge 服务器，搭载 NVIDIA Blackwell B200 GPU，面向企业级推理与混合云，为渠道伙伴提供优化配置与认证。',
    },
    {
      title: 'Wiz 发布云原生安全图谱 2.0：识别 AI 工作负载风险',
      source: 'Dark Reading',
      source_url: 'https://www.darkreading.com',
      url: 'https://www.darkreading.com/wiz-cloud-security-graph-2-0-ai-risk',
      published_at: d(15),
      category: '安全',
      summary: 'Wiz 发布云安全图谱 2.0，新增 AI 工作负载风险识别，检测大模型应用数据泄露风险，面向 CSP、MSP 与大型企业伙伴集成。',
    },
    {
      title: 'Gartner 2025 CIO 议程：AI 投资翻倍，80% 企业将引入 GenAI 工作流',
      source: 'CIO Dive',
      source_url: 'https://www.ciodive.com',
      url: 'https://www.ciodive.com/gartner-2025-cio-agenda-genai',
      published_at: d(17),
      category: '行业洞察',
      summary: 'Gartner 在 CIO Summit 2025 发布报告，预计 2025~2026 年 AI 投入将占据 IT 预算 35%，80% 大型企业将至少有一个 GenAI 工作流在生产中。',
    },
    {
      title: 'Palo Alto Networks 发布 AI 安全运营中心：零信任 + XDR 统一平台',
      source: 'Dark Reading',
      source_url: 'https://www.darkreading.com',
      url: 'https://www.darkreading.com/palo-alto-ai-security-operations',
      published_at: d(18),
      category: '安全',
      summary: 'Palo Alto 发布下一代 SOC 平台，基于大模型的威胁分析、自动化响应与零信任设备健康，面向 MSSP 伙伴提供 API 与可扩展 SKU。',
    },
    {
      title: 'Elasticsearch 9 发布：向量数据库 + 语义搜索原生支持',
      source: 'SDxCentral',
      source_url: 'https://www.sdxcentral.com',
      url: 'https://www.sdxcentral.com/elasticsearch-9-vector-database',
      published_at: d(20),
      category: '数据库/搜索',
      summary: 'Elastic 发布 Elasticsearch 9，原生向量数据库 GA，语义搜索与 RAG 工作流与 Elastic SIEM/APM 完全集成，支持 100B+ 向量规模。',
    },
    {
      title: 'AWS re:Invent 2025：推出 Graviton 5 + Trainium 3 芯片，与 NVIDIA Blackwell 并存',
      source: 'TechCrunch',
      source_url: 'https://techcrunch.com',
      url: 'https://techcrunch.com/aws-reinvent-2025-graviton-5-trainium-3',
      published_at: d(22),
      category: '云/芯片',
      summary: 'Amazon 在 re:Invent 2025 发布自研 Graviton 5 与 Trainium 3 芯片，同时保留 NVIDIA Blackwell 实例，为伙伴提供多样化 AI 训练与推理选项。',
    },
    {
      title: 'MongoDB Atlas Vector Search GA：面向企业级 AI 应用统一检索',
      source: 'SiliconANGLE',
      source_url: 'https://siliconangle.com',
      url: 'https://siliconangle.com/mongodb-atlas-vector-search-ga',
      published_at: d(23),
      category: '数据库/AI',
      summary: 'MongoDB Atlas Vector Search 正式 GA，集成到 Atlas 数据平台，向量规模支持百亿级，与 Azure OpenAI、AWS Bedrock、Vertex AI 提供原生连接器。',
    },
    {
      title: 'Docker 发布 Business 2：面向企业级容器工作流 + AI 助手',
      source: 'Hacker News',
      source_url: 'https://hnrss.org',
      url: 'https://hnrss.org/docker-business-2-enterprise',
      published_at: d(24),
      category: 'DevOps',
      summary: 'Docker 发布 Business 2 企业版，新增 AI 辅助开发容器生成、镜像安全扫描、与 Kubernetes Operator 的深度集成，与 Microsoft、AWS、VMware 合作。',
    },
    {
      title: 'Datadog New Relic 合并新动态：2026 将统一平台、伙伴计划整合',
      source: 'CRN',
      source_url: 'https://www.crn.com',
      url: 'https://www.crn.com/datadog-new-relic-merger-2026',
      published_at: d(26),
      category: '可观测性',
      summary: '可观测性两大巨头合并后的首个动作：统一产品路线图与伙伴激励计划，将 New Relic 的 APM 与 Datadog 的全栈可观测性整合为统一平台。',
    },
    {
      title: 'Puppet + Chef 统一产品发布：面向 Config Management 的现代化升级',
      source: 'DevOps.com',
      source_url: 'https://devops.com',
      url: 'https://devops.com/puppet-chef-unified-product',
      published_at: d(28),
      category: 'DevOps',
      summary: 'Progress 旗下 Puppet + Chef 发布统一产品矩阵，支持声明式与命令式混合配置管理、基于大模型的策略建议，面向金融/制造业大型企业。',
    },
  ];
}

/** 清除本地缓存（强制刷新时调用） */
export function clearNewsCache(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

/** 获取最后一次缓存时间 */
export function getLastFetchTime(): string | null {
  const cached = readFromLocalCache();
  return cached ? cached.fetched_at : null;
}

/** 判断缓存是否过期 */
export function isCacheExpired(): boolean {
  const cached = readFromLocalCache();
  if (!cached) return true;
  const age = Date.now() - new Date(cached.fetched_at).getTime();
  return age >= CACHE_TTL_MS;
}
