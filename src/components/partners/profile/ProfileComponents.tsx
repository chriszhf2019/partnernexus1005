import { ArrowUpRight, ArrowDownRight, Crosshair, Users } from 'lucide-react';
import { cn } from '../../../lib/utils';

// ─── Score Gauge ──────────────────────────────────────
export const Gauge = ({ score, label, max = 100 }: { score: number; label: string; max?: number }) => {
  const pct = Math.min(100, (score / max) * 100);
  const color = pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626';
  const s = 52, stroke = 5, r = (s - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={s} height={s} className="-rotate-90">
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke="#e4e4e7" strokeWidth={stroke} />
        <circle cx={s/2} cy={s/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" />
        <text x={s/2} y={s/2+1} textAnchor="middle" dy="0.35em" fontSize={13} fontWeight={700} fill="currentColor" className="dark:fill-white" transform={`rotate(90 ${s/2} ${s/2})`}>{score}</text>
      </svg>
      <span className="text-[10px] text-neutral-500 font-medium">{label}</span>
    </div>
  );
};

// ─── Stat Card ─────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, sub, trend, color }: { icon: typeof Users; label: string; value: string; sub?: string; trend?: number; color?: string }) => (
  <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
    <div className={cn('p-2 rounded-lg', color || 'text-neutral-600', 'bg-neutral-100 dark:bg-neutral-700/50')}><Icon className="w-4 h-4" /></div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-neutral-500 font-medium truncate">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">{value}</span>
        {trend !== undefined && (trend >= 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />)}
      </div>
      {sub && <p className="text-xs text-neutral-500 truncate">{sub}</p>}
    </div>
  </div>
);

// ─── Breakthrough Card ─────────────────────────────────
export const Breakthrough = ({ title, desc, action, target, roi }: { title: string; desc: string; action: string; target: string; roi: string }) => (
  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0"><Crosshair className="w-4 h-4 text-white" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{title}</p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{desc}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">预期ROI: {roi}</span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">→ {action}</span>
        </div>
      </div>
    </div>
  </div>
);
