import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Download, Eye, Star, TrendingUp, Lightbulb, X, Search, Filter, Copy, ExternalLink, Target, Image as ImageIcon, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface MarketingAssetLibraryProps { open: boolean; onClose: () => void; }

const TYPE_LABELS: Record<string, string> = { h5_template: 'H5模板', ppt_deck: 'PPT演讲稿', poster: '海报模板', whitepaper: '白皮书', video: '视频', other: '其他' };
const TYPE_ICONS: Record<string, any> = { h5_template: Copy, ppt_deck: FileText, poster: Image, whitepaper: FileText, video: Eye, other: Package };

export const MarketingAssetLibrary: React.FC<MarketingAssetLibraryProps> = ({ open, onClose }) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { if (open) loadAssets(); }, [open]);

  const loadAssets = async () => {
    setLoading(true);
    const { data } = await supabase.from('marketing_assets').select('*').order('downloads', { ascending: false });
    if (data) setAssets(data);
    setLoading(false);
  };

  const filtered = assets.filter(a => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (search && !a.name.includes(search) && !a.description?.includes(search)) return false;
    return true;
  });

  const recommendations = [
    { title: '检测到制造业近期商机转化率高', desc: '推荐发起"制造客户沙龙"，历史平均ROI为 1:5', icon: TrendingUp },
    { title: '医疗行业活动到场率最高', desc: '建议增加医疗行业线下峰会频次', icon: Target },
  ];

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[90vw] max-w-5xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">营销资料库</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"><X className="w-5 h-5" /></button>
          </div>

          {/* Smart Recommendations */}
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">智能活动推荐</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {recommendations.map((r, i) => (
                <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-center gap-2"><r.icon className="w-4 h-4 text-amber-600" /><span className="text-sm font-medium text-amber-800 dark:text-amber-300">{r.title}</span></div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 pb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="text" placeholder="搜索物料..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 rounded-lg border text-sm" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-9 px-3 rounded-lg border text-sm">
              <option value="all">全部类型</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* Assets Grid */}
          <div className="px-6 pb-6">
            {loading ? <div className="text-center py-8 text-neutral-400">加载中...</div> : filtered.length === 0 ? <div className="text-center py-8 text-neutral-400">暂无匹配物料</div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(asset => {
                  const IconComp = TYPE_ICONS[asset.type] || Package;
                  return (
                    <Card key={asset.id} hover>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center"><IconComp className="w-5 h-5 text-brand" /></div>
                            <div>
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{asset.name}</p>
                              <Badge size="sm">{TYPE_LABELS[asset.type] || asset.type}</Badge>
                            </div>
                          </div>
                          {asset.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-2">{asset.description}</p>
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <span>📥 {asset.downloads || 0} 次下载</span>
                          {asset.avg_roi && <span>平均ROI 1:{asset.avg_roi}</span>}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button variant="secondary" size="sm" className="flex-1"><Download className="w-3.5 h-3.5 mr-1" />下载源文件</Button>
                          <Button variant="ghost" size="sm" title="一键复制使用"><Copy className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

