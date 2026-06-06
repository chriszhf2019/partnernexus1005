import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, Calendar, Clock, Package, MapPin, X, ShoppingCart, CheckCircle2, Wrench } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ResourceMarketplaceProps { open: boolean; onClose: () => void; }

export const ResourceMarketplace: React.FC<ResourceMarketplaceProps> = ({ open, onClose }) => {
  const [experts, setExperts] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (open) loadData(); }, [open]);

  const loadData = async () => {
    setLoading(true);
    const { data: exp } = await supabase.from('expert_bookings').select('*');
    if (exp) setExperts(exp);
    const { data: eq } = await supabase.from('equipment_rentals').select('*');
    if (eq) setEquipment(eq);
    setLoading(false);
  };

  const handleBookExpert = async (expertId: string) => {
    await supabase.from('expert_bookings').update({ status: 'booked', booked_by: '当前用户' }).eq('id', expertId);
    loadData();
  };

  const handleBookEquipment = async (itemId: string) => {
    await supabase.from('equipment_rentals').update({ status: 'booked', booked_by: '当前用户', booking_date: new Date().toISOString() }).eq('id', itemId);
    loadData();
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><Package className="w-5 h-5 text-brand" /><h2 className="text-lg font-semibold">资源市场</h2></div>
            <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"><X className="w-5 h-5" /></button>
          </div>

          {/* Experts */}
          <div className="p-6 border-b">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4" />大咖/演讲嘉宾预约</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {experts.map(expert => (
                <Card key={expert.id}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold">{expert.expert_name}</h4>
                        <p className="text-xs text-neutral-500">{expert.title}</p>
                      </div>
                      <Badge variant={expert.status === 'available' ? 'success' : 'warning'} size="sm">
                        {expert.status === 'available' ? '可预约' : '已预约'}
                      </Badge>
                    </div>
                    <div className="space-y-1 mb-3">
                      <p className="text-xs text-neutral-500"><span className="font-medium">产品线:</span> {expert.product_line}</p>
                      <div className="flex flex-wrap gap-1">
                        {(expert.expertise || []).map((skill: string) => <span key={skill} className="text-xs px-1.5 py-0.5 bg-brand/5 text-brand rounded">{skill}</span>)}
                      </div>
                    </div>
                    {expert.available_slots && (expert.available_slots as any[]).length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-neutral-500 mb-1">可选时段:</p>
                        {(expert.available_slots as any[]).slice(0, 2).map((slot: any, i: number) => (
                          <div key={i} className="text-xs text-neutral-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{slot.date} {slot.slots?.join(', ')}</div>
                        ))}
                      </div>
                    )}
                    <Button variant="brand" size="sm" className="w-full" disabled={expert.status !== 'available'} onClick={() => handleBookExpert(expert.id)}>
                      <Calendar className="w-3.5 h-3.5 mr-1" />{expert.status === 'available' ? '预约专家' : '已预约'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Wrench className="w-4 h-4" />场地与物料租赁</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.map(item => (
                <Card key={item.id} hover>
                  <CardContent>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold">{item.name}</h4>
                        <p className="text-xs text-neutral-500">{item.description}</p>
                      </div>
                      <Badge variant={item.available > 0 ? 'success' : 'warning'} size="sm">
                        {item.available > 0 ? `余${item.available}件` : '已借完'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-neutral-400">总量: {item.quantity}件</span>
                      <Button variant="secondary" size="sm" disabled={item.available <= 0} onClick={() => handleBookEquipment(item.id)}>
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" />申请借用
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
