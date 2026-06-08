import { SafeGrid } from '../../lib/safeRecharts';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const chartData = [
  { name: '21Q1', rev: 2800000, orders: 120 },
  { name: '21Q2', rev: 3200000, orders: 150 },
  { name: '21Q3', rev: 3100000, orders: 140 },
  { name: '21Q4', rev: 4500000, orders: 210 },
  { name: '22Q1', rev: 3500000, orders: 180 },
  { name: '22Q2', rev: 4200000, orders: 220 },
  { name: '22Q3', rev: 3900000, orders: 190 },
  { name: '22Q4', rev: 5800000, orders: 310 },
  { name: '23Q1', rev: 4200000, orders: 240 },
  { name: '23Q2', rev: 5100000, orders: 280 },
  { name: '23Q3', rev: 4800000, orders: 260 },
  { name: '23Q4', rev: 7200000, orders: 420 },
];

export const HistoricalTrendChart = () => {
  const [showPerformance, setShowPerformance] = useState(true);
  const [showOrders, setShowOrders] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>3年销售业绩与订单趋势回顾 (3-Year Sales & Volume Trend)</CardTitle>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showPerformance}
              onChange={() => setShowPerformance(!showPerformance)}
              className="hidden"
            />
            <div className={cn(
              "w-4 h-4 rounded-md border transition-all flex items-center justify-center",
              showPerformance ? "bg-black dark:bg-white border-black dark:border-white shadow-sm" : "bg-white border-slate-200"
            )}>
              {showPerformance && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <span className={cn("text-[10px] font-black uppercase transition-colors tracking-widest", showPerformance ? "text-black dark:text-white" : "text-slate-400")}>销售业绩 (Revenue)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showOrders}
              onChange={() => setShowOrders(!showOrders)}
              className="hidden"
            />
            <div className={cn(
              "w-4 h-4 rounded-md border transition-all flex items-center justify-center",
              showOrders ? "bg-blue-500 border-blue-500 shadow-sm" : "bg-white border-slate-200"
            )}>
              {showOrders && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
            <span className={cn("text-[10px] font-black uppercase transition-colors tracking-widest", showOrders ? "text-blue-500" : "text-slate-400")}>订单数量 (Orders)</span>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <SafeGrid />
            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} stroke="#94a3b8" />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            {/* Tooltip removed */}
            {showPerformance && <Line yAxisId="left" type="monotone" dataKey="rev" stroke="#1d1d1f" strokeWidth={2} dot={false} />}
            {showOrders && <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
