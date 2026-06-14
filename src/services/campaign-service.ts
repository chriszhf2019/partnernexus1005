import { supabase } from '../lib/supabase';
import type {
  MarketingCampaign,
  CampaignStatus,
  CampaignPhase,
  CampaignAttendee,
  CampaignRegistration,
  CampaignPointRecord,
  CampaignEvaluation,
  CampaignMiniAppConfig,
  CampaignInvitation,
  CampaignPhaseTask,
  CampaignFeedback,
  CampaignQuestion,
  QuarterlyCampaignStats,
  CampaignDealLink,
  AnnualMarketingBudget,
} from '../types';

// 辅助函数：映射数据库行到 MarketingCampaign
function mapCampaign(row: any): MarketingCampaign {
  return {
    id: row.id,
    name: row.name || '',
    type: row.type || 'vendor_self',
    hostType: row.host_type || 'vendor',
    year: row.year || new Date().getFullYear(),
    quarter: row.quarter || 'Q1',
    category: row.category,
    region: row.region,
    city: row.city,
    
    // 预算信息
    budget: Number(row.budget || 0),
    actualSpend: Number(row.actual_spend || 0),
    approvedAmount: Number(row.approved_amount || 0),
    
    // 时间信息
    plannedStartDate: row.planned_start_date,
    plannedEndDate: row.planned_end_date,
    actualStartDate: row.actual_start_date,
    actualEndDate: row.actual_end_date,
    
    // 参会者信息
    expectedAttendees: Number(row.expected_attendees || 0),
    actualAttendees: Number(row.actual_attendees || 0),
    registeredCount: Number(row.registered_count || 0),
    checkedInCount: Number(row.checked_in_count || 0),
    
    // 状态和阶段
    status: row.status || 'draft',
    currentPhase: row.current_phase || 'planning',
    phaseRecords: row.phase_records,
    
    // 关联信息
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    responsiblePerson: row.responsible_person,
    
    // 描述和目标
    description: row.description,
    goals: row.goals || [],
    expectedOutputs: row.expected_outputs,
    
    // 商机转化
    leadsGenerated: Number(row.leads_generated || 0),
    dealsCreated: Number(row.deals_created || 0),
    dealsValue: Number(row.deals_value || 0),
    
    // 时间戳
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    hasEvaluation: row.has_evaluation || false,
  };
}

// 辅助函数：映射数据库行到 CampaignAttendee
function mapAttendee(row: any): CampaignAttendee {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name || '',
    company: row.company || '',
    position: row.position,
    phone: row.phone,
    email: row.email,
    source: row.source || 'registration',
    attendeeType: row.attendee_type || 'prospect',
    registeredAt: row.registered_at,
    checkedInAt: row.checked_in_at,
    checkedIn: row.checked_in || false,
    totalPoints: Number(row.total_points || 0),
    status: row.status || 'registered',
    interestTopics: row.interest_topics || [],
    followUpStatus: row.follow_up_status,
    dealCreated: row.deal_created || false,
    dealId: row.deal_id,
  };
}

// 辅助函数：映射数据库行到 CampaignRegistration
function mapRegistration(row: any): CampaignRegistration {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    attendeeId: row.attendee_id,
    attendeeName: row.attendee_name || '',
    attendeeCompany: row.attendee_company || '',
    attendeePhone: row.attendee_phone || '',
    attendeeEmail: row.attendee_email,
    registrationChannel: row.registration_channel,
    registrationTime: row.registration_time,
    status: row.status || 'pending',
    source: row.source,
  };
}

// 辅助函数：映射数据库行到 CampaignPointRecord
function mapPointRecord(row: any): CampaignPointRecord {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    attendeeId: row.attendee_id,
    attendeeName: row.attendee_name || '',
    source: row.source || 'registration',
    points: Number(row.points || 0),
    description: row.description,
    createdAt: row.created_at,
  };
}

// 辅助函数：映射数据库行到 CampaignEvaluation
function mapEvaluation(row: any): CampaignEvaluation {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    overallQuality: Number(row.overall_quality || 0),
    dimensions: row.dimensions || [],
    conversionRate: Number(row.conversion_rate || 0),
    leadConversionRate: Number(row.lead_conversion_rate || 0),
    dealConversionRate: Number(row.deal_conversion_rate || 0),
    attendeeSatisfaction: Number(row.attendee_satisfaction || 0),
    roi: Number(row.roi || 0),
    strengths: row.strengths || '',
    improvements: row.improvements || '',
    evaluator: row.evaluator || '',
    evaluatedAt: row.evaluated_at,
  };
}

// 辅助函数：映射数据库行到 CampaignMiniAppConfig
function mapMiniAppConfig(row: any): CampaignMiniAppConfig {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    enabled: row.enabled || false,
    allowRegistration: row.allow_registration !== false,
    allowCheckIn: row.allow_check_in !== false,
    allowQuestions: row.allow_questions !== false,
    allowLottery: row.allow_lottery || false,
    allowSharing: row.allow_sharing !== false,
    allowFeedback: row.allow_feedback !== false,
    signupPoints: Number(row.signup_points || 10),
    checkInPoints: Number(row.check_in_points || 20),
    questionPoints: Number(row.question_points || 5),
    lotteryPoints: Number(row.lottery_points || 10),
    sharingPoints: Number(row.sharing_points || 5),
    feedbackPoints: Number(row.feedback_points || 10),
    maxAttendees: row.max_attendees,
    registrationDeadline: row.registration_deadline,
  };
}

