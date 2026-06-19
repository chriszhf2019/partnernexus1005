import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh token before it expires (default: 10 seconds)
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Time in seconds to wait before auto-refresh (default: 10)
    // Set to 60 seconds to refresh token 1 minute before expiry
    detectSessionInUrl: true,
  },
});

export const db = {
  partners: () => supabase.from('partners'),
  contacts: () => supabase.from('partner_contacts'),
  deals: () => supabase.from('deals'),
  dealEvents: () => supabase.from('deal_lifecycle_events'),
  mdfAllocations: () => supabase.from('mdf_allocations'),
  pmdfApplications: () => supabase.from('pmdf_applications'),
  marketingActivities: () => supabase.from('marketing_activities'),
  incentivePrograms: () => supabase.from('incentive_programs'),
  mpEvents: () => supabase.from('mp_events'),
  mpUsers: () => supabase.from('mp_users'),
  mpScores: () => supabase.from('mp_scores'),
  mpGifts: () => supabase.from('mp_gifts'),
  mpOrders: () => supabase.from('mp_orders'),
  settings: () => supabase.from('settings'),
  operationLogs: () => supabase.from('partner_operation_logs'),
  dealActivities: () => supabase.from('deal_activities'),
  protectionRules: () => supabase.from('protection_rules'),
  ruleExecutionLogs: () => supabase.from('rule_execution_logs'),
  savedViews: () => supabase.from('saved_views'),
  filterHistory: () => supabase.from('filter_history'),
  notifications: () => supabase.from('notifications'),
  jbpMeetings: () => supabase.from('jbp_meetings'),
  globalSettings: () => supabase.from('global_settings'),
  marketingBudgetConfig: () => supabase.from('marketing_budget_config'),
  marketingPlan: () => supabase.from('marketing_plan'),
  marketingCampaigns: () => supabase.from('marketing_campaigns'),
  campaignAttendees: () => supabase.from('campaign_attendees'),
  campaignRegistrations: () => supabase.from('campaign_registrations'),
  campaignPointRecords: () => supabase.from('campaign_point_records'),
  annualMarketingBudgets: () => supabase.from('annual_marketing_budgets'),
  quarterlyBudgets: () => supabase.from('quarterly_budgets'),
  categoryBudgets: () => supabase.from('category_budgets'),
  campaignEvaluations: () => supabase.from('campaign_evaluations'),
  campaignMiniAppConfigs: () => supabase.from('campaign_mini_app_configs'),
  campaignInvitations: () => supabase.from('campaign_invitations'),
  campaignPhaseTasks: () => supabase.from('campaign_phase_tasks'),
  campaignFeedback: () => supabase.from('campaign_feedback'),
  campaignQuestions: () => supabase.from('campaign_questions'),
  campaignDealLinks: () => supabase.from('campaign_deal_links'),
  certificationPrograms: () => supabase.from('certification_programs'),
  userEnrollments: () => supabase.from('user_enrollments'),
  assessmentRecords: () => supabase.from('assessment_records'),
  courseFeedback: () => supabase.from('course_feedback'),
  partnerActivityLogs: () => supabase.from('partner_activity_logs'),
  marketBenchmarks: () => supabase.from('market_benchmarks'),
  dealConflicts: () => supabase.from('deal_conflicts'),
  incentiveTemplates: () => supabase.from('incentive_templates'),
  incentiveBudgetAlerts: () => supabase.from('incentive_budget_alerts'),
  incentiveApplications: () => supabase.from('incentive_applications'),
  // ── 生命周期追踪 v2.0 新增表 ──
  partnerLifecycleEvents: () => supabase.from('partner_lifecycle_events'),
  dealLifecycleEventsV2: () => supabase.from('deal_lifecycle_events'),
  incentiveLifecycleEvents: () => supabase.from('incentive_program_lifecycle_events'),
  trainingLifecycleEvents: () => supabase.from('training_lifecycle_events'),
  marketingLifecycleEvents: () => supabase.from('marketing_lifecycle_events'),
  // ── 关系深度生命周期 v3.0 新增表 ──
  partnerMaturityEvents: () => supabase.from('partner_maturity_events'),
};
