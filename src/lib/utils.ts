import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: 'CNY' | 'USD' = 'CNY') {
  const symbolMap: Record<string, string> = { CNY: '¥', USD: '$' };
  const symbol = symbolMap[currency] || '¥';

  const n = Math.abs(amount);
  const parts = n.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = parts.join('.');
  return (amount < 0 ? '-' : '') + symbol + formatted;
}

export function currencyName(currency: string): string {
  const map: Record<string, string> = { CNY: '人民币', USD: '美元' };
  return map[currency] || currency;
}
