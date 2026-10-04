/**
 * Metric Engine — Safe Math Utilities
 * 安全数学计算工具：防止除零、NaN、Infinity、边界溢出
 * 所有指标计算必须通过这些函数，禁止直接做除法
 */

export const SAFE_DEFAULTS = {
  RATIO_FALLBACK: 0,
  PERCENT_FALLBACK: 0,
  MAX_PERCENT: 999,
  MIN_PERCENT: 0,
  MAX_RATIO: 9.99,
  NA_DISPLAY: 'N/A',
} as const;

export function safeDiv(numerator: number, denominator: number, fallback: number = 0): number {
  const num = Number(numerator);
  const den = Number(denominator);
  if (
    !isFinite(num) ||
    !isFinite(den) ||
    den === 0 ||
    isNaN(num) ||
    isNaN(den)
  ) {
    return fallback;
  }
  const result = num / den;
  return isFinite(result) ? result : fallback;
}

export function safeRatio(numerator: number, denominator: number, fallback: number = 0): number {
  const ratio = safeDiv(numerator, denominator, fallback);
  return Math.min(SAFE_DEFAULTS.MAX_RATIO, Math.max(0, ratio));
}

export function safePercent(numerator: number, denominator: number, fallback: number = 0): number {
  const ratio = safeDiv(numerator, denominator, fallback / 100);
  const pct = Math.round(ratio * 100);
  return Math.min(SAFE_DEFAULTS.MAX_PERCENT, Math.max(SAFE_DEFAULTS.MIN_PERCENT, pct));
}

export function safePercentWithCapped(
  numerator: number,
  denominator: number,
  cap: number = 999,
  fallback: number = 0
): number {
  const pct = safePercent(numerator, denominator, fallback);
  return Math.min(cap, Math.max(0, pct));
}

export function safeNumber(value: any, fallback: number = 0): number {
  const n = Number(value);
  if (!isFinite(n) || isNaN(n)) return fallback;
  return n;
}

export function safeSum(values: (number | null | undefined)[]): number {
  return values.reduce((sum: number, v) => sum + safeNumber(v, 0), 0);
}

export function safeAvg(values: (number | null | undefined)[]): number {
  const nums = values.map(v => safeNumber(v, 0)).filter(v => isFinite(v));
  if (nums.length === 0) return 0;
  return safeSum(nums) / nums.length;
}

export function formatPercent(value: number, cap: number = 999): string {
  const v = Math.min(cap, Math.max(0, Math.round(value)));
  if (v >= cap) return `${cap}%+`;
  return `${v}%`;
}

export function formatRatio(value: number, decimals: number = 1, cap: number = 100): string {
  if (!isFinite(value) || isNaN(value)) return SAFE_DEFAULTS.NA_DISPLAY;
  const v = Math.min(cap, Math.max(0, value));
  if (v >= cap) return `${cap}x+`;
  return v.toFixed(decimals) + 'x';
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function safeGrowth(current: number, previous: number): number {
  const prev = safeNumber(previous, 0);
  if (prev === 0) return 0;
  return safePercent(current - prev, Math.abs(prev), 0);
}
