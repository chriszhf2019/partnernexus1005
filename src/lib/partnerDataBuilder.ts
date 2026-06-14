import type { Partner, PartnerDetails, PartnerContact } from '../types';

// ── Data source indicators ──────────────────────────
// Fields that come from real Supabase data are used directly.
// Fields without DB data show 0 / empty — we NEVER generate fake numbers.
// This ensures users see honest "暂无数据" instead of plausible-but-false data.

function emptyPipeline() {
  return { registered: 0, solution: 0, commercial: 0, won: 0 };
}

function emptyMDF() {
  return { total: 0, used: 0, remaining: 0, activities: [] as any[] };
}

// Auto-build org structure from real contact titles
function buildOrgFromContacts(contacts: PartnerContact[]) {
  if (!contacts || contacts.length === 0) return [];
  const levels: Record<string, { keywords: string[]; role: string }> = {
    executive: { keywords: ['总经理','总裁','CEO','董事长','创始人','owner','founder','president','director','合伙人'], role: '决策层' },
    management: { keywords: ['总监','经理','manager','director','supervisor','主管','lead','head'], role: '管理层' },
    sales: { keywords: ['销售','sales','客户','account','渠道','channel','bd','business development'], role: '销售' },
    technical: { keywords: ['工程师','engineer','技术','technical','开发','dev','架构','architect','运维','support','it'], role: '技术' },
    business: { keywords: ['商务','行政','admin','hr','人事','财务','finance','法务','legal','采购','purchasing'], role: '商务' },
  };
  const groups: Record<string, any[]> = {};
  const seen = new Set<string>();

  for (const c of contacts) {
    const key = `${c.lastName}${c.firstName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const title = (c.title || '').toLowerCase();
    let role = '其他';
    for (const [level, cfg] of Object.entries(levels)) {
      if (cfg.keywords.some(k => title.includes(k))) { role = cfg.role; break; }
    }
    if (!groups[role]) groups[role] = [];
    const name = [c.lastName, c.firstName].filter(Boolean).join('') || c.email || '-';
    groups[role].push({ role, name, department: c.title || '', note: c.email || c.phone || '' });
  }

  const result: any[] = [];
  const order = ['决策层', '管理层', '销售', '技术', '商务', '其他'];
  for (const role of order) {
    if (groups[role]) result.push(...groups[role]);
  }
  return result;
}

// ── Main builder ─────────────────────────────────────
// Build PartnerDetails from a real Partner record.
// ALL values come from the database. When DB has no data, we use 0/empty —
// never invented numbers. The UI shows "暂无数据" for empty fields.

export function buildPartnerDetails(partner: Partner): PartnerDetails {
  const contacts = partner.contacts || [];
  const contactCount = contacts.length;

  // years: from DB or startDate
  let years = partner.years || 0;
  if (!years && partner.startDate) {
    const d = new Date(partner.startDate);
    if (!isNaN(d.getTime())) years = new Date().getFullYear() - d.getFullYear();
  }
  years = Math.max(0, years);

  // winRate: from DB, 0 if no data (no fake defaults)
  const winRate = partner.winRate || 0;

  // Pipeline: ONLY from DB columns — never generate random numbers
  const pipeline = {
    registered: Number((partner as any).pipeline_registered || 0),
    solution: Number((partner as any).pipeline_solution || 0),
    commercial: Number((partner as any).pipeline_commercial || 0),
    won: Number((partner as any).pipeline_won || 0),
  };

  // MDF: ONLY from DB columns — never generate fake budgets
  const mdfTotal = Number((partner as any).mdf_total || 0);
  const mdfUsed = Number((partner as any).mdf_used || 0);
  const mdf = {
    total: mdfTotal,
    used: mdfUsed,
    remaining: mdfTotal - mdfUsed,
    activities: [] as any[],
  };

  // Enablement: ONLY from real DB data (partner_certifications aggregation).
  // No more fake formulas derived from contact count.
  const certifiedEngineers = Number((partner as any).certified_engineers || 0);
  const specialists = Number((partner as any).specialists_count || 0);
  const expiryRiskCount = Number((partner as any).expiry_risk_count || 0);
  const expiryDays = Number((partner as any).expiry_days || 0);

  // Follow-ups: derived from real partner status indicators
  const followUps: any[] = [];
  if (expiryRiskCount > 0) {
    followUps.push({
      id: `${partner.id}-fu-cert`, title: `安排 ${expiryRiskCount} 位工程师完成认证续期`,
      status: 'In Progress', priority: 'High',
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      owner: partner.manager || '渠道经理', category: 'Enablement',
    });
  }
  if (mdfTotal > 0 && mdfUsed < mdfTotal * 0.5) {
    followUps.push({
      id: `${partner.id}-fu-mdf`, title: `提交 MDF 使用方案（剩余 ¥${mdf.remaining.toLocaleString()}）`,
      status: 'Pending', priority: 'Medium',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      owner: partner.manager || '渠道经理', category: 'Marketing',
    });
  }
  if (partner.status === 'Prospective') {
    followUps.push({
      id: `${partner.id}-fu-new`, title: `审核并批复「${partner.name}」的合作申请`,
      status: 'Pending', priority: 'High',
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      owner: partner.manager || '渠道经理', category: 'Operations',
    });
  }

  // Top projects & milestones: ONLY from DB — never generate fake
  const topProjects = (partner as any).top_projects || [];
  const milestones = (partner as any).milestones || [];

  // Organization: from DB, or auto-built from real contacts
  const orgStructure = (partner as any).org_structure && (partner as any).org_structure.length > 0
    ? (partner as any).org_structure
    : buildOrgFromContacts(contacts);

  // All insight-layer data: from DB only
  const tierHistory = (partner as any).tier_history || [];
  const customerPortfolio = (partner as any).customer_portfolio || [];
  const ecosystemPartnersData = (partner as any).ecosystem_partners || [];
  const subPartnersData = (partner as any).sub_partners || [];
  const strategyRecommendations = (partner as any).strategy_recommendations || [];
  const qbrRecords = (partner as any).qbr_records || [];
  const cooperationPlans = (partner as any).cooperation_plans || [];
  const activitiesLog = (partner as any).activities_log || [];
  const dbTimelineEvents = (partner as any).timelineEvents || [];

  // Build timeline events from REAL partner data
  // Each event maps to the settings "合作伙伴时间线标签" checkboxes
  const generatedTimeline: any[] = [];
  const today = new Date().toISOString().split('T')[0];

  // 级别排序映射：用于比较级别升降（而非字符串比较）
  const TIER_RANK: Record<string, number> = {
    'Registered': 0, 'Standard': 0,
    'Silver': 1,
    'Gold': 2,
    'Premier': 3,
    'Platinum': 4,
    'Diamond': 5,
  };
  const compareTier = (a: string, b: string): number =>
    (TIER_RANK[a] ?? -1) - (TIER_RANK[b] ?? -1);

  // 1. 合作伙伴批复 (approved) — always the first milestone
  if (partner.startDate) {
    generatedTimeline.push({
      id: `${partner.id}-tl-approved`,
      type: 'approved',
      title: `${partner.name} 正式成为合作伙伴`,
      description: `${partner.tier} 级别合作伙伴批复通过`,
      date: partner.startDate,
      operator: partner.manager || '系统管理员',
      metadata: { toTier: partner.tier },
    });
  } else if (partner.status === 'Prospective') {
    // Partner application submitted but not yet approved
    generatedTimeline.push({
      id: `${partner.id}-tl-applied`,
      type: 'approved',
      title: `${partner.name} 提交合作申请`,
      description: '等待渠道经理审核批复',
      date: partner.applicationDate || today,
      operator: partner.manager || '系统管理员',
      metadata: { toTier: partner.tier },
    });
  }

  // 2. 级别提升/降级 (tier_upgrade / tier_downgrade) — from tierHistory
  const tierHistoryData = (partner as any).tierHistory || [];
  if (Array.isArray(tierHistoryData) && tierHistoryData.length > 0) {
    tierHistoryData.forEach((th: any, i: number) => {
      if (th.fromTier && th.toTier && th.date) {
        generatedTimeline.push({
          id: `${partner.id}-tl-tier${i}`,
          type: compareTier(th.toTier, th.fromTier) > 0 ? 'tier_upgrade' : 'tier_downgrade',
          title: compareTier(th.toTier, th.fromTier) > 0
            ? `${th.fromTier} → ${th.toTier} 级别提升`
            : `${th.fromTier} → ${th.toTier} 级别调整`,
          description: th.reason || '',
          date: th.date,
          operator: th.operator || '系统',
          metadata: { fromTier: th.fromTier, toTier: th.toTier },
        });
      }
    });
  } else if (partner.prevTier && partner.prevTier !== partner.tier && partner.tier !== 'Registered') {
    // Auto-detect tier change from prevTier → current tier
    generatedTimeline.push({
      id: `${partner.id}-tl-autotier`,
      type: 'tier_upgrade',
      title: `${partner.prevTier} → ${partner.tier} 级别提升`,
      date: partner.startDate || today,
      operator: '系统',
      metadata: { fromTier: partner.prevTier, toTier: partner.tier },
    });
  }

  // 3. Merge with DB-stored events (DB takes precedence by date)
  const dbEventIds = new Set(dbTimelineEvents.map((e: any) => e.id));
  const mergedTimeline = [
    ...dbTimelineEvents,
    ...generatedTimeline.filter(e => !dbEventIds.has(e.id)),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    ...partner,
    winRate,
    startDate: partner.startDate || '',
    years,
    pipeline,
    mdf,
    enablement: { certifiedEngineers, specialists, expiryRiskCount, expiryDays },
    followUps,
    topProjects,
    orgStructure,
    milestones,
    qbrRecords,
    cooperationPlans,
    activitiesLog,
    tierHistory,
    customerPortfolio,
    ecosystemPartners: ecosystemPartnersData,
    subPartners: subPartnersData,
    strategyRecommendations,
    timelineEvents: mergedTimeline,
  };
}
