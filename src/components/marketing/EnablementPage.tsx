import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Tabs } from '../ui/Tabs';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Award, Users, BookOpen, GraduationCap, Target, Zap, Clock, Trophy, Monitor, Handshake, Megaphone, Star, Pencil, Trash2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';

// Training framework definition
const FRAMEWORK = {
  '技术认证': { icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50', desc: '产品技术能力与解决方案架构' },
  '销售赋能': { icon: Handshake, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: '销售技能与客户关系管理' },
  '市场营销': { icon: Megaphone, color: 'text-purple-600', bg: 'bg-purple-50', desc: '品牌推广与市场活动执行' },
};

const TRAINING_TYPES = {
  '讲座': { icon: BookOpen, label: 'PPT讲座', desc: '理论授课与案例分析' },
  '动手实验': { icon: Monitor, label: '动手实验', desc: '实际操作与动手练习' },
  '官方认证': { icon: Award, label: '官方认证', desc: '原厂认证考试' },
  '竞赛': { icon: Trophy, label: '竞赛', desc: '技能竞赛与排名' },
};

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const LEVELS = ['初级', '中级', '高级', '专家级'];
const BADGES = ['🥇', '🥈', '🥉', '🏆', '⭐', '💎', '🔥', '🚀'];

export const EnablementPage = () => {
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('framework');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('all');
  const [filterQuarter, setFilterQuarter] = useState('all');
  const [form, setForm] = useState({
    name: '', category: '技术认证', type: '讲座', level: '初级', quarter: 'Q2',
    description: '', points: 10, badge: '⭐', total_target: 50, duration: '2小时'
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [progRes, certRes] = await Promise.all([
      supabase.from('certification_programs').select('*').order('category').order('level'),
      supabase.from('partner_certifications').select('*'),
    ]);
    if (progRes.data) setPrograms(progRes.data);
    if (certRes.data) setCertifications(certRes.data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.name) return;
    const data = { ...form, total_target: Number(form.total_target), points: Number(form.points), updated_at: new Date().toISOString() };
    if (editId) {
      await supabase.from('certification_programs').update(data).eq('id', editId);
    } else {
      await supabase.from('certification_programs').insert({ id: crypto.randomUUID(), ...data });
    }
    setShowForm(false); setEditId(null);
    setForm({ name: '', category: '技术认证', type: '讲座', level: '初级', quarter: 'Q2', description: '', points: 10, badge: '⭐', total_target: 50, duration: '2小时' });
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return;
    await supabase.from('certification_programs').delete().eq('id', id);
    loadData();
  };

  const startEdit = (p: any) => {
    setEditId(p.id);
    setForm({ name: p.name, category: p.category, type: p.type, level: p.level, quarter: p.quarter, description: p.description || '', points: p.points || 10, badge: p.badge || '⭐', total_target: p.total_target || 50, duration: p.duration || '2小时' });
    setShowForm(true);
  };

  // Stats
  const totalPrograms = programs.length;
  const totalCertified = certifications.reduce((s, c) => s + (c.certified_count || 0), 0);
  const totalPoints = programs.reduce((s, p) => s + (p.points || 0), 0);
  const byCategory = useMemo(() => {
    const m: Record<string, any[]> = {};
    programs.forEach(p => { const cat = p.category || '其他'; if (!m[cat]) m[cat] = []; m[cat].push(p); });
    return m;
  }, [programs]);

  const filtered = programs.filter(p => {
    if (filterCat !== 'all' && p.category !== filterCat) return false;
    if (filterQuarter !== 'all' && p.quarter !== filterQuarter) return false;
    return true;
  });

  // Group by quarter
  const byQuarter = useMemo(() => {
    const m: Record<string, any[]> = {};
    filtered.forEach(p => { const q = p.quarter || 'Q2'; if (!m[q]) m[q] = []; m[q].push(p); });
    return m;
  }, [filtered]);

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-neutral-400"><GraduationCap className="w-4 h-4 mr-2 animate-pulse" />加载培训数据...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">赋能培训中心</h1><p className="text-sm text-neutral-500 mt-1">技术认证 · 销售赋能 · 市场营销</p></div>
        <Button variant="brand" size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', category: '技术认证', type: '讲座', level: '初级', quarter: 'Q2', description: '', points: 10, badge: '⭐', total_target: 50, duration: '2小时' }); }}><Plus className="w-4 h-4" />新建培训课程</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, v: totalPrograms, l: '培训课程', c: 'text-blue-600' },
          { icon: Users, v: totalCertified, l: '已认证人数', c: 'text-emerald-600' },
          { icon: Award, v: totalPoints, l: '总可获得积分', c: 'text-amber-600' },
          { icon: Target, v: certifications.length, l: '认证记录', c: 'text-purple-600' },
        ].map((s, i) => (
          <Card key={i}><div className="flex items-center gap-3 p-3"><div className={`w-10 h-10 rounded-lg ${s.c.includes('blue')?'bg-blue-50':s.c.includes('emerald')?'bg-emerald-50':s.c.includes('amber')?'bg-amber-50':'bg-purple-50'} flex items-center justify-center`}><s.icon className={s.c} /></div><div><p className="text-xl font-bold">{s.v}</p><p className="text-xs text-neutral-500">{s.l}</p></div></div></Card>
        ))}
      </div>

      {/* Training Framework */}
      <Tabs tabs={[{ id: 'framework', label: '培训框架' }, { id: 'quarterly', label: '季度计划' }, { id: 'records', label: '认证记录' }]} activeTab={activeTab} onChange={setActiveTab} />

      {/* Framework View */}
      {activeTab === 'framework' && (
        <div className="space-y-4">
          {Object.entries(FRAMEWORK).map(([cat, cfg]) => {
            const catPrograms = byCategory[cat] || [];
            const isExpanded = expandedCat === cat;
            const CatIcon = cfg.icon;
            return (
              <Card key={cat}>
                <div className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50" onClick={() => setExpandedCat(isExpanded ? null : cat)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}><CatIcon className={`w-5 h-5 ${cfg.color}`} /></div>
                      <div>
                        <h3 className="font-semibold">{cat}</h3>
                        <p className="text-xs text-neutral-500">{cfg.desc} · {catPrograms.length} 门课程</p>
                      </div>
                    </div>
                    <button className="p-1">{isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}</button>
                  </div>
                  {/* Type distribution within category */}
                  <div className="flex gap-2 mt-3">
                    {Object.entries(TRAINING_TYPES).map(([t, tcfg]) => {
                      const count = catPrograms.filter(p => p.type === t).length;
                      const TIcon = tcfg.icon;
                      return (
                        <div key={t} className="flex items-center gap-1 text-xs text-neutral-500">
                          <TIcon className="w-3 h-3" /> {tcfg.label}: {count}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {isExpanded && (
                  <CardContent className="border-t pt-4">
                    {catPrograms.length === 0 ? (
                      <p className="text-sm text-neutral-400 py-2 text-center">暂无课程，点击"新建培训课程"添加</p>
                    ) : (
                      <div className="space-y-2">
                        {catPrograms.map(p => {
                          const tcfg = TRAINING_TYPES[p.type as keyof typeof TRAINING_TYPES] || TRAINING_TYPES['讲座'];
                          const TIcon = tcfg.icon;
                          return (
                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center`}><TIcon className={`w-4 h-4 ${cfg.color}`} /></div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{p.name}</span>
                                    <Badge variant="default" size="sm">{p.level}</Badge>
                                    <Badge variant="info" size="sm">{tcfg.label}</Badge>
                                    <span className="text-xs text-amber-600">+{p.points}分</span>
                                    <span className="text-xs">{p.badge}</span>
                                  </div>
                                  <p className="text-xs text-neutral-400 mt-0.5">{p.description || p.duration} · 目标{p.total_target}人</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); startEdit(p); }} className="p-1 text-neutral-400 hover:text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Quarterly View */}
      {activeTab === 'quarterly' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={filterQuarter} options={[{value:'all',label:'全部季度'},...QUARTERS.map(q=>({value:q,label:q}))]} onChange={e => setFilterQuarter(e.target.value)} />
            <Select value={filterCat} options={[{value:'all',label:'全部类别'},...Object.keys(FRAMEWORK).map(c=>({value:c,label:c}))]} onChange={e => setFilterCat(e.target.value)} />
          </div>
          {QUARTERS.filter(q => filterQuarter === 'all' || filterQuarter === q).map(q => {
            const qPrograms = byQuarter[q] || [];
            if (filterQuarter !== 'all' && q !== filterQuarter) return null;
            return (
              <Card key={q}>
                <CardHeader><CardTitle>{q} 季度培训计划 ({qPrograms.length}门)</CardTitle></CardHeader>
                <CardContent>
                  {qPrograms.length === 0 ? (
                    <p className="text-sm text-neutral-400 py-2 text-center">暂无{q}课程，点击"新建培训课程"添加</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b text-xs text-neutral-500"><th className="text-left py-2 px-2">课程</th><th className="text-left py-2 px-2">类别</th><th className="text-left py-2 px-2">类型</th><th className="text-left py-2 px-2">等级</th><th className="text-right py-2 px-2">积分</th><th className="text-center py-2 px-2">徽章</th><th className="text-right py-2 px-2">目标人数</th></tr></thead>
                        <tbody className="divide-y">
                          {qPrograms.map(p => (
                            <tr key={p.id} className="hover:bg-neutral-50">
                              <td className="py-2 px-2 font-medium">{p.name}</td>
                              <td className="py-2 px-2"><Badge variant="default" size="sm">{p.category}</Badge></td>
                              <td className="py-2 px-2 text-xs">{p.type}</td>
                              <td className="py-2 px-2 text-xs">{p.level}</td>
                              <td className="py-2 px-2 text-right text-emerald-600">+{p.points}</td>
                              <td className="py-2 px-2 text-center text-lg">{p.badge}</td>
                              <td className="py-2 px-2 text-right text-xs">{p.total_target}人</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Certification Records */}
      {activeTab === 'records' && (
        <Card>
          <CardHeader><CardTitle>认证完成记录</CardTitle></CardHeader>
          <CardContent>
            {certifications.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">暂无认证记录，完成培训后自动记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-xs text-neutral-500"><th className="text-left py-2 px-2">伙伴</th><th className="text-left py-2 px-2">认证课程</th><th className="text-right py-2 px-2">已认证</th><th className="text-right py-2 px-2">即将过期</th><th className="text-center py-2 px-2">状态</th></tr></thead>
                  <tbody className="divide-y">
                    {certifications.map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-2 px-2 font-medium">{c.partner_name || '-'}</td>
                        <td className="py-2 px-2">{c.program_name || '-'}</td>
                        <td className="py-2 px-2 text-right">{c.certified_count || 0}</td>
                        <td className="py-2 px-2 text-right text-amber-600">{c.expiry_count || 0}</td>
                        <td className="py-2 px-2 text-center"><Badge variant={c.expiry_count > 0 ? 'warning' : 'success'} size="sm">{c.expiry_count > 0 ? '有即将过期' : '正常'}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editId ? '编辑课程' : '新建培训课程'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <Input label="课程名称 *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="如：云原生架构师认证" />
              <div className="grid grid-cols-2 gap-3">
                <Select label="培训类别" value={form.category} options={Object.keys(FRAMEWORK).map(c => ({value:c, label:c}))} onChange={e => setForm({...form, category: e.target.value})} />
                <Select label="培训形式" value={form.type} options={Object.entries(TRAINING_TYPES).map(([k,v]) => ({value:k, label:v.label}))} onChange={e => setForm({...form, type: e.target.value})} />
                <Select label="难度等级" value={form.level} options={LEVELS.map(l => ({value:l, label:l}))} onChange={e => setForm({...form, level: e.target.value})} />
                <Select label="所属季度" value={form.quarter} options={QUARTERS.map(q => ({value:q, label:q}))} onChange={e => setForm({...form, quarter: e.target.value})} />
                <Input label="可获得积分" type="number" value={form.points} onChange={e => setForm({...form, points: Number(e.target.value)})} />
                <Select label="完成徽章" value={form.badge} options={BADGES.map(b => ({value:b, label:b}))} onChange={e => setForm({...form, badge: e.target.value})} />
                <Input label="目标培训人数" type="number" value={form.total_target} onChange={e => setForm({...form, total_target: Number(e.target.value)})} />
                <Input label="课程时长" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="如：2小时/3天" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">课程描述</label>
                <textarea className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="课程内容、目标、适合人群等" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>取消</Button>
                <Button variant="brand" size="sm" onClick={handleSave}><Save className="w-4 h-4" />{editId ? '保存修改' : '创建课程'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
