import { useState, useEffect, useMemo } from 'react';
import { Users, Building2, Award, Target, Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronRight, GraduationCap, Briefcase, UserCheck, Phone, Mail, MapPin, Clock, Star, Zap, Calendar, TrendingUp, Search, Filter, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Tabs } from '../ui/Tabs';
import { supabase } from '../../lib/supabase';

interface StaffMember {
  id: string; fullName: string; title: string; department: string;
  phone: string; mobile: string; email: string;
  city: string; skills: string[]; isPrimary: boolean;
  status: string; joinDate: string; points: number; bio: string;
}
interface StaffRecord { id: string; type: string; title: string; date: string; data: Record<string, any>; }

const RECORD_TYPES = [
  { id: 'project', label: '参与项目', icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', fields: ['title','date','desc','amount'] },
  { id: 'customer', label: '重点客户', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', fields: ['title','date','desc','amount'] },
  { id: 'training', label: '培训认证', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', fields: ['title','date','desc','points'] },
  { id: 'activity', label: '参与活动', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50', fields: ['title','date','desc','points'] },
  { id: 'points', label: '积分记录', icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50', fields: ['title','date','desc','points'] },
  { id: 'change', label: '工作变动', icon: ArrowUpRight, color: 'text-indigo-600', bg: 'bg-indigo-50', fields: ['title','date','desc'] },
  { id: 'achievement', label: '成就奖励', icon: Star, color: 'text-orange-600', bg: 'bg-orange-50', fields: ['title','date','desc','points'] },
];

export const StaffManagementTab = ({ partnerId }: { partnerId: string }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [records, setRecords] = useState<Record<string, StaffRecord[]>>({});
  const [activeTab, setActiveTab] = useState('list');
  const [personTab, setPersonTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRecord, setShowAddRecord] = useState('');
  const [newRecord, setNewRecord] = useState({ title: '', date: new Date().toISOString().split('T')[0], desc: '', amount: 0, points: 0 });

  useEffect(() => { loadStaff(); }, [partnerId]);

  const loadStaff = async () => {
    const { data } = await supabase.from('partner_contacts').select('*').eq('partner_id', partnerId).order('is_primary', { ascending: false });
    if (data) setStaff(data.map((c: any) => ({
      id: c.id, fullName: [c.last_name, c.first_name].filter(Boolean).join('') || '未知',
      title: c.title || '', department: c.department || '', phone: c.phone || '', mobile: c.mobile || '',
      email: c.email || '', city: c.city || '', skills: c.skills || [],
      isPrimary: c.is_primary || false, status: c.status || 'active',
      joinDate: c.join_date || '', points: c.points || 0, bio: c.bio || '',
    })));
  };

  const loadRecords = async (contactId: string) => {
    const { data } = await supabase.from('staff_records').select('*').eq('contact_id', contactId).order('date', { ascending: false });
    if (data) setRecords(prev => ({ ...prev, [contactId]: data }));
  };

  const selectPerson = (id: string) => {
    setSelected(id); setPersonTab('overview'); setEditing(false);
    if (!records[id]) loadRecords(id);
  };

  const startEdit = (s: StaffMember) => {
    setEditing(true); setEditForm({ ...s, skillsStr: (s.skills || []).join('，') });
  };

  const saveEdit = async () => {
    await supabase.from('partner_contacts').update({
      title: editForm.title, department: editForm.department, city: editForm.city,
      skills: editForm.skillsStr.split(/[，,]/).map((s: string) => s.trim()).filter(Boolean),
      phone: editForm.phone, mobile: editForm.mobile, email: editForm.email,
      status: editForm.status, join_date: editForm.joinDate, bio: editForm.bio,
    }).eq('id', selected);
    setEditing(false); loadStaff();
  };

  const addRecord = async (type: string) => {
    if (!newRecord.title) return;
    await supabase.from('staff_records').insert({
      contact_id: selected, type, title: newRecord.title, date: newRecord.date,
      data: { desc: newRecord.desc, amount: newRecord.amount, points: newRecord.points },
    });
    setShowAddRecord(''); setNewRecord({ title: '', date: new Date().toISOString().split('T')[0], desc: '', amount: 0, points: 0 });
    loadRecords(selected!); loadStaff();
  };

  const deleteRecord = async (id: string) => {
    await supabase.from('staff_records').delete().eq('id', id);
    loadRecords(selected!); loadStaff();
  };

  const member = selected ? staff.find(s => s.id === selected) : null;
  const personRecords = selected ? (records[selected] || []) : [];
  const allRecords = Object.values(records).flat();

  // Aggregate for person overview
  const personStats = member ? {
    projects: personRecords.filter(r => r.type === 'project'),
    customers: personRecords.filter(r => r.type === 'customer'),
    trainings: personRecords.filter(r => r.type === 'training'),
    activities: personRecords.filter(r => r.type === 'activity'),
    pointsRecords: personRecords.filter(r => r.type === 'points'),
    changes: personRecords.filter(r => r.type === 'change'),
    achievements: personRecords.filter(r => r.type === 'achievement'),
    totalRevenue: personRecords.filter(r => r.type === 'customer' || r.type === 'project').reduce((s, r) => s + (r.data?.amount || 0), 0),
  } : null;

  if (staff.length === 0) return <div className="text-center py-12 text-sm text-neutral-400">暂无人员</div>;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { icon: Users, v: staff.length, l: '总人数', c: 'text-blue-600' },
          { icon: Award, v: staff.reduce((s,m) => s + m.points, 0), l: '总积分', c: 'text-emerald-600' },
          { icon: Briefcase, v: allRecords.filter(r => r.type === 'project').length, l: '项目', c: 'text-amber-600' },
          { icon: Users, v: allRecords.filter(r => r.type === 'customer').length, l: '客户', c: 'text-purple-600' },
          { icon: GraduationCap, v: allRecords.filter(r => r.type === 'training').length, l: '培训', c: 'text-blue-600' },
          { icon: Calendar, v: allRecords.filter(r => r.type === 'activity').length, l: '活动', c: 'text-emerald-600' },
        ].map((s, i) => (
          <Card key={i}><div className="flex items-center gap-2 p-2"><s.icon className={`w-4 h-4 ${s.c}`} /><div><p className="text-lg font-bold">{s.v}</p><p className="text-[10px] text-neutral-500">{s.l}</p></div></div></Card>
        ))}
      </div>

      <Tabs tabs={[{ id: 'list', label: `人员列表 (${staff.length})` }, { id: 'org', label: '组织架构' }]} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'org' && (
        <Card>
          <CardHeader><CardTitle><Building2 className="w-4 h-4 inline mr-1" />组织架构</CardTitle></CardHeader>
          <CardContent>
            {(() => {
              const primary = staff.find(s => s.isPrimary) || staff[0];
              const others = staff.filter(s => s.id !== primary?.id);
              const byDept: Record<string, StaffMember[]> = {};
              others.forEach(s => { const d = s.department || '其他'; if (!byDept[d]) byDept[d] = []; byDept[d].push(s); });
              return (
                <div className="flex flex-col items-center text-sm">
                  {/* CEO/Principal */}
                  {primary && (
                    <>
                      <div className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl text-center shadow-lg">
                        <p className="font-bold text-base">{primary.fullName}</p>
                        <p className="text-xs opacity-70">{primary.title}</p>
                        <div className="flex gap-1 mt-1 justify-center">{(primary.skills||[]).slice(0,3).map((s:string,i:number)=><span key={i} className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{s}</span>)}</div>
                      </div>
                      <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600" />
                    </>
                  )}
                  {/* Departments */}
                  <div className="flex gap-6 flex-wrap justify-center">
                    {Object.entries(byDept).map(([dept, members]) => (
                      <div key={dept} className="flex flex-col items-center">
                        <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600" />
                        <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-center min-w-[120px]">
                          <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{dept}</p>
                        </div>
                        <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-600" />
                        <div className="flex gap-3 flex-wrap justify-center">
                          {members.map(m => (
                            <div key={m.id} className="flex flex-col items-center">
                              <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-600" />
                              <div className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-center shadow-sm hover:shadow-md transition-shadow min-w-[100px]">
                                <p className="font-semibold text-neutral-900 dark:text-white">{m.fullName}</p>
                                <p className="text-xs text-neutral-500">{m.title}</p>
                                <div className="flex gap-1 mt-1 justify-center">{(m.skills||[]).slice(0,2).map((s:string,i:number)=><span key={i} className="px-1 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-[9px] text-neutral-500">{s}</span>)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {staff.length === 0 && <p className="py-8 text-neutral-400">暂无人员</p>}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {activeTab === 'list' && (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Person List */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">人员列表</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {staff.map(s => (
                <button key={s.id} onClick={() => selectPerson(s.id)}
                  className={`w-full text-left p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${selected === s.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">{s.fullName?.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.fullName}{s.isPrimary ? ' ★' : ''}</p>
                      <p className="text-xs text-neutral-400 truncate">{s.title || '-'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-emerald-600">{s.points}分</span>
                        <Badge variant={s.status === 'active' ? 'success' : 'default'} size="sm">{s.status === 'active' ? '在职' : s.status}</Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Person Detail */}
        <div className="lg:col-span-3 space-y-4">
          {!member ? (
            <Card><CardContent className="text-center py-12 text-sm text-neutral-400">← 选择左侧人员查看详情</CardContent></Card>
          ) : (
            <>
              {/* Person header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shrink-0">{member.fullName?.charAt(0)}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold">{member.fullName}</h3>
                          {member.isPrimary && <Badge variant="warning" size="sm">主联系人</Badge>}
                          <Badge variant={member.status === 'active' ? 'success' : 'default'} size="sm">{member.status === 'active' ? '在职' : member.status}</Badge>
                          <Badge variant="primary" size="sm">{member.points} 积分</Badge>
                        </div>
                        <p className="text-sm text-neutral-500">{member.title}{member.department ? ` · ${member.department}` : ''}{member.city ? ` · ${member.city}` : ''}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-neutral-400">
                          {member.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{member.email}</span>}
                          {member.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.mobile}</span>}
                          {member.joinDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />入职 {member.joinDate}</span>}
                        </div>
                        {member.skills?.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{member.skills.map((s: string, i: number) => <Badge key={i} variant="default" size="sm">{s}</Badge>)}</div>}
                        {member.bio && <p className="text-xs text-neutral-500 mt-2 italic">{member.bio}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(member)}><Pencil className="w-3.5 h-3.5" /></Button>
                  </div>

                  {/* Edit mode */}
                  {editing && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Input label="职位" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                      <Input label="部门" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                      <Input label="城市" value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})} />
                      <Input label="电话" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                      <Input label="手机" value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} />
                      <Input label="邮箱" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                      <Input label="入职日期" type="date" value={editForm.joinDate || ''} onChange={e => setEditForm({...editForm, joinDate: e.target.value})} />
                      <Select label="状态" value={editForm.status} options={[{value:'active',label:'在职'},{value:'inactive',label:'离职'}]} onChange={e => setEditForm({...editForm, status: e.target.value})} />
                      <div className="col-span-full"><Input label="技能（逗号分隔）" value={editForm.skillsStr} onChange={e => setEditForm({...editForm, skillsStr: e.target.value})} /></div>
                      <div className="col-span-full"><label className="block text-sm font-medium mb-1">简介</label><textarea className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} value={editForm.bio || ''} onChange={e => setEditForm({...editForm, bio: e.target.value})} /></div>
                      <div className="col-span-full flex gap-2 justify-end"><Button variant="secondary" size="sm" onClick={() => setEditing(false)}>取消</Button><Button variant="brand" size="sm" onClick={saveEdit}>保存</Button></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Person Tabs */}
              <Tabs tabs={[
                { id: 'overview', label: '概览' },
                { id: 'project', label: `项目 (${personStats?.projects.length || 0})` },
                { id: 'customer', label: `客户 (${personStats?.customers.length || 0})` },
                { id: 'training', label: `培训 (${personStats?.trainings.length || 0})` },
                { id: 'activity', label: `活动 (${personStats?.activities.length || 0})` },
                { id: 'points', label: `积分 (${personStats?.pointsRecords.length || 0})` },
                { id: 'change', label: `变动 (${personStats?.changes.length || 0})` },
              ]} activeTab={personTab} onChange={setPersonTab} />

              {/* Tab Content */}
              {personTab === 'overview' && personStats && (
                <div className="space-y-4">
                  {/* KPI grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: Briefcase, v: personStats.projects.length, l: '参与项目', sub: `总额 ¥${(personStats.totalRevenue/10000).toFixed(0)}万`, c: 'text-amber-600', bg: 'bg-amber-50' },
                      { icon: Users, v: personStats.customers.length, l: '重点客户', sub: `${personStats.customers.length}家`, c: 'text-purple-600', bg: 'bg-purple-50' },
                      { icon: GraduationCap, v: personStats.trainings.length, l: '培训认证', sub: `${personStats.trainings.filter(r=>r.data?.points).length}次获积分`, c: 'text-blue-600', bg: 'bg-blue-50' },
                      { icon: Calendar, v: personStats.activities.length, l: '参与活动', sub: `${personStats.activities.filter(r=>r.data?.points).length}次获积分`, c: 'text-emerald-600', bg: 'bg-emerald-50' },
                    ].map((k,i) => (
                      <Card key={i}><div className="p-3"><div className="flex items-center gap-2 mb-1"><div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}><k.icon className={`w-4 h-4 ${k.c}`} /></div><p className="text-xl font-bold">{k.v}</p></div><p className="text-xs text-neutral-500">{k.l}</p><p className="text-[10px] text-neutral-400">{k.sub}</p></div></Card>
                    ))}
                  </div>
                  {/* Recent timeline */}
                  <Card>
                    <CardHeader><CardTitle className="text-sm">最近动态</CardTitle></CardHeader>
                    <CardContent>
                      {personRecords.slice(0, 8).map(r => {
                        const cfg = RECORD_TYPES.find(t => t.id === r.type) || RECORD_TYPES[0];
                        const Icon = cfg.icon;
                        return (
                          <div key={r.id} className="flex items-start gap-3 py-2 border-b last:border-0 text-sm">
                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}><Icon className={`w-3.5 h-3.5 ${cfg.color}`} /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2"><Badge variant="default" size="sm">{cfg.label}</Badge><span className="font-medium truncate">{r.title}</span></div>
                              {r.data?.desc && <p className="text-xs text-neutral-400 mt-0.5">{r.data.desc}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-neutral-400">{r.date}</p>
                              {r.data?.points > 0 && <p className="text-xs text-emerald-600 font-medium">+{r.data.points}分</p>}
                              {r.data?.amount > 0 && <p className="text-xs text-amber-600">¥{(r.data.amount/10000).toFixed(0)}万</p>}
                            </div>
                          </div>
                        );
                      })}
                      {personRecords.length === 0 && <p className="text-sm text-neutral-400 py-4 text-center">暂无记录</p>}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Category tabs */}
              {RECORD_TYPES.map(rt => {
                if (personTab === 'overview') return null;
                if (rt.id === 'achievement' && personTab !== 'points') return null;
                if (personTab !== rt.id && !(personTab === 'points' && (rt.id === 'points' || rt.id === 'achievement')) && !(personTab === 'change' && rt.id === 'change')) return null;

                const list = personTab === 'points'
                  ? [...personStats!.pointsRecords, ...personStats!.achievements].sort((a,b) => b.date.localeCompare(a.date))
                  : personRecords.filter(r => r.type === rt.id);
                const total = list.reduce((s,r) => s + (r.data?.amount || 0), 0);
                const totalPoints = list.reduce((s,r) => s + (r.data?.points || 0), 0);

                return (
                  <Card key={rt.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${rt.bg} flex items-center justify-center`}><rt.icon className={`w-4 h-4 ${rt.color}`} /></div>
                        <div>
                          <CardTitle className="text-sm">{rt.label}</CardTitle>
                          <p className="text-xs text-neutral-400">
                            {list.length} 条记录
                            {total > 0 && ` · 总额 ¥${(total/10000).toFixed(0)}万`}
                            {totalPoints > 0 && ` · 积分 +${totalPoints}`}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setShowAddRecord(rt.id); setNewRecord({ title: '', date: new Date().toISOString().split('T')[0], desc: '', amount: 0, points: 0 }); }}><Plus className="w-3.5 h-3.5" />添加</Button>
                    </CardHeader>
                    <CardContent>
                      {showAddRecord === rt.id && (
                        <div className="p-3 mb-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={newRecord.title} onChange={e => setNewRecord({...newRecord, title: e.target.value})} placeholder="标题 *" />
                            <Input type="date" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} />
                            <div className="col-span-full"><Input value={newRecord.desc} onChange={e => setNewRecord({...newRecord, desc: e.target.value})} placeholder="描述" /></div>
                            {(rt.id === 'project' || rt.id === 'customer') && <Input type="number" value={newRecord.amount || ''} onChange={e => setNewRecord({...newRecord, amount: Number(e.target.value)})} placeholder="金额" />}
                            {(rt.id === 'training' || rt.id === 'activity' || rt.id === 'points') && <Input type="number" value={newRecord.points || ''} onChange={e => setNewRecord({...newRecord, points: Number(e.target.value)})} placeholder="积分" />}
                          </div>
                          <div className="flex gap-2 mt-2 justify-end">
                            <Button variant="secondary" size="sm" onClick={() => setShowAddRecord('')}>取消</Button>
                            <Button variant="brand" size="sm" onClick={() => addRecord(rt.id)}>添加</Button>
                          </div>
                        </div>
                      )}

                      {list.length === 0 ? (
                        <p className="text-sm text-neutral-400 py-4 text-center">暂无{rt.label}记录</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b text-xs text-neutral-500">{['标题','日期','描述',rt.id==='project'||rt.id==='customer'?'金额':'',rt.id==='training'||rt.id==='activity'||rt.id==='points'?'积分':'',''].filter(Boolean).map((h,i)=><th key={i} className={`text-left py-2 px-2 ${i===0?'':'text-right'}`}>{h}</th>)}<th className="w-8"></th></tr></thead>
                            <tbody className="divide-y">
                              {list.map(r => (
                                <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                  <td className="py-2 px-2 font-medium">{r.title}</td>
                                  <td className="py-2 px-2 text-neutral-400 text-xs text-right">{r.date}</td>
                                  <td className="py-2 px-2 text-neutral-400 text-xs text-right max-w-[200px] truncate">{r.data?.desc || '-'}</td>
                                  {(rt.id === 'project' || rt.id === 'customer') && <td className="py-2 px-2 text-right text-xs">{r.data?.amount > 0 ? `¥${(r.data.amount/10000).toFixed(0)}万` : '-'}</td>}
                                  {(rt.id === 'training' || rt.id === 'activity' || rt.id === 'points') && <td className="py-2 px-2 text-right text-xs text-emerald-600">{r.data?.points > 0 ? `+${r.data.points}` : '-'}</td>}
                                  <td className="py-2 px-2"><button onClick={() => deleteRecord(r.id)} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }).filter(Boolean)}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
