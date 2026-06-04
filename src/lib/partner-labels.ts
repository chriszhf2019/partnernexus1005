import type { PartnerStatus, PartnerType, PartnerTier } from '../types';

export const TIER_LABELS: Record<PartnerTier, string> = {
  Platinum: 'Platinum', Gold: 'Gold', Silver: 'Silver', Registered: 'Registered',
  Diamond: 'Diamond', Premier: 'Premier', Standard: 'Standard',
};

export const TIER_STYLES: Record<PartnerTier, string> = {
  Platinum: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Gold: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Silver: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
  Registered: 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
  Diamond: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Premier: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  Standard: 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400',
};

export const TYPE_LABELS: Record<PartnerType, string> = {
  Reseller: 'Reseller', ISV: 'ISV', OEM: 'OEM', Service: 'Service',
  VAD: 'VAD', VAR: 'VAR', SI: 'SI',
};

export const STATUS_CONFIG: Record<PartnerStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
  Cooperating: { label: 'Cooperating', variant: 'success' },
  Inactive: { label: 'Inactive', variant: 'warning' },
  Prospective: { label: 'Prospective', variant: 'info' },
  Rejected: { label: 'Rejected', variant: 'danger' },
};

export const INDUSTRY_OPTIONS = [
  { value: '金融', label: '金融' }, { value: '医疗', label: '医疗' }, { value: '政务', label: '政务' },
  { value: '制造', label: '制造' }, { value: '教育', label: '教育' }, { value: '互联网', label: '互联网' }, { value: '能源', label: '能源' },
];

export const TIER_OPTIONS: { value: PartnerTier; label: string }[] =
  Object.entries(TIER_LABELS).map(([value, label]) => ({ value: value as PartnerTier, label }));

export const TYPE_OPTIONS: { value: PartnerType; label: string }[] =
  Object.entries(TYPE_LABELS).map(([value, label]) => ({ value: value as PartnerType, label }));

export const STATUS_OPTIONS: { value: PartnerStatus; label: string }[] =
  Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value: value as PartnerStatus, label: cfg.label }));

export const recordTypeLabel = (type: string): string => {
  const map: Record<string, string> = { meeting: '会议', training: '培训', activity: '活动', deal: '商机' };
  return map[type] || type;
};
