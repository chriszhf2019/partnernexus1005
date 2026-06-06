import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
};
