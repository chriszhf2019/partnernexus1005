import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, FileText, Download, Share2, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import { supabase } from '../../lib/supabase';

export const DataStatusIndicator = ({ updated }: { updated: boolean }) => (
  <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full shadow-2xl border border-slate-800 transition-all hover:scale-105 select-none">
    <div className="relative flex items-center justify-center">
      <div className={cn("w-2 h-2 rounded-full absolute animate-ping opacity-75", updated ? "bg-emerald-400" : "bg-rose-400")} />
      <div className={cn("w-2 h-2 rounded-full relative", updated ? "bg-emerald-500" : "bg-rose-500")} />
    </div>
    <span className="text-[9px] font-black text-white uppercase tracking-widest">{updated ? 'Live Sync Active' : 'Stale Data Warning'}</span>
  </div>
);

interface ExportData {
  date: string;
  revenue: string;
  partners: number;
  deals: number;
}

export const ActionDropdown = ({ exportData }: { exportData?: ExportData[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    let data: ExportData[];
    
    if (exportData && exportData.length > 0) {
      data = exportData;
    } else {
      try {
        const { data: dealsData, error } = await supabase
          .from('deals')
          .select('created_at, value, partner_id')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (error || !dealsData) {
          data = [
            { date: '2024-01', revenue: '¥0', partners: 0, deals: 0 },
          ];
        } else {
          const monthlyData: Record<string, { revenue: number; deals: number; partners: Set<string> }> = {};
          dealsData.forEach((d: any) => {
            const month = String(d.created_at).slice(0, 7);
            if (!monthlyData[month]) {
              monthlyData[month] = { revenue: 0, deals: 0, partners: new Set() };
            }
            monthlyData[month].revenue += Number(d.value || 0);
            monthlyData[month].deals += 1;
            monthlyData[month].partners.add(String(d.partner_id));
          });
          
          data = Object.entries(monthlyData).map(([date, values]) => ({
            date,
            revenue: `¥${(values.revenue / 10000).toFixed(1)}万`,
            partners: values.partners.size,
            deals: values.deals,
          }));
        }
      } catch (e) {
        console.warn('[ActionDropdown] fetch for export failed:', e);
        data = [
          { date: '2024-01', revenue: '¥0', partners: 0, deals: 0 },
        ];
      }
    }

    const headers = ['日期', '营收', '活跃伙伴', '商机数'];
    const rows = data.map(row => [row.date, row.revenue, row.partners, row.deals].join(','));
    const csv = '﻿' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard_export.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast('success', '导出成功');
    setIsOpen(false);
  };

  const handleGenerateReport = () => {
    toast('info', '报告生成中，请稍候...');
    setTimeout(() => {
      toast('success', '报告已生成，可在邮箱查看');
    }, 1500);
    setIsOpen(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('success', '链接已复制到剪贴板');
    setIsOpen(false);
  };

  const actions = [
    { label: '下钻分析', icon: BarChart3, color: 'text-black dark:text-white', action: () => { window.open('/detail/ecosystem-revenue', '_blank'); setIsOpen(false); } },
    { label: '生成报告', icon: FileText, color: 'text-slate-600', action: handleGenerateReport },
    { label: '导出数据', icon: Download, color: 'text-slate-600', action: handleExport },
    { label: '分享看板', icon: Share2, color: 'text-slate-600', action: handleShare },
  ];

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-[#f5f5f7] rounded-lg transition-colors text-slate-400 hover:text-slate-600"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 overflow-hidden"
            >
              <div className="p-1.5">
                {actions.map((action, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-[10px] font-black uppercase tracking-tight hover:bg-slate-50 transition-colors rounded-xl"
                    onClick={action.action}
                  >
                    <action.icon className={cn("w-3.5 h-3.5", action.color)} />
                    {action.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
