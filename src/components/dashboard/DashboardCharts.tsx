import { SafeGrid } from '../../lib/safeRecharts';
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  
  
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';

const REVENUE_DATA = [
  { month: 'Jan', revenue: 4500, target: 4000 },
  { month: 'Feb', revenue: 5200, target: 4500 },
  { month: 'Mar', revenue: 4800, target: 5000 },
  { month: 'Apr', revenue: 6100, target: 5500 },
  { month: 'May', revenue: 5900, target: 6000 },
  { month: 'Jun', revenue: 7200, target: 6500 },
];

const TIER_DATA = [
  { name: 'Diamond', value: 45, color: '#1d4ed8' },
  { name: 'Platinum', value: 120, color: '#4f46e5' },
  { name: 'Gold', value: 280, color: '#f59e0b' },
  { name: 'Silver', value: 450, color: '#64748b' },
  { name: 'Registered', value: 345, color: '#94a3b8' },
];

const FUNNEL_DATA = [
  { value: 1000, name: 'Leads', fill: '#f8fafc' },
  { value: 800, name: 'Qualified', fill: '#e2e8f0' },
  { value: 500, name: 'Proposal', fill: '#94a3b8' },
  { value: 300, name: 'Negotiation', fill: '#475569' },
  { value: 150, name: 'Closed Won', fill: '#1e293b' },
];

export const RevenueTrendChart: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="h-[300px] w-full">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('charts.revenueTrend')}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={REVENUE_DATA}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <SafeGrid />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
          <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PartnerTierChart: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="h-[300px] w-full">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('charts.partnerDistribution')}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={TIER_DATA}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {TIER_DATA.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PipelineFunnelChart: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="h-[300px] w-full">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('charts.pipelineFunnel')}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Funnel
            dataKey="value"
            data={FUNNEL_DATA}
            isAnimationActive
          >
            <LabelList position="right" fill="#64748b" stroke="none" dataKey="name" fontSize={10} fontWeight={700} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
};
