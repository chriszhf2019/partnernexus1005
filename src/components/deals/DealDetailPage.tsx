import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle2, XCircle, Calendar, User, MapPin, ArrowRight,
  DollarSign, Target, GitBranch, AlertCircle, ChevronLeft, Edit3, Save, X,
  TrendingUp, TrendingDown, History, Plus, Trash2, Sparkles,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { Deal, DealLifecycleStage, DealLifecycleEvent } from '../../types';
import { dealService } from '../../services/deal-service';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { PageLoader } from '../ui/PageLoader';
import { AIPanel } from '../ui/AIPanel';
import { SearchableSelect } from '../ui/SearchableSelect';

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  'Registered':    { label: '已报备', color: 'text-neutral-700', bgColor: 'bg-neutral-100', icon: FileText },
  'UnderReview':   { label: '审批中', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Clock },
  'Approved':      { label: '已批复', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle2 },
  'Solution':      { label: '方案跟进', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Target },
  'Commercial':    { label: '商务洽谈', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: DollarSign },
  'ClosedWon':     { label: '赢单', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle2 },
  'ClosedLost':    { label: '丢单', color: 'text-red-500', bgColor: 'bg-red-50', icon: XCircle },
};

export const DealDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { config } = useConfig();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [changeLog, setChangeLog] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<Deal[]>([]);

  useEffect(() => {
    if (!id) { setLoading(false); setError('未找到商机ID'); return; }
    Promise.all([
      dealService.getById(id),
      supabase.from('deal_lifecycle_events').select('*').eq('deal_id', id).order('event_date', { ascending: false }),
      supabase.from('partners').select('id,name,tier').order('name'),
    ]).then(([d, { data: events }, { data: partnerList }]) => {
      if (d) {
        setDeal(d);
        setEditForm({ title: d.title, customerName: d.customerName, value: d.value, partnerId: d.partnerId, partnerName: d.partnerName, region: d.region, productType: d.productType, salesName: d.salesName, status: d.status, stage: d.stage, description: d.description || '', salesTeam: (d as any).salesTeam || '销售自建' });
        // Check duplicates
        dealService.list().then(r => {
          const dups = r.items.filter(x => x.id !== d.id && x.customerName === d.customerName);
          setDuplicates(dups);
        });
      } else { setError('未找到该商机'); }
      if (events) setChangeLog(events);
      if (partnerList) setPartners(partnerList);
      setLoading(false);
    }).catch(() => { setError('获取商机信息失败'); setLoading(false); });
  }, [id]);

  const daysStale = useMemo(() => {
    if (!deal) return 0;
    const lastDate = deal.lastActivityDate || deal.createdDate;
    if (!lastDate) return 0;
    return Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
  }, [deal]);

  const hasNoProgress = useMemo(() => {
    if (!deal) return false;
    return daysStale > 7 && !['ClosedWon','ClosedLost'].includes(deal.stage);
  }, [deal, daysStale]);

  const handleSave = async () => {
    if (!deal) return;
    setSaving(true);
    try {
      const changes: string[] = [];
      if (editForm.title !== deal.title) changes.push(`标题: ${deal.title} → ${editForm.title}`);
      if (editForm.customerName !== deal.customerName) changes.push(`客户: ${deal.customerName} → ${editForm.customerName}`);
      if (Number(editForm.value) !== deal.value) changes.push(`金额: ¥${deal.value} → ¥${editForm.value}`);
      if (editForm.stage !== deal.stage) changes.push(`阶段: ${deal.stage} → ${editForm.stage}`);

      await dealService.update(deal.id, {
        title: editForm.title,
        customerName: editForm.customerName,
        value: Number(editForm.value),
        partnerId: editForm.partnerId,
        partnerName: editForm.partnerName,
        region: editForm.region,
        productType: editForm.productType,
        salesName: editForm.salesName,
        status: editForm.status,
        stage: editForm.stage as DealLifecycleStage,
        description: editForm.description,
        lastActivityDate: new Date().toISOString().split('T')[0],
      } as any);

      // Record change log
      if (changes.length > 0) {
        await supabase.from('deal_lifecycle_events').insert({
          deal_id: deal.id,
          stage: editForm.stage,
          event_date: new Date().toISOString().split('T')[0],
          description: changes.join('; '),
          actor: '编辑更新',
        });
      }

      setDeal({ ...deal, ...editForm, value: Number(editForm.value), lastActivityDate: new Date().toISOString().split('T')[0] });
      setEditing(false);
      // Refresh change log
      const { data: events } = await supabase.from('deal_lifecycle_events').select('*').eq('deal_id', deal.id).order('event_date', { ascending: false });
      if (events) setChangeLog(events);
    } catch (e: any) { alert('保存失败: ' + e.message); }
    setSaving(false);
  };

  const handleStageChange = async (newStage: string, desc: string) => {
    if (!deal) return;
    try {
      await dealService.update(deal.id, {
        stage: newStage as any,
        status: newStage === 'ClosedWon' ? 'Closed Won' : newStage === 'ClosedLost' ? 'Closed Lost' : 'Approved',
        lastActivityDate: new Date().toISOString().split('T')[0],
      } as any);
      await supabase.from('deal_lifecycle_events').insert({
        deal_id: deal.id, stage: newStage, event_date: new Date().toISOString().split('T')[0],
        description: desc, actor: '阶段推进',
      });
      window.location.reload();
    } catch (e: any) { alert('操作失败: ' + e.message); }
  };

  if (loading) return <PageLoader />;
  if (!deal || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="w-12 h-12 text-neutral-300" />
        <p className="text-lg font-semibold text-neutral-400">{error || '未找到商机'}</p>
        <button onClick={() => navigate('/deals')} className="text-sm text-brand hover:underline flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> 返回商机列表</button>
      </div>
    );
  }

  const stageCfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG['Registered'];
  const StageIcon = stageCfg.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/deals')} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            {editing ? (
              <input className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none w-full" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
            ) : (
              <h1 className="text-2xl font-bold">{deal.title}</h1>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', stageCfg.bgColor, stageCfg.color)}>
                <StageIcon className="w-3.5 h-3.5" />{stageCfg.label}
              </span>
              {hasNoProgress && <Badge variant="warning" size="sm">⚠ {daysStale}天未更新</Badge>}
              {duplicates.length > 0 && <Badge variant="danger" size="sm">⚠ 疑似重复({duplicates.length})</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <><Button variant="brand" size="sm" onClick={handleSave} loading={saving}><Save className="w-4 h-4" />保存</Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)}><X className="w-4 h-4" />取消</Button></>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Edit3 className="w-4 h-4" />编辑</Button>
          )}
          <AIPanel trigger="icon" title="AI 商机分析" config={{ aiApiKey: config.aiApiKey as string, aiBaseUrl: config.aiBaseUrl as string, aiModel: config.aiModel as string }}
            prompt={`分析商机：${deal.title}，客户${deal.customerName}，金额¥${deal.value}，阶段${deal.stage}，伙伴${deal.partnerName}。${daysStale}天未更新。请评估赢单概率和下一步建议。`}
            context="你是商机分析专家，用中文简洁回复。"
          />
        </div>
      </div>

      {/* Alerts */}
      {hasNoProgress && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700">
          ⚠️ 该商机已 <b>{daysStale} 天</b> 未更新，当前阶段「{stageCfg.label}」，建议尽快推进或更新状态。
        </div>
      )}
      {duplicates.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700">
          ⚠️ 发现 {duplicates.length} 个疑似重复商机（相同客户「{deal.customerName}」）：
          {duplicates.map(d => <span key={d.id} className="ml-2 text-xs underline cursor-pointer" onClick={() => navigate(`/deals/${d.id}`)}>{d.title}</span>)}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '客户名称', field: 'customerName', icon: User },
          { label: '商机金额', field: 'value', icon: DollarSign, type: 'number' },
          { label: '所属区域', field: 'region', icon: MapPin },
          { label: '产品类型', field: 'productType', icon: Target },
          { label: '销售负责人', field: 'salesName', icon: User },
          { label: '商机来源', field: 'salesTeam', icon: GitBranch },
          { label: '报备日期', value: deal.createdDate, icon: Calendar },
          { label: '最后更新', value: deal.lastActivityDate || deal.createdDate, icon: Clock },
        ].map((f) => (
          <Card key={f.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-neutral-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-500">{f.label}</p>
                {editing && f.field && !f.value ? (
                  f.type === 'number' ? (
                    <input className="text-sm font-semibold w-full bg-transparent border-b border-blue-500 focus:outline-none" type="number" value={editForm[f.field] || ''} onChange={e => setEditForm({...editForm, [f.field]: e.target.value})} />
                  ) : (
                    <input className="text-sm font-semibold w-full bg-transparent border-b border-blue-500 focus:outline-none" value={editForm[f.field] || ''} onChange={e => setEditForm({...editForm, [f.field]: e.target.value})} />
                  )
                ) : (
                  <p className="text-sm font-semibold">{f.value || (f.field ? (editForm[f.field] || '-') : '-')}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Partner & Description (editable) */}
      {editing && (
        <Card>
          <CardHeader><CardTitle>编辑详细信息</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">合作伙伴</label>
              <SearchableSelect value={editForm.partnerId} onChange={(id, label) => setEditForm({...editForm, partnerId: id, partnerName: label})} options={partners.map((p:any) => ({id:p.id, label:p.name, sub:p.tier}))} placeholder="搜索合作伙伴..." className="w-full" />
            </div>
            <Select label="商机阶段" value={editForm.stage} options={Object.entries(STAGE_CONFIG).map(([k,v]) => ({value:k, label:v.label}))} onChange={e => setEditForm({...editForm, stage: e.target.value})} />
            <Select label="状态" value={editForm.status} options={[{value:'Pending',label:'待审批'},{value:'Approved',label:'已批复'},{value:'Closed Won',label:'赢单'},{value:'Closed Lost',label:'丢单'}]} onChange={e => setEditForm({...editForm, status: e.target.value})} />
            <div className="col-span-2">
              <label className="text-xs font-medium mb-1 block">描述</label>
              <textarea className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage Actions */}
      <Card>
        <CardHeader><CardTitle>推进阶段</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {deal.stage === 'Registered' && (
              <Button variant="brand" size="sm" onClick={() => handleStageChange('Approved', '审批通过')}><CheckCircle2 className="w-4 h-4" /> 审批通过</Button>
            )}
            {deal.stage === 'Approved' && (
              <Button variant="brand" size="sm" onClick={() => handleStageChange('Solution', '进入方案跟进')}><ArrowRight className="w-4 h-4" /> 进入方案跟进</Button>
            )}
            {deal.stage === 'Solution' && (
              <Button variant="brand" size="sm" onClick={() => handleStageChange('Commercial', '进入商务洽谈')}><ArrowRight className="w-4 h-4" /> 进入商务洽谈</Button>
            )}
            {deal.stage === 'Commercial' && (<>
              <Button variant="brand" size="sm" onClick={() => handleStageChange('ClosedWon', '赢单')}><TrendingUp className="w-4 h-4" /> 赢单</Button>
              <Button variant="danger" size="sm" onClick={() => handleStageChange('ClosedLost', '丢单')}><TrendingDown className="w-4 h-4" /> 丢单</Button>
            </>)}
            {['ClosedWon','ClosedLost'].includes(deal.stage) && (
              <p className="text-sm text-neutral-500">该商机已关闭</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle + Change Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle><History className="w-4 h-4 inline mr-1" />变更记录</CardTitle></CardHeader>
          <CardContent>
            {changeLog.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">暂无变更记录</p>
            ) : (
              <div className="relative before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-neutral-200 dark:before:bg-neutral-800">
                {changeLog.map((ev: any, idx: number) => (
                  <div key={idx} className="relative pl-8 pb-4 last:pb-0">
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-neutral-400" />
                    </div>
                    <p className="text-sm font-medium">{ev.description}</p>
                    <p className="text-xs text-neutral-400">{ev.event_date} · {ev.actor || '系统'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle><Target className="w-4 h-4 inline mr-1" />统计信息</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">创建日期</span><span>{deal.createdDate || '-'}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">最后更新</span><span className={daysStale > 7 ? 'text-amber-600 font-medium' : ''}>{deal.lastActivityDate || deal.createdDate || '-'} ({daysStale}天前)</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">当前阶段</span><Badge variant="info" size="sm">{stageCfg.label}</Badge></div>
            <div className="flex justify-between"><span className="text-neutral-500">变更次数</span><span>{changeLog.length} 次</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">合作伙伴</span><span>{deal.partnerName || '-'}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">疑似重复</span><span className={duplicates.length > 0 ? 'text-red-500 font-medium' : ''}>{duplicates.length > 0 ? `${duplicates.length}个` : '无'}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