// 辅助函数：映射数据库行到 CampaignPhaseTask
function mapPhaseTask(row: any): CampaignPhaseTask {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    phase: row.phase || 'planning',
    title: row.title || '',
    description: row.description,
    dueDate: row.due_date,
    assignee: row.assignee,
    status: row.status || 'pending',
    completedAt: row.completed_at,
    order: Number(row.task_order || 0),
  };
}

// 辅助函数：映射数据库行到 CampaignFeedback
function mapFeedback(row: any): CampaignFeedback {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    attendeeId: row.attendee_id,
    attendeeName: row.attendee_name || '',
    attendeeCompany: row.attendee_company,
    rating: Number(row.rating || 0),
    content: row.content,
    submittedAt: row.submitted_at,
    isAnonymity: row.is_anonymity || false,
  };
}

// 辅助函数：映射数据库行到 CampaignQuestion
function mapQuestion(row: any): CampaignQuestion {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    attendeeId: row.attendee_id,
    attendeeName: row.attendee_name || '',
    content: row.content || '',
    isAnswered: row.is_answered || false,
    answer: row.answer,
    answeredBy: row.answered_by,
    answeredAt: row.answered_at,
    upvotes: Number(row.upvotes || 0),
    createdAt: row.created_at,
  };
}

// 辅助函数：映射数据库行到 CampaignInvitation
function mapInvitation(row: any): CampaignInvitation {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    inviteeName: row.invitee_name || '',
    inviteeCompany: row.invitee_company || '',
    inviteeEmail: row.invitee_email,
    inviteePhone: row.invitee_phone,
    invitationCode: row.invitation_code,
    invitedAt: row.invited_at,
    respondedAt: row.responded_at,
    response: row.response,
    registered: row.registered || false,
  };
}

// 辅助函数：映射数据库行到 CampaignDealLink
function mapDealLink(row: any): CampaignDealLink {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    dealId: row.deal_id,
    attendeeId: row.attendee_id,
    attendeeName: row.attendee_name || '',
    linkedAt: row.linked_at,
    status: row.status || 'potential',
  };
}

