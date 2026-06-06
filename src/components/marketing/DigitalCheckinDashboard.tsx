import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Users, UserCheck, Clock, MapPin, Phone, Building2, X, RefreshCw, TrendingUp, Award } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

interface DigitalCheckinDashboardProps { open: boolean; onClose: () => void; }

export const DigitalCheckinDashboard: React.FC<DigitalCheckinDashboardProps> = ({ open, onClose }) => {
  const [stats, setStats] = useState({ expected: 120, checkedIn: 87, vipCount: 12, directorCount: 8, totalLeads: 42 });
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (open) loadData(); }, [open]);

  const loadData = async () => {
    setLoading(true);
    // Simulate real-time check-in data
    setAttendees([
      { name: '张建国', company: '浙江省立医院', title: '信息中心主任', level: 'VIP', checkedIn: true, time: '09:15', source: '邀请' },
      { name: '李明华', company: '苏州市卫健委', title: '副主任', level: 'VIP', checkedIn: true, time: '09:22', source: '邀请' },
      { name: '王芳', company: '上海瑞金医院', title: 'IT总监', level: '总监', checkedIn: true, time: '09:30', source: '报名' },
      { name: '赵强', company: '深圳市人民医院', title: '副院长', level: 'VIP', checkedIn: true, time: '09:45', source: '邀请' },
      { name: '陈晓东', company: '北京协和医院', title: '信息科科长', level: '总监', checkedIn: true, time: '10:00', source: '报名' },
      { name: '刘伟', company: '广州市医保局', title: '处长', level: 'VIP', checkedIn: false, time: '-', source: '邀请' },
      { name: '孙丽', company: '武汉同济医院', title: '护理部主任', level: '总监', checkedIn: false, time: '-', source: '报名' },
      { name: '周涛', company: '成都市第一人民医院', title: '信息中心主任', level: 'VIP', checkedIn: false, time: '-', source: '邀请' },
    ]);
    setLoading(false);
  };

  const rate = stats.expected > 0 ? Math.round(stats.checkedIn / stats.expected * 100) : 0;

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><QrCode className="w-5 h-5 text-brand" /><h2 className="text-lg font-semibold">数字化签到 · 实时战报</h2></div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="md"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />实时更新中</Badge>
              <Button variant="secondary" size="sm" onClick={loadData}><RefreshCw className="w-4 h-4" /></Button>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b">
            {[
              { label: '应到', value: stats.expected, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: '实到', value: stats.checkedIn, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'VIP客户', value: stats.vipCount, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: '总监级+', value: stats.directorCount, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: '签到率', value: `${rate}%`, icon: Clock, color: rate >= 70 ? 'text-emerald-600' : 'text-red-500', bg: rate >= 70 ? 'bg-emerald-50' : 'bg-red-50 dark:bg-red-900/20' },
            ].map(s => (
              <div key={s.label} className={cn('p-3 rounded-xl', s.bg)}>
                <div className="flex items-center gap-2"><s.icon className={cn('w-4 h-4', s.color)} /><span className="text-xs text-neutral-500">{s.label}</span></div>
                <p className={cn('text-xl font-semibold mt-1', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="px-6 py-3 border-b">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1"><span>签到进度</span><span>{stats.checkedIn}/{stats.expected} ({rate}%)</span></div>
            <ProgressBar value={rate} max={100} />
          </div>

          {/* Attendee list */}
          <div className="p-6">
            <h3 className="text-sm font-semibold mb-3">到场客户画像</h3>
            <div className="space-y-1">
              {attendees.map((a, i) => (
                <div key={i} className={cn('flex items-center justify-between px-4 py-3 rounded-lg text-sm', a.checkedIn ? 'bg-emerald-50/50 dark:bg-emerald-900/5' : 'bg-neutral-50 dark:bg-neutral-800/30')}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn('w-2 h-2 rounded-full', a.checkedIn ? 'bg-emerald-500' : 'bg-neutral-300')} />
                    <span className="font-medium text-neutral-900 dark:text-white">{a.name}</span>
                    <span className="text-neutral-400">|</span>
                    <span className="text-neutral-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{a.company}</span>
                    <span className="text-neutral-400">|</span>
                    <span className="text-neutral-500">{a.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge size="sm" variant={a.level === 'VIP' ? 'warning' : 'default'}>{a.level}</Badge>
                    <Badge size="sm" variant={a.checkedIn ? 'success' : 'default'}>{a.checkedIn ? `✓ ${a.time}` : '未签到'}</Badge>
                    <span className="text-xs text-neutral-400">{a.source}</span>
                    {!a.checkedIn && <Button variant="ghost" size="sm">催促</Button>}
                  </div>
                </div>
              ))}
            </div>

            {/* QR Code section */}
            <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-center">
              <p className="text-sm font-semibold mb-2">现场签到二维码</p>
              <div className="w-32 h-32 mx-auto bg-white rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center">
                <QrCode className="w-20 h-20 text-neutral-400" />
              </div>
              <p className="text-xs text-neutral-400 mt-2">扫码签到 · 数据实时回传</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
