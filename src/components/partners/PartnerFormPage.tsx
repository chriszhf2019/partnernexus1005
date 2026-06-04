import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Save, ArrowLeft, Plus, Trash2, Upload, Info, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { partnerService } from '../../services/partner-service';
import type { PartnerContact } from '../../types';

const emptyContact: PartnerContact = {
  salutation: '', firstName: '', lastName: '', title: '', department: '', phone: '', mobile: '', email: '', isPrimary: false,
};

const inputClass = 'w-full h-10 px-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand dark:focus:border-brand-light transition-all';
const labelClass = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5';

const InfoBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>
);

const chipActive = 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white';
const chipInactive = 'bg-white dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300';
const chipClass = (active: boolean) => `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? chipActive : chipInactive}`;

export const PartnerFormPage = () => {
  const { t } = useLanguage();
  const { config } = useConfig();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  const typeOptions = (config?.partnerTypes || ['Reseller', 'ISV', 'SI', 'Service', 'VAD', 'VAR', 'OEM']).map((v) => ({ value: v, label: v }));

  const [form, setForm] = useState({
    name: '', englishName: '', logo: '', website: '', unifiedSocialCreditCode: '',
    type: 'Reseller', city: '', location: '', province: '', district: '',
    industries: [] as string[], industryCustom: '', regions: [] as string[], regionCustom: '',
    cooperationScope: '', vendors: {} as Record<string, string>,
  });

  const [contacts, setContacts] = useState<PartnerContact[]>([{ ...emptyContact, isPrimary: true }]);
  const [opportunities, setOpportunities] = useState<{ name: string; customer: string; amount: string }[]>([{ name: '', customer: '', amount: '' }]);
  const [targetCustomers, setTargetCustomers] = useState<{ name: string; industry: string; potential: string }[]>([{ name: '', industry: '', potential: '' }]);

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));
  const addContact = () => setContacts((prev) => [...prev, { ...emptyContact }]);
  const updateContact = (i: number, f: keyof PartnerContact, v: string) => setContacts((prev) => prev.map((c, j) => (j === i ? { ...c, [f]: v } : c)));
  const removeContact = (i: number) => setContacts((prev) => prev.filter((_, j) => j !== i));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const url = ev.target?.result as string; setLogoPreview(url); updateField('logo', url); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim()) { toast('error', '请输入合作伙伴中文名称'); return; }
    setSaving(true);
    try {
      await partnerService.create({
        name: form.name,
        englishName: form.englishName,
        logo: form.logo,
        website: form.website,
        tier: 'Registered',
        status: 'Prospective',
        type: form.type,
        manager: '',
        location: form.location,
        region: form.regionCustom || form.regions?.[0] || '华北',
        startDate: new Date().toISOString().split('T')[0],
        years: 0,
        prevTier: 'Registered',
        tags: Object.keys(form.vendors).filter(Boolean),
        winRate: 0,
        contacts: contacts.filter((c) => c.lastName || c.firstName),
        unifiedSocialCreditCode: form.unifiedSocialCreditCode,
        industry: [...form.industries, form.industryCustom].filter(Boolean).join('、'),
        cooperationScope: form.cooperationScope,
        isCorePartner: false,
        province: form.province,
        city: form.city,
        district: form.district,
        registeredAddress: form.location,
        customerPortfolio: targetCustomers.filter(c => c.name).map(c => ({
          id: crypto.randomUUID(), name: c.name, industry: c.industry || '',
          relationship: '潜在客户', annualRevenue: 0, majorProjects: [],
          salesLead: '', products: [], status: '跟进中', since: new Date().toISOString().split('T')[0],
          contactPerson: '', contactPhone: '', notes: c.potential || '',
        })),
      });
      toast('success', '提交成功，等待批复');
      navigate('/partners');
    } catch (err: any) {
      toast('error', `提交失败: ${err.message || '请重试'}`);
    } finally { setSaving(false); }
  }, [form, contacts, navigate, toast]);

  const industryOptions = (config?.industries || ['金融', '医疗', '政务', '制造', '教育']).map((v) => ({ value: v, label: v }));
  const vendors = config?.partnerVendors || ['华为', '浪潮', '联想', 'Oracle', 'AWS', '阿里云'];


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <button type="button" onClick={() => navigate('/partners')} className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium text-sm mb-1"><ArrowLeft className="w-4 h-4" />返回列表</button>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">合作伙伴注册申请</h1>
          <p className="text-sm text-neutral-500 mt-1">请填写贵公司的基本信息，提交后由渠道经理审核批复</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">提交后进入待批复状态，由渠道经理审核</span>
          <Button variant="brand" size="sm" onClick={handleSubmit} loading={saving}><Save className="w-4 h-4" />提交注册申请</Button>
        </div>
      </div>

      {/* 基础信息 */}
      <InfoBlock title="基础信息">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>中文名称 *</label>
            <input className={inputClass} value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="公司全称（中文）" />
          </div>
          <div>
            <label className={labelClass}>英文名称</label>
            <input className={inputClass} value={form.englishName} onChange={(e) => updateField('englishName', e.target.value)} placeholder="Company Name" />
          </div>
          <div>
            <label className={labelClass}>公司Logo（可选）</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border shrink-0 overflow-hidden">
                {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" /> : <Building2 className="w-7 h-7 text-neutral-400" />}
              </div>
              <label className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <Upload className="w-4 h-4 text-neutral-500" />上传图片
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>
          <div>
            <label className={labelClass}>企业网址</label>
            <input className={inputClass} value={form.website} onChange={(e) => updateField('website', e.target.value)} placeholder="https://www.example.com" />
          </div>
          <div>
            <label className={labelClass}>合作伙伴类型</label>
            <div className="relative">
              <select className={inputClass + ' appearance-none cursor-pointer pr-10'} value={form.type} onChange={(e) => updateField('type', e.target.value)}>
                {typeOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1"><Info className="w-3 h-3" />如有疑问请咨询渠道经理</p>
          </div>
          <div>
            <label className={labelClass}>统一社会信用代码</label>
            <input className={inputClass} value={form.unifiedSocialCreditCode} onChange={(e) => updateField('unifiedSocialCreditCode', e.target.value)} placeholder="18位信用代码" />
          </div>
          <div>
            <label className={labelClass}>省份</label>
            <input className={inputClass} value={form.province} onChange={(e) => updateField('province', e.target.value)} placeholder="如：北京" />
          </div>
          <div>
            <label className={labelClass}>所在城市</label>
            <input className={inputClass} value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="如：北京市" />
          </div>
          <div>
            <label className={labelClass}>区/县</label>
            <input className={inputClass} value={form.district} onChange={(e) => updateField('district', e.target.value)} placeholder="如：海淀区" />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>详细地址</label>
            <input className={inputClass} value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="如：中关村科技园A座" />
          </div>
        </div>
      </InfoBlock>

      {/* 行业与区域覆盖 */}
      <InfoBlock title="行业与区域覆盖">
        <div className="space-y-6">
          <div>
            <label className={labelClass}>所属行业（可多选）</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {industryOptions.map((opt) => (
                <button key={opt.value} type="button" onClick={() => updateField('industries', form.industries.includes(opt.value) ? form.industries.filter((v: string) => v !== opt.value) : [...form.industries, opt.value])} className={chipClass(form.industries.includes(opt.value))}>{opt.label}</button>
              ))}
            </div>
            <input className={inputClass} value={form.industryCustom} onChange={(e) => updateField('industryCustom', e.target.value)} placeholder="其他行业（自行填写）" />
          </div>
          <div>
            <label className={labelClass}>覆盖区域（可多选）</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[{ v: '华北', l: '华北' }, { v: '华东', l: '华东' }, { v: '华南', l: '华南' }, { v: '西部', l: '西部' }, { v: '华中', l: '华中' }].map((opt) => (
                <button key={opt.v} type="button" onClick={() => updateField('regions', form.regions.includes(opt.v) ? form.regions.filter((v: string) => v !== opt.v) : [...form.regions, opt.v])} className={chipClass(form.regions.includes(opt.v))}>{opt.l}</button>
              ))}
            </div>
            <input className={inputClass} value={form.regionCustom} onChange={(e) => updateField('regionCustom', e.target.value)} placeholder="其他区域（自行填写）" />
          </div>
        </div>
      </InfoBlock>

      {/* 产品与方案能力 */}
      <InfoBlock title="产品与方案能力">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>合作厂商及资质等级（点击选择厂商，填写合作资质）</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {[...vendors, '其他'].map((vendor: string) => {
                const selected = form.vendors[vendor] !== undefined;
                return (
                  <div key={vendor} className={`p-3 rounded-xl border transition-all ${selected ? 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-900/10' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'}`}>
                    <button type="button" onClick={() => {
                      if (selected) { const v = { ...form.vendors }; delete v[vendor]; updateField('vendors', v); }
                      else updateField('vendors', { ...form.vendors, [vendor]: '' });
                    }} className="w-full text-left text-sm font-medium">{vendor}</button>
                    {selected && (
                      <input className="w-full mt-2 text-xs px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-neutral-900 dark:text-white"
                        value={form.vendors[vendor]} onChange={(e) => updateField('vendors', { ...form.vendors, [vendor]: e.target.value })} placeholder="如：金牌代理、认证代理" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <textarea className="w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 text-neutral-900 dark:text-white placeholder:text-neutral-400" rows={2} value={form.cooperationScope}
            onChange={(e) => updateField('cooperationScope', e.target.value)} placeholder="请描述贵公司的合作范围、业务模式及核心能力" />
        </div>
      </InfoBlock>

      {/* 已有商机 + 目标客户 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoBlock title="已有商机">
          <p className="text-xs text-neutral-400 mb-4">贵公司当前正在跟进的项目或商机（选填）</p>
          {opportunities.map((opp, i) => (
            <div key={i} className="flex gap-2 mb-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <div className="flex-1 space-y-2">
                <input className={inputClass} value={opp.name} onChange={(e) => { const o = [...opportunities]; o[i] = { ...o[i], name: e.target.value }; setOpportunities(o); }} placeholder="项目名称" />
                <input className={inputClass} value={opp.customer} onChange={(e) => { const o = [...opportunities]; o[i] = { ...o[i], customer: e.target.value }; setOpportunities(o); }} placeholder="客户名称" />
                <input className={inputClass} value={opp.amount} onChange={(e) => { const o = [...opportunities]; o[i] = { ...o[i], amount: e.target.value }; setOpportunities(o); }} placeholder="预估金额（万元）" />
              </div>
              {opportunities.length > 1 && <button type="button" onClick={() => setOpportunities(opportunities.filter((_, j) => j !== i))} className="text-neutral-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setOpportunities([...opportunities, { name: '', customer: '', amount: '' }])}><Plus className="w-3.5 h-3.5" />添加商机</Button>
        </InfoBlock>

        <InfoBlock title="目标客户">
          <p className="text-xs text-neutral-400 mb-4">贵公司计划拓展的目标客户（选填）</p>
          {targetCustomers.map((tc, i) => (
            <div key={i} className="flex gap-2 mb-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <div className="flex-1 space-y-2">
                <input className={inputClass} value={tc.name} onChange={(e) => { const t = [...targetCustomers]; t[i] = { ...t[i], name: e.target.value }; setTargetCustomers(t); }} placeholder="客户名称" />
                <input className={inputClass} value={tc.industry} onChange={(e) => { const t = [...targetCustomers]; t[i] = { ...t[i], industry: e.target.value }; setTargetCustomers(t); }} placeholder="所属行业" />
                <input className={inputClass} value={tc.potential} onChange={(e) => { const t = [...targetCustomers]; t[i] = { ...t[i], potential: e.target.value }; setTargetCustomers(t); }} placeholder="预计合作金额/规模" />
              </div>
              {targetCustomers.length > 1 && <button type="button" onClick={() => setTargetCustomers(targetCustomers.filter((_, j) => j !== i))} className="text-neutral-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setTargetCustomers([...targetCustomers, { name: '', industry: '', potential: '' }])}><Plus className="w-3.5 h-3.5" />添加目标客户</Button>
        </InfoBlock>
      </div>

      {/* 联系人 */}
      <InfoBlock title="联系人信息">
        {contacts.map((c, i) => (
          <div key={i} className={`p-4 rounded-xl border-2 mb-3 ${c.isPrimary ? 'border-amber-200 dark:border-amber-800 bg-amber-50/20' : 'border-neutral-200 dark:border-neutral-800'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">联系人 #{i + 1} {c.isPrimary && '(主要)'}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer"><input type="radio" name="primary" checked={c.isPrimary} onChange={() => setContacts((prev) => prev.map((x, j) => ({ ...x, isPrimary: j === i })))} />主要联系人</label>
                {contacts.length > 1 && <button type="button" onClick={() => removeContact(i)} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['salutation', 'lastName', 'firstName', 'title', 'department', 'phone', 'mobile', 'email'] as const).map((field) => (
                <input key={field} className={inputClass}
                  value={(c[field] as string) || ''} onChange={(e) => updateContact(i, field, e.target.value)}
                  placeholder={field === 'salutation' ? '称呼' : field === 'lastName' ? '姓' : field === 'firstName' ? '名' : field === 'title' ? '职位' : field === 'department' ? '部门' : field === 'phone' ? '电话' : field === 'mobile' ? '手机' : '邮箱'} />
              ))}
            </div>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addContact}><Plus className="w-4 h-4" />添加联系人</Button>
      </InfoBlock>

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="secondary" onClick={() => navigate('/partners')}>取消</Button>
        <Button variant="brand" onClick={handleSubmit} loading={saving}><Save className="w-4 h-4" />提交注册申请</Button>
      </div>
    </div>
  );
};