// 缓存配置
let cachedCampaigns: MarketingCampaign[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30秒

// 刷新缓存
async function refreshCache(year?: number, quarter?: string) {
  if (Date.now() - cacheTimestamp < CACHE_TTL && cachedCampaigns) return;
  
  try {
    let query = supabase.from('marketing_campaigns').select('*');
    
    if (year) {
      query = query.eq('year', year);
    }
    
    const { data, error } = await query.order('planned_start_date', { ascending: false });
    
    if (error) throw error;
    
    if (data) {
      cachedCampaigns = data.map(mapCampaign);
    }
    
    cacheTimestamp = Date.now();
  } catch (e) {
    console.warn('Failed to refresh campaigns cache:', e);
  }
}

// 清除缓存
function clearCache() {
  cachedCampaigns = null;
  cacheTimestamp = 0;
}

// 营销活动服务
export const campaignService = {
  // ── 活动基础操作 ────────────────────────
  
  // 获取所有活动
  async list(year?: number, quarter?: string): Promise<MarketingCampaign[]> {
    await refreshCache(year, quarter);
    let campaigns = cachedCampaigns || [];
    
    if (year) {
      campaigns = campaigns.filter(c => c.year === year);
    }
    if (quarter) {
      campaigns = campaigns.filter(c => c.quarter === quarter);
    }
    
    return campaigns;
  },
  
  // 获取单个活动
  async getById(id: string): Promise<MarketingCampaign | undefined> {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? mapCampaign(data) : undefined;
    } catch (e) {
      console.error('Failed to get campaign:', e);
      return undefined;
    }
  },
  
  // 创建活动
  async create(campaign: Partial<MarketingCampaign>): Promise<MarketingCampaign | undefined> {
    try {
      const insertData: any = {
        name: campaign.name,
        type: campaign.type || 'vendor_self',
        host_type: campaign.hostType || 'vendor',
        year: campaign.year || new Date().getFullYear(),
        quarter: campaign.quarter || 'Q1',
        category: campaign.category,
        region: campaign.region,
        city: campaign.city,
        budget: campaign.budget || 0,
        actual_spend: campaign.actualSpend || 0,
        approved_amount: campaign.approvedAmount,
        planned_start_date: campaign.plannedStartDate,
        planned_end_date: campaign.plannedEndDate,
        expected_attendees: campaign.expectedAttendees || 0,
        status: campaign.status || 'draft',
        current_phase: campaign.currentPhase || 'planning',
        partner_id: campaign.partnerId,
        partner_name: campaign.partnerName,
        responsible_person: campaign.responsiblePerson,
        description: campaign.description,
        goals: campaign.goals || [],
        expected_outputs: campaign.expectedOutputs,
        created_by: campaign.createdBy,
      };
      
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      clearCache();
      return data ? mapCampaign(data) : undefined;
    } catch (e) {
      console.error('Failed to create campaign:', e);
      return undefined;
    }
  },
  
  // 更新活动
  async update(id: string, updates: Partial<MarketingCampaign>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.hostType !== undefined) updateData.host_type = updates.hostType;
      if (updates.year !== undefined) updateData.year = updates.year;
      if (updates.quarter !== undefined) updateData.quarter = updates.quarter;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.region !== undefined) updateData.region = updates.region;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.budget !== undefined) updateData.budget = updates.budget;
      if (updates.actualSpend !== undefined) updateData.actual_spend = updates.actualSpend;
      if (updates.approvedAmount !== undefined) updateData.approved_amount = updates.approvedAmount;
      if (updates.plannedStartDate !== undefined) updateData.planned_start_date = updates.plannedStartDate;
      if (updates.plannedEndDate !== undefined) updateData.planned_end_date = updates.plannedEndDate;
      if (updates.actualStartDate !== undefined) updateData.actual_start_date = updates.actualStartDate;
      if (updates.actualEndDate !== undefined) updateData.actual_end_date = updates.actualEndDate;
      if (updates.expectedAttendees !== undefined) updateData.expected_attendees = updates.expectedAttendees;
      if (updates.actualAttendees !== undefined) updateData.actual_attendees = updates.actualAttendees;
      if (updates.registeredCount !== undefined) updateData.registered_count = updates.registeredCount;
      if (updates.checkedInCount !== undefined) updateData.checked_in_count = updates.checkedInCount;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.currentPhase !== undefined) updateData.current_phase = updates.currentPhase;
      if (updates.partnerId !== undefined) updateData.partner_id = updates.partnerId;
      if (updates.partnerName !== undefined) updateData.partner_name = updates.partnerName;
      if (updates.responsiblePerson !== undefined) updateData.responsible_person = updates.responsiblePerson;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.goals !== undefined) updateData.goals = updates.goals;
      if (updates.expectedOutputs !== undefined) updateData.expected_outputs = updates.expectedOutputs;
      if (updates.leadsGenerated !== undefined) updateData.leads_generated = updates.leadsGenerated;
      if (updates.dealsCreated !== undefined) updateData.deals_created = updates.dealsCreated;
      if (updates.dealsValue !== undefined) updateData.deals_value = updates.dealsValue;
      if (updates.hasEvaluation !== undefined) updateData.has_evaluation = updates.hasEvaluation;
      
      const { error } = await supabase
        .from('marketing_campaigns')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      clearCache();
      return true;
    } catch (e) {
      console.error('Failed to update campaign:', e);
      return false;
    }
  },
  
  // 删除活动
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      clearCache();
      return true;
    } catch (e) {
      console.error('Failed to delete campaign:', e);
      return false;
    }
  },
  
  // 更新活动阶段
  async updatePhase(id: string, phase: CampaignPhase): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ current_phase: phase })
        .eq('id', id);
      
      if (error) throw error;
      
      clearCache();
      return true;
    } catch (e) {
      console.error('Failed to update campaign phase:', e);
      return false;
    }
  },
  
  // 更新活动状态
  async updateStatus(id: string, status: CampaignStatus): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      clearCache();
      return true;
    } catch (e) {
      console.error('Failed to update campaign status:', e);
      return false;
    }
  },
  
  // ── 参会者管理 ────────────────────────
  
  // 获取活动参会者
  async getAttendees(campaignId: string): Promise<CampaignAttendee[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_attendees')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('registered_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(mapAttendee) : [];
    } catch (e) {
      console.error('Failed to get attendees:', e);
      return [];
    }
  },
  
  // 添加参会者
  async addAttendee(attendee: Partial<CampaignAttendee>): Promise<CampaignAttendee | undefined> {
    try {
      const insertData: any = {
        campaign_id: attendee.campaignId,
        name: attendee.name,
        company: attendee.company,
        position: attendee.position,
        phone: attendee.phone,
        email: attendee.email,
        source: attendee.source || 'registration',
        attendee_type: attendee.attendeeType || 'prospect',
        registered_at: attendee.registeredAt || new Date().toISOString(),
        checked_in: attendee.checkedIn || false,
        total_points: attendee.totalPoints || 0,
        status: attendee.status || 'registered',
        interest_topics: attendee.interestTopics || [],
      };
      
      const { data, error } = await supabase
        .from('campaign_attendees')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      // 更新活动参会人数
      if (data) {
        await this.updateAttendeeCount(attendee.campaignId!);
      }
      
      return data ? mapAttendee(data) : undefined;
    } catch (e) {
      console.error('Failed to add attendee:', e);
      return undefined;
    }
  },
  
  // 签到
  async checkIn(campaignId: string, attendeeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaign_attendees')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
          status: 'checked_in',
        })
        .eq('id', attendeeId)
        .eq('campaign_id', campaignId);
      
      if (error) throw error;
      
      // 更新活动签到人数
      await this.updateCheckedInCount(campaignId);
      
      return true;
    } catch (e) {
      console.error('Failed to check in:', e);
      return false;
    }
  },
  
  // 更新参会人数统计
  async updateAttendeeCount(campaignId: string): Promise<void> {
    try {
      const { count } = await supabase
        .from('campaign_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .neq('status', 'cancelled');
      
      await supabase
        .from('marketing_campaigns')
        .update({ registered_count: count || 0 })
        .eq('id', campaignId);
    } catch (e) {
      console.error('Failed to update attendee count:', e);
    }
  },
  
  // 更新签到人数统计
  async updateCheckedInCount(campaignId: string): Promise<void> {
    try {
      const { count } = await supabase
        .from('campaign_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('checked_in', true);
      
      await supabase
        .from('marketing_campaigns')
        .update({ checked_in_count: count || 0, actual_attendees: count || 0 })
        .eq('id', campaignId);
    } catch (e) {
      console.error('Failed to update checked in count:', e);
    }
  },
  
  // ── 报名管理 ────────────────────────
  
  // 获取活动报名列表
  async getRegistrations(campaignId: string): Promise<CampaignRegistration[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_registrations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('registration_time', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(mapRegistration) : [];
    } catch (e) {
      console.error('Failed to get registrations:', e);
      return [];
    }
  },
  
  // 创建报名
  async createRegistration(registration: Partial<CampaignRegistration>): Promise<CampaignRegistration | undefined> {
    try {
      const insertData: any = {
        campaign_id: registration.campaignId,
        attendee_id: registration.attendeeId,
        attendee_name: registration.attendeeName,
        attendee_company: registration.attendeeCompany,
        attendee_phone: registration.attendeePhone,
        attendee_email: registration.attendeeEmail,
        registration_channel: registration.registrationChannel,
        registration_time: registration.registrationTime || new Date().toISOString(),
        status: registration.status || 'pending',
        source: registration.source,
      };
      
      const { data, error } = await supabase
        .from('campaign_registrations')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      return data ? mapRegistration(data) : undefined;
    } catch (e) {
      console.error('Failed to create registration:', e);
      return undefined;
    }
  },
  
  // ── 积分管理 ────────────────────────
  
  // 获取积分记录
  async getPointRecords(campaignId: string, attendeeId?: string): Promise<CampaignPointRecord[]> {
    try {
      let query = supabase
        .from('campaign_point_records')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      
      if (attendeeId) {
        query = query.eq('attendee_id', attendeeId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data ? data.map(mapPointRecord) : [];
    } catch (e) {
      console.error('Failed to get point records:', e);
      return [];
    }
  },
  
  // 添加积分
  async addPoints(record: Partial<CampaignPointRecord>): Promise<CampaignPointRecord | undefined> {
    try {
      const insertData: any = {
        campaign_id: record.campaignId,
        attendee_id: record.attendeeId,
        attendee_name: record.attendeeName,
        source: record.source,
        points: record.points || 0,
        description: record.description,
      };
      
      const { data, error } = await supabase
        .from('campaign_point_records')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      // 更新参会者总积分
      if (data) {
        await this.updateAttendeeTotalPoints(record.campaignId!, record.attendeeId!);
      }
      
      return data ? mapPointRecord(data) : undefined;
    } catch (e) {
      console.error('Failed to add points:', e);
      return undefined;
    }
  },
  
  // 更新参会者总积分
  async updateAttendeeTotalPoints(campaignId: string, attendeeId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('campaign_point_records')
        .select('points')
        .eq('campaign_id', campaignId)
        .eq('attendee_id', attendeeId);
      
      const totalPoints = data ? data.reduce((sum, r) => sum + Number(r.points || 0), 0) : 0;
      
      await supabase
        .from('campaign_attendees')
        .update({ total_points: totalPoints })
        .eq('id', attendeeId)
        .eq('campaign_id', campaignId);
    } catch (e) {
      console.error('Failed to update attendee total points:', e);
    }
  },
  
  // 关联参会者与商机
  async linkAttendeeWithDeal(attendeeId: string, dealId: string): Promise<void> {
    try {
      await supabase
        .from('campaign_attendees')
        .update({
          deal_created: true,
          deal_id: dealId,
          follow_up_status: 'in_progress',
        })
        .eq('id', attendeeId);
    } catch (e) {
      console.error('Failed to link attendee with deal:', e);
      throw e;
    }
  },
  
  // 增加活动商机数量
  async incrementDealsCreated(campaignId: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('marketing_campaigns')
        .select('deals_created')
        .eq('id', campaignId)
        .single();
      
      const currentCount = data?.deals_created || 0;
      
      await supabase
        .from('marketing_campaigns')
        .update({ deals_created: currentCount + 1 })
        .eq('id', campaignId);
    } catch (e) {
      console.error('Failed to increment deals created:', e);
      throw e;
    }
  },
  
  // ── 预算管理 ────────────────────────
  
  // 获取年度预算
  async getAnnualBudget(year: number): Promise<AnnualMarketingBudget | undefined> {
    try {
      const { data, error } = await supabase
        .from('annual_marketing_budgets')
        .select('*')
        .eq('year', year)
        .single();
      
      if (error) throw error;
      
      if (!data) return undefined;
      
      // 获取季度预算明细
      const { data: quarterlyData } = await supabase
        .from('quarterly_budgets')
        .select('*')
        .eq('annual_budget_id', data.id)
        .order('quarter');
      
      // 获取分类预算明细
      const { data: categoryData } = await supabase
        .from('category_budgets')
        .select('*')
        .eq('annual_budget_id', data.id);
      
      return {
        id: data.id,
        year: data.year,
        totalBudget: Number(data.total_budget || 0),
        totalSpent: Number(data.total_spent || 0),
        remaining: Number(data.remaining || 0),
        status: data.status || 'draft',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        quarterlyBudgets: quarterlyData?.map(q => ({
          id: q.id,
          annualBudgetId: q.annual_budget_id,
          quarter: q.quarter,
          allocatedBudget: Number(q.allocated_budget || 0),
          spent: Number(q.spent || 0),
          remaining: Number(q.remaining || 0),
          campaignCount: Number(q.campaign_count || 0),
          expectedAttendees: Number(q.expected_attendees || 0),
          actualAttendees: Number(q.actual_attendees || 0),
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        })),
        categoryBudgets: categoryData?.map(c => ({
          id: c.id,
          annualBudgetId: c.annual_budget_id,
          category: c.category,
          allocatedBudget: Number(c.allocated_budget || 0),
          spent: Number(c.spent || 0),
          remaining: Number(c.remaining || 0),
          campaignCount: Number(c.campaign_count || 0),
        })),
      };
    } catch (e) {
      console.error('Failed to get annual budget:', e);
      return undefined;
    }
  },
  
  // 创建年度预算
  async createAnnualBudget(budget: Partial<AnnualMarketingBudget>): Promise<AnnualMarketingBudget | undefined> {
    try {
      const { data, error } = await supabase
        .from('annual_marketing_budgets')
        .insert({
          year: budget.year,
          total_budget: budget.totalBudget,
          total_spent: 0,
          remaining: budget.totalBudget,
          status: 'draft',
          created_by: budget.createdBy,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // 创建季度预算明细
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const quarterlyBudget = (budget.totalBudget || 0) / 4;
      
      for (const quarter of quarters) {
        await supabase
          .from('quarterly_budgets')
          .insert({
            annual_budget_id: data.id,
            quarter,
            allocated_budget: quarterlyBudget,
            spent: 0,
            remaining: quarterlyBudget,
            campaign_count: 0,
            expected_attendees: 0,
            actual_attendees: 0,
          });
      }
      
      clearCache();
      return this.getAnnualBudget(budget.year!);
    } catch (e) {
      console.error('Failed to create annual budget:', e);
      return undefined;
    }
  },
  
  // 更新年度预算
  async updateAnnualBudget(id: string, updates: Partial<AnnualMarketingBudget>): Promise<boolean> {
    try {
      const updateData: any = {};
      if (updates.totalBudget !== undefined) updateData.total_budget = updates.totalBudget;
      if (updates.status !== undefined) updateData.status = updates.status;
      
      const { error } = await supabase
        .from('annual_marketing_budgets')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      clearCache();
      return true;
    } catch (e) {
      console.error('Failed to update annual budget:', e);
      return false;
    }
  },
  
  // 更新季度预算分配
  async updateQuarterlyBudget(annualBudgetId: string, quarter: string, allocatedBudget: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('quarterly_budgets')
        .update({
          allocated_budget: allocatedBudget,
          remaining: allocatedBudget,
        })
        .eq('annual_budget_id', annualBudgetId)
        .eq('quarter', quarter);
      
      if (error) throw error;
      
      clearCache();
      return true;
    } catch (e) {
      console.error('Failed to update quarterly budget:', e);
      return false;
    }
  },
  
  // 获取预算使用统计
  async getBudgetUsage(year: number): Promise<{
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    byQuarter: { quarter: string; budget: number; spent: number; remaining: number; campaignCount: number }[];
    byCategory: { category: string; budget: number; spent: number; remaining: number; campaignCount: number }[];
  } | undefined> {
    try {
      const budget = await this.getAnnualBudget(year);
      if (!budget) return undefined;
      
      // 获取该年度所有活动
      const campaigns = await this.list(year);
      
      // 按季度分组计算
      const byQuarter = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
        const qCampaigns = campaigns.filter(c => c.quarter === q);
        return {
          quarter: q,
          budget: budget.quarterlyBudgets?.find(qb => qb.quarter === q)?.allocatedBudget || 0,
          spent: qCampaigns.reduce((sum, c) => sum + c.actualSpend, 0),
          remaining: (budget.quarterlyBudgets?.find(qb => qb.quarter === q)?.remaining || 0),
          campaignCount: qCampaigns.length,
        };
      });
      
      // 按类别分组计算
      const byCategory: Record<string, { category: string; budget: number; spent: number; remaining: number; campaignCount: number }> = {};
      for (const campaign of campaigns) {
        const cat = campaign.category || '未分类';
        if (!byCategory[cat]) {
          byCategory[cat] = { category: cat, budget: 0, spent: 0, remaining: 0, campaignCount: 0 };
        }
        byCategory[cat].spent += campaign.actualSpend;
        byCategory[cat].campaignCount += 1;
      }
      
      return {
        totalBudget: budget.totalBudget,
        totalSpent: campaigns.reduce((sum, c) => sum + c.actualSpend, 0),
        remaining: budget.remaining,
        byQuarter,
        byCategory: Object.values(byCategory),
      };
    } catch (e) {
      console.error('Failed to get budget usage:', e);
      return undefined;
    }
  },
  
  // ── 评估管理 ────────────────────────
  
  // 获取活动评估
  async getEvaluation(campaignId: string): Promise<CampaignEvaluation | undefined> {
    try {
      const { data, error } = await supabase
        .from('campaign_evaluations')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();
      
      if (error) throw error;
      return data ? mapEvaluation(data) : undefined;
    } catch (e) {
      console.error('Failed to get evaluation:', e);
      return undefined;
    }
  },
  
  // 创建或更新评估（手动 upsert：先查后改）
  async saveEvaluation(evaluation: Partial<CampaignEvaluation>): Promise<boolean> {
    try {
      // 检查是否已存在评估记录
      const { data: existing } = await supabase
        .from('campaign_evaluations')
        .select('id')
        .eq('campaign_id', evaluation.campaignId!)
        .maybeSingle();

      const record = {
        campaign_id: evaluation.campaignId,
        overall_quality: evaluation.overallQuality,
        dimensions: evaluation.dimensions,
        conversion_rate: evaluation.conversionRate,
        lead_conversion_rate: evaluation.leadConversionRate,
        deal_conversion_rate: evaluation.dealConversionRate,
        attendee_satisfaction: evaluation.attendeeSatisfaction,
        roi: evaluation.roi,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        evaluator: evaluation.evaluator,
        evaluated_at: evaluation.evaluatedAt || new Date().toISOString(),
      };

      let error;
      if (existing) {
        // 更新已有记录
        ({ error } = await supabase
          .from('campaign_evaluations')
          .update(record)
          .eq('id', existing.id));
      } else {
        // 插入新记录
        ({ error } = await supabase
          .from('campaign_evaluations')
          .insert(record));
      }

      if (error) throw error;

      // 更新活动评估标记
      await supabase
        .from('marketing_campaigns')
        .update({ has_evaluation: true })
        .eq('id', evaluation.campaignId!);

      return true;
    } catch (e) {
      console.error('Failed to save evaluation:', e);
      return false;
    }
  },
  
  // ── 小程序配置 ────────────────────────
  
  // 获取小程序配置
  async getMiniAppConfig(campaignId: string): Promise<CampaignMiniAppConfig | undefined> {
    try {
      const { data, error } = await supabase
        .from('campaign_mini_app_configs')
        .select('*')
        .eq('campaign_id', campaignId)
        .single();
      
      if (error) throw error;
      return data ? mapMiniAppConfig(data) : undefined;
    } catch (e) {
      console.error('Failed to get mini app config:', e);
      return undefined;
    }
  },
  
  // 保存小程序配置（手动 upsert：先查后改）
  async saveMiniAppConfig(config: Partial<CampaignMiniAppConfig>): Promise<boolean> {
    try {
      // 检查是否已存在配置
      const { data: existing } = await supabase
        .from('campaign_mini_app_configs')
        .select('id')
        .eq('campaign_id', config.campaignId!)
        .maybeSingle();

      const record = {
        campaign_id: config.campaignId,
        enabled: config.enabled !== false,
        allow_registration: config.allowRegistration !== false,
        allow_check_in: config.allowCheckIn !== false,
        allow_questions: config.allowQuestions !== false,
        allow_lottery: config.allowLottery || false,
        allow_sharing: config.allowSharing !== false,
        allow_feedback: config.allowFeedback !== false,
        signup_points: config.signupPoints || 10,
        check_in_points: config.checkInPoints || 20,
        question_points: config.questionPoints || 5,
        lottery_points: config.lotteryPoints || 10,
        sharing_points: config.sharingPoints || 5,
        feedback_points: config.feedbackPoints || 10,
        max_attendees: config.maxAttendees,
        registration_deadline: config.registrationDeadline,
      };

      let error;
      if (existing) {
        ({ error } = await supabase
          .from('campaign_mini_app_configs')
          .update(record)
          .eq('id', existing.id));
      } else {
        ({ error } = await supabase
          .from('campaign_mini_app_configs')
          .insert(record));
      }

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Failed to save mini app config:', e);
      return false;
    }
  },
  
  // ── 邀请管理 ────────────────────────
  
  // 获取邀请列表
  async getInvitations(campaignId: string): Promise<CampaignInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_invitations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('invited_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(mapInvitation) : [];
    } catch (e) {
      console.error('Failed to get invitations:', e);
      return [];
    }
  },
  
  // 创建邀请
  async createInvitation(invitation: Partial<CampaignInvitation>): Promise<CampaignInvitation | undefined> {
    try {
      const insertData: any = {
        campaign_id: invitation.campaignId,
        invitee_name: invitation.inviteeName,
        invitee_company: invitation.inviteeCompany,
        invitee_email: invitation.inviteeEmail,
        invitee_phone: invitation.inviteePhone,
        invitation_code: invitation.invitationCode || this.generateInvitationCode(),
        invited_at: invitation.invitedAt || new Date().toISOString(),
        registered: false,
      };
      
      const { data, error } = await supabase
        .from('campaign_invitations')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data ? mapInvitation(data) : undefined;
    } catch (e) {
      console.error('Failed to create invitation:', e);
      return undefined;
    }
  },
  
  // 生成邀请码
  generateInvitationCode(): string {
    return 'INV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
  },
  
  // ── 阶段任务管理 ────────────────────────
  
  // 获取阶段任务
  async getPhaseTasks(campaignId: string, phase?: CampaignPhase): Promise<CampaignPhaseTask[]> {
    try {
      let query = supabase
        .from('campaign_phase_tasks')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('task_order', { ascending: true });
      
      if (phase) {
        query = query.eq('phase', phase);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data ? data.map(mapPhaseTask) : [];
    } catch (e) {
      console.error('Failed to get phase tasks:', e);
      return [];
    }
  },
  
  // 创建阶段任务
  async createPhaseTask(task: Partial<CampaignPhaseTask>): Promise<CampaignPhaseTask | undefined> {
    try {
      const insertData: any = {
        campaign_id: task.campaignId,
        phase: task.phase || 'planning',
        title: task.title,
        description: task.description,
        due_date: task.dueDate,
        assignee: task.assignee,
        status: task.status || 'pending',
        task_order: task.order || 0,
      };
      
      const { data, error } = await supabase
        .from('campaign_phase_tasks')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data ? mapPhaseTask(data) : undefined;
    } catch (e) {
      console.error('Failed to create phase task:', e);
      return undefined;
    }
  },
  
  // 更新任务状态
  async updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed' | 'overdue'): Promise<boolean> {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('campaign_phase_tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Failed to update task status:', e);
      return false;
    }
  },
  
  // ── 反馈管理 ────────────────────────
  
  // 获取反馈
  async getFeedback(campaignId: string): Promise<CampaignFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_feedback')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(mapFeedback) : [];
    } catch (e) {
      console.error('Failed to get feedback:', e);
      return [];
    }
  },
  
  // 提交反馈
  async submitFeedback(feedback: Partial<CampaignFeedback>): Promise<CampaignFeedback | undefined> {
    try {
      const insertData: any = {
        campaign_id: feedback.campaignId,
        attendee_id: feedback.attendeeId,
        attendee_name: feedback.attendeeName,
        attendee_company: feedback.attendeeCompany,
        rating: feedback.rating,
        content: feedback.content,
        submitted_at: feedback.submittedAt || new Date().toISOString(),
        is_anonymity: feedback.isAnonymity || false,
      };
      
      const { data, error } = await supabase
        .from('campaign_feedback')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data ? mapFeedback(data) : undefined;
    } catch (e) {
      console.error('Failed to submit feedback:', e);
      return undefined;
    }
  },
  
  // ── 提问管理 ────────────────────────
  
  // 获取提问
  async getQuestions(campaignId: string): Promise<CampaignQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_questions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data ? data.map(mapQuestion) : [];
    } catch (e) {
      console.error('Failed to get questions:', e);
      return [];
    }
  },
  
  // 提交提问
  async submitQuestion(question: Partial<CampaignQuestion>): Promise<CampaignQuestion | undefined> {
    try {
      const insertData: any = {
        campaign_id: question.campaignId,
        attendee_id: question.attendeeId,
        attendee_name: question.attendeeName,
        content: question.content,
        is_answered: false,
        upvotes: 0,
      };
      
      const { data, error } = await supabase
        .from('campaign_questions')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      return data ? mapQuestion(data) : undefined;
    } catch (e) {
      console.error('Failed to submit question:', e);
      return undefined;
    }
  },
  
  // 回复提问
  async answerQuestion(questionId: string, answer: string, answeredBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaign_questions')
        .update({
          is_answered: true,
          answer,
          answered_by: answeredBy,
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Failed to answer question:', e);
      return false;
    }
  },
  
  // ── 商机关联 ────────────────────────
  
  // 获取活动商机关联
  async getDealLinks(campaignId: string): Promise<CampaignDealLink[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_deal_links')
        .select('*')
        .eq('campaign_id', campaignId);
      
      if (error) throw error;
      return data ? data.map(mapDealLink) : [];
    } catch (e) {
      console.error('Failed to get deal links:', e);
      return [];
    }
  },
  
  // 关联商机
  async linkDeal(campaignId: string, dealId: string, attendeeId: string, attendeeName: string): Promise<boolean> {
    try {
      const insertData = {
        campaign_id: campaignId,
        deal_id: dealId,
        attendee_id: attendeeId,
        attendee_name: attendeeName,
        linked_at: new Date().toISOString(),
        status: 'potential',
      };
      
      const { error } = await supabase
        .from('campaign_deal_links')
        .insert(insertData);
      
      if (error) throw error;
      
      // 更新参会者商机关联状态
      await supabase
        .from('campaign_attendees')
        .update({ deal_created: true, deal_id: dealId })
        .eq('id', attendeeId);
      
      // 更新活动商机统计
      const { data } = await supabase
        .from('campaign_deal_links')
        .select('*', { count: 'exact' })
        .eq('campaign_id', campaignId);
      
      await supabase
        .from('marketing_campaigns')
        .update({ deals_created: data?.length || 0 })
        .eq('id', campaignId);
      
      return true;
    } catch (e) {
      console.error('Failed to link deal:', e);
      return false;
    }
  },
  
  // ── 统计分析 ────────────────────────
  
  // 获取季度活动统计
  async getQuarterlyStats(year: number, quarter: string): Promise<QuarterlyCampaignStats> {
    try {
      const campaigns = await this.list(year, quarter);
      
      const vendorSelf = campaigns.filter(c => c.type === 'vendor_self');
      const partnerJoint = campaigns.filter(c => c.type === 'partner_joint');
      const mdf = campaigns.filter(c => c.type === 'mdf');
      
      const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
      const totalSpend = campaigns.reduce((sum, c) => sum + c.actualSpend, 0);
      
      const totalExpected = campaigns.reduce((sum, c) => sum + c.expectedAttendees, 0);
      const totalActual = campaigns.reduce((sum, c) => sum + c.actualAttendees, 0);
      
      const totalLeads = campaigns.reduce((sum, c) => sum + c.leadsGenerated, 0);
      const totalDeals = campaigns.reduce((sum, c) => sum + c.dealsCreated, 0);
      const totalDealsValue = campaigns.reduce((sum, c) => sum + c.dealsValue, 0);
      
      // 获取评估数据
      const evaluations = await Promise.all(
        campaigns.map(c => this.getEvaluation(c.id))
      );
      
      const validEvaluations = evaluations.filter(e => e !== undefined);
      const avgQualityScore = validEvaluations.length > 0
        ? validEvaluations.reduce((sum, e) => sum + (e?.overallQuality || 0), 0) / validEvaluations.length
        : 0;
      const avgSatisfaction = validEvaluations.length > 0
        ? validEvaluations.reduce((sum, e) => sum + (e?.attendeeSatisfaction || 0), 0) / validEvaluations.length
        : 0;
      
      return {
        year,
        quarter,
        totalActivities: campaigns.length,
        vendorSelfActivities: vendorSelf.length,
        partnerJointActivities: partnerJoint.length,
        mdfActivities: mdf.length,
        
        totalBudget,
        totalSpend,
        budgetUtilizationRate: totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0,
        
        totalExpectedAttendees: totalExpected,
        totalActualAttendees: totalActual,
        attendanceRate: totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0,
        
        totalLeads,
        leadsConversionRate: totalActual > 0 ? (totalLeads / totalActual) * 100 : 0,
        
        totalDeals,
        dealsValue: totalDealsValue,
        dealsConversionRate: totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0,
        
        avgQualityScore,
        avgSatisfaction,
      };
    } catch (e) {
      console.error('Failed to get quarterly stats:', e);
      return {
        year,
        quarter,
        totalActivities: 0,
        vendorSelfActivities: 0,
        partnerJointActivities: 0,
        mdfActivities: 0,
        totalBudget: 0,
        totalSpend: 0,
        budgetUtilizationRate: 0,
        totalExpectedAttendees: 0,
        totalActualAttendees: 0,
        attendanceRate: 0,
        totalLeads: 0,
        leadsConversionRate: 0,
        totalDeals: 0,
        dealsValue: 0,
        dealsConversionRate: 0,
        avgQualityScore: 0,
        avgSatisfaction: 0,
      };
    }
  },
  
  // 按类型统计
  async getStatsByType(year?: number, quarter?: string) {
    const campaigns = await this.list(year, quarter);
    
    return {
      vendor_self: campaigns.filter(c => c.type === 'vendor_self').length,
      partner_joint: campaigns.filter(c => c.type === 'partner_joint').length,
      mdf: campaigns.filter(c => c.type === 'mdf').length,
      total: campaigns.length,
    };
  },
  
  // 按阶段统计
  async getStatsByPhase(year?: number, quarter?: string) {
    const campaigns = await this.list(year, quarter);
    
    return {
      planning: campaigns.filter(c => c.currentPhase === 'planning').length,
      preparing: campaigns.filter(c => c.currentPhase === 'preparing').length,
      executing: campaigns.filter(c => c.currentPhase === 'executing').length,
      follow_up: campaigns.filter(c => c.currentPhase === 'follow_up').length,
      evaluating: campaigns.filter(c => c.currentPhase === 'evaluating').length,
    };
  },
  
  // 按状态统计
  async getStatsByStatus(year?: number, quarter?: string) {
    const campaigns = await this.list(year, quarter);
    
    return {
      draft: campaigns.filter(c => c.status === 'draft').length,
      pending: campaigns.filter(c => c.status === 'pending').length,
      approved: campaigns.filter(c => c.status === 'approved').length,
      in_progress: campaigns.filter(c => c.status === 'in_progress').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
      cancelled: campaigns.filter(c => c.status === 'cancelled').length,
    };
  },
};
