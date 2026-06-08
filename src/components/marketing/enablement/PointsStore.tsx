import { useState, useEffect, useRef } from 'react';
import { Star, ShoppingCart, Gift, Monitor, Users, Package, Target, Clock, X, TrendingUp, Flame, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';

interface StoreItem {
  name: string;
  cost: number;
  originalCost?: number;
  icon: typeof Gift;
  emoji: string;
  category: 'merch' | 'rights' | 'service';
  description: string;
  details: string[];
  limit?: number;
  redeemed?: number;
  tag?: { label: string; color: string };
}

interface PointsStoreProps {
  earnedPoints: number;
  onNavigateToLearning?: () => void;
}

const STORE_ITEMS: StoreItem[] = [
  {
    name: '免费易拉宝套装',
    cost: 50,
    icon: Gift, emoji: '🎁',
    category: 'merch',
    description: '高品质易拉宝展架套装，助力线下活动推广',
    details: ['2套易拉宝展架（含底座）', '定制品牌画面', '全国包邮', '7个工作日内发货'],
    limit: 50, redeemed: 42,
    tag: { label: '热销', color: 'bg-red-500' },
  },
  {
    name: '营销物料大礼包',
    cost: 80, originalCost: 100,
    icon: Package, emoji: '📦',
    category: 'merch',
    description: '100份单页+2套易拉宝+品牌海报，一站式营销物料',
    details: ['100份彩色单页', '2套易拉宝', '5张品牌海报', '10个品牌手提袋', '全国包邮'],
    limit: 30, redeemed: 25,
    tag: { label: '限时8折', color: 'bg-purple-500' },
  },
  {
    name: 'Demo机试用30天',
    cost: 100,
    icon: Monitor, emoji: '💻',
    category: 'rights',
    description: '最新产品样机免费试用一个月，深度体验产品功能',
    details: ['最新型号样机一台', '试用期30天', '免费归还物流', '需签署试用协议'],
    limit: 10, redeemed: 7,
    tag: { label: '限量', color: 'bg-amber-500' },
  },
  {
    name: '优先商机分配权(月)',
    cost: 150,
    icon: Target, emoji: '🎯',
    category: 'rights',
    description: '获得一个月内优先匹配高质量商机的权益',
    details: ['30天优先商机匹配', '每日最多3条优质线索', '专属客户经理对接', '到期自动取消'],
    limit: 20, redeemed: 8,
  },
  {
    name: '原厂专家现场支持',
    cost: 200,
    icon: Users, emoji: '👨‍🏫',
    category: 'service',
    description: '原厂技术专家上门提供2天现场技术支持和培训',
    details: ['2天现场服务', '1名资深技术专家', '包含差旅费用', '需提前2周预约排期'],
    limit: 5, redeemed: 3,
    tag: { label: '稀缺', color: 'bg-orange-500' },
  },
  {
    name: '年度峰会VIP席位',
    cost: 300,
    icon: Star, emoji: '⭐',
    category: 'rights',
    description: '年度合作伙伴峰会VIP席位，含往返机票和五星级酒店住宿',
    details: ['VIP前排座位', '往返机票（国内）', '两晚五星级酒店', 'VIP晚宴入场', '限量20席'],
    limit: 20, redeemed: 12,
    tag: { label: '限量', color: 'bg-amber-500' },
  },
];

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'merch', label: '🎁 实物周边' },
  { key: 'rights', label: '📋 经营权益' },
  { key: 'service', label: '👨‍🏫 专家服务' },
];

export const PointsStore = ({ earnedPoints, onNavigateToLearning }: PointsStoreProps) => {
  const [category, setCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Points count-up animation on mount
  useEffect(() => {
    const target = earnedPoints;
    const duration = 800;
    const steps = 20;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    animRef.current = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), target);
      setAnimatedPoints(current);
      if (step >= steps) {
        clearInterval(animRef.current);
        setAnimatedPoints(target);
      }
    }, duration / steps);

    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [earnedPoints]);

  const filtered = STORE_ITEMS.filter(item => category === 'all' || item.category === category);
  const nearMiss = (cost: number) => cost > earnedPoints && cost - earnedPoints <= 20;

  const handleOpenDetail = (item: StoreItem) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleRedeem = (item: StoreItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (earnedPoints >= item.cost) {
      if (confirm(`确认使用 ${item.cost} 积分兑换「${item.name}」？`)) {
        alert(`✅ 兑换成功！${item.name}将在 3-5 个工作日内处理。`);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* ═══ Points Header ═══ */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">可用积分</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-amber-600">{animatedPoints}</span>
                <span className="text-sm text-amber-500">⭐</span>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-neutral-500">
            <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <TrendingUp className="w-3 h-3" />积分明细
            </button>
            <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <Clock className="w-3 h-3" />我的兑换
            </button>
          </div>
        </div>
        {/* Expiry warning */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-[11px]">
          <span className="text-amber-600">⏳ 12 积分将于本月底过期</span>
          <span className="text-amber-500 cursor-pointer font-medium hover:underline">去使用 →</span>
        </div>
      </div>

      {/* ═══ Category Filter ═══ */}
      <div className="flex items-center gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors',
              category === cat.key
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
          >
            {cat.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-neutral-400">{filtered.length} 件商品</span>
      </div>

      {/* ═══ Product Grid ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item, i) => {
          const affordable = earnedPoints >= item.cost;
          const isNearMiss = nearMiss(item.cost);
          const pointsDiff = item.cost - earnedPoints;

          return (
            <div
              key={i}
              onClick={() => handleOpenDetail(item)}
              className={cn(
                'group relative p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg cursor-pointer transition-all',
                !affordable && 'opacity-75'
              )}
            >
              {/* Tags */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                {item.tag && (
                  <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold text-white', item.tag.color)}>
                    {item.tag.label}
                  </span>
                )}
                {item.limit && (
                  <span className="text-[9px] text-neutral-400 ml-auto">
                    剩 {item.limit - (item.redeemed || 0)} 份
                  </span>
                )}
              </div>

              {/* Icon */}
              <div className="flex items-center justify-center mt-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {item.emoji}
                </div>
              </div>

              {/* Info */}
              <div className="text-center">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">{item.name}</h4>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-3">{item.description}</p>

                {/* Price */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  {item.originalCost && (
                    <span className="text-xs text-neutral-400 line-through">⭐{item.originalCost}</span>
                  )}
                  <span className="text-lg font-extrabold text-amber-600">⭐{item.cost}</span>
                </div>

                {/* Social proof */}
                {item.redeemed && (
                  <p className="text-[9px] text-neutral-400 mb-2">
                    🔥 已有 {item.redeemed} 人兑换 · 好评率 98%
                  </p>
                )}

                {/* Action button */}
                {affordable ? (
                  <Button variant="brand" size="sm" className="w-full" onClick={(e) => handleRedeem(item, e as any)}>
                    <ShoppingCart className="w-3 h-3 mr-1" />立即兑换
                  </Button>
                ) : isNearMiss ? (
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-red-500 font-semibold mb-1.5">
                      <Flame className="w-3 h-3" />仅需再获 {pointsDiff} 积分
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-amber-600 border-amber-300" onClick={(e) => { e.stopPropagation(); onNavigateToLearning?.(); }}>
                      去学习赚积分 <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" className="w-full" disabled onClick={(e) => e.stopPropagation()}>
                    还差 {pointsDiff} 积分
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ Recent Redemptions ═══ */}
      <div className="flex items-center gap-3 px-3 py-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-[10px] text-neutral-500 overflow-hidden">
        <span className="font-medium shrink-0">📦 最近兑换：</span>
        <div className="flex gap-4 overflow-x-auto whitespace-nowrap">
          <span><b className="text-neutral-700 dark:text-neutral-300">张伟</b> 兑换了「Demo机试用30天」</span>
          <span><b className="text-neutral-700 dark:text-neutral-300">李明</b> 兑换了「专家现场支持」</span>
          <span><b className="text-neutral-700 dark:text-neutral-300">王芳</b> 兑换了「营销物料大礼包」</span>
        </div>
      </div>

      {/* ═══ Product Detail Modal ═══ */}
      <AnimatePresence>
        {showDetail && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-700 px-5 py-4 flex items-center justify-between z-10">
                <h3 className="font-bold text-neutral-900 dark:text-white">{selectedItem.name}</h3>
                <button onClick={() => setShowDetail(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Hero */}
                <div className="flex items-center justify-center py-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <span className="text-6xl">{selectedItem.emoji}</span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-amber-600">⭐{selectedItem.cost}</span>
                    {selectedItem.originalCost && (
                      <span className="text-sm text-neutral-400 line-through ml-2">⭐{selectedItem.originalCost}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedItem.tag && (
                      <Badge variant="danger" size="sm">{selectedItem.tag.label}</Badge>
                    )}
                    {selectedItem.limit && (
                      <span className="text-[10px] text-neutral-400">
                        剩 {selectedItem.limit - (selectedItem.redeemed || 0)}/{selectedItem.limit} 份
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-neutral-600 dark:text-neutral-400">{selectedItem.description}</p>

                {/* Details checklist */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">📋 礼包清单 / 权益详情</h4>
                  <div className="space-y-1.5">
                    {selectedItem.details.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12px] text-neutral-600 dark:text-neutral-400">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notice */}
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-[11px] text-neutral-500">
                  <p><b>兑换须知：</b>兑换后有效期 90 天。实物商品 3-5 个工作日发货。权益类商品兑换后立即生效。</p>
                </div>

                {/* Redeem CTA */}
                {earnedPoints >= selectedItem.cost ? (
                  <Button variant="brand" size="md" className="w-full" onClick={() => { setShowDetail(false); handleRedeem(selectedItem, {} as any); }}>
                    立即兑换 · ⭐{selectedItem.cost}
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-[11px] text-red-500 font-medium mb-2">
                      还差 {selectedItem.cost - earnedPoints} 积分 · 继续学习课程即可获得
                    </p>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => { setShowDetail(false); onNavigateToLearning?.(); }}>
                      去学习赚积分 →</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
