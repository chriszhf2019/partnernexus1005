import { useState, useEffect, useMemo } from 'react';
import { User, Building2, Shield, Globe, Save, Plus, Trash2, Pencil, Check, X, Lock, Key, Clock, Smartphone, AlertTriangle, Mail, ToggleLeft, ShieldCheck, ShieldAlert, BarChart3, TrendingUp, MessageSquare, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS, isInternalRole, isExternalRole, type UserRole } from '../../services/auth-service';
import { permissionService, PERMISSION_CATEGORIES, type PermissionDef } from '../../services/permission-service';
import { useToast } from '../ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Tabs } from '../ui/Tabs';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { GlobalConfig } from '../../types';

interface SystemUser { id: string; name: string; email: string; role: UserRole; department: string; phone: string; status: 'active' | 'inactive'; lastLogin: string; source: 'admin' | 'partner'; partnerId?: string; partnerName?: string; }
interface OperationLog { id: string; userId: string; userName: string; action: 'create' | 'update' | 'status_change'; field?: string; oldValue?: string; newValue?: string; timestamp: string; operator: string; }
interface CompanyInfo { nameCN: string; nameEN: string; logo: string; address: string; phone: string; email: string; website: string; businessModel: string; annualTarget: string; quarterlyTarget: string; partnerTarget: string; channelRegions: string; coreBusiness: string; }

interface SecuritySettings { require2FA: boolean; passwordMinLength: number; passwordExpireDays: number; sessionTimeoutMin: number; loginAttempts: number; ipWhitelist: string; }

const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
const deptOptions = [
  { value: '管理层', label: '管理层' }, { value: '渠道部', label: '渠道部' }, { value: '市场部', label: '市场部' },
  { value: '销售部', label: '销售部' }, { value: '技术部', label: '技术部' }, { value: '运营部', label: '运营部' },
  { value: '渠道商', label: '渠道商（外部）' },
];

const defaultCompany: CompanyInfo = {
  nameCN: '', nameEN: '',
  logo: '', address: '',
  phone: '', email: '', website: '',
  businessModel: '',
  annualTarget: '', quarterlyTarget: '',
  partnerTarget: '', channelRegions: '', coreBusiness: '',
};

export const SettingsPage = () => {
  const { t, language, setLanguage } = useLanguage();
  const { config, updateConfig, isLoading } = useConfig();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('company');
  const [saving, setSaving] = useState(false);

  // ── Company state ───────────────────────────────────
  const [editingConfig, setEditingConfig] = useState({
    ...config,
    companyName: config.companyName || defaultCompany.nameCN,
    companyNameEn: config.companyNameEn || defaultCompany.nameEN,
    companyAddress: config.companyAddress || defaultCompany.address,
    companyPhone: config.companyPhone || defaultCompany.phone,
    companyEmail: config.companyEmail || defaultCompany.email,
    companyWebsite: config.companyWebsite || defaultCompany.website,
    businessModel: config.businessModel || defaultCompany.businessModel,
    annualTarget: config.annualTarget || defaultCompany.annualTarget,
    quarterlyTarget: config.quarterlyTarget || defaultCompany.quarterlyTarget,
    partnerTarget: config.partnerTarget || defaultCompany.partnerTarget,
    channelRegions: config.channelRegions || defaultCompany.channelRegions,
    coreBusiness: config.coreBusiness || defaultCompany.coreBusiness,
  });

  // ── User management state ───────────────────────────
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [partnerUsers, setPartnerUsers] = useState<SystemUser[]>([]);
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<SystemUser>({ id: '', name: '', email: '', role: 'channel_manager', department: '渠道部', phone: '', status: 'active', lastLogin: '-', source: 'admin' });
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [activeUserTab, setActiveUserTab] = useState<'all' | 'internal' | 'partner'>('all');

  // Load real internal users from Supabase Auth + localStorage
  useEffect(() => {
    // Load from localStorage first (user-created internal users)
    const saved = localStorage.getItem('internal_users');
    if (saved) {
      try { setUsers(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Persist internal users to localStorage on changes
  useEffect(() => {
    const internalUsers = users.filter(u => u.source === 'admin');
    if (internalUsers.length > 0) {
      localStorage.setItem('internal_users', JSON.stringify(internalUsers));
    }
  }, [users]);

  // Load partner contacts from Supabase → display as partner users
  useEffect(() => {
    import('../../lib/supabase').then(({ supabase }) => {
      supabase.from('partner_contacts').select('*').order('partner_id').then(({ data }: any) => {
        if (data?.length) {
          // Also get partner names
          supabase.from('partners').select('id,name').then(({ data: partners }: any) => {
            const partnerMap: Record<string, string> = {};
            (partners || []).forEach((p: any) => { partnerMap[p.id] = p.name; });
            const mapped: SystemUser[] = data.map((c: any) => ({
              id: c.id,
              name: [c.last_name, c.first_name].filter(Boolean).join('') || c.email || '-',
              email: c.email || '',
              role: 'partner_sales' as UserRole,
              department: c.title || '合作伙伴',
              phone: c.mobile || c.phone || '',
              status: 'active' as const,
              lastLogin: '-',
              source: 'partner' as const,
              partnerId: c.partner_id,
              partnerName: partnerMap[c.partner_id] || c.partner_id,
            }));
            setPartnerUsers(mapped);
          });
        }
      });
    }).catch(() => {});
  }, []);

  // Merge internal + partner users for display
  const allUsers = useMemo(() => {
    const internalIds = new Set(users.map(u => u.id));
    const newPartnerUsers = partnerUsers.filter(pu => !internalIds.has(pu.id));
    return [...users, ...newPartnerUsers];
  }, [users, partnerUsers]);

  const addLog = (action: OperationLog['action'], user: SystemUser, field?: string, oldValue?: string, newValue?: string) => {
    const newLog: OperationLog = {
      id: 'log' + Date.now(),
      userId: user.id,
      userName: user.name,
      action,
      field,
      oldValue,
      newValue,
      timestamp: new Date().toLocaleString('zh-CN'),
      operator: '当前管理员',
    };
    setLogs((p) => [newLog, ...p]);
  };

  const openNewUser = () => { 
    setUserForm({ id: '', name: '', email: '', role: 'channel_manager', department: '渠道部', phone: '', status: 'active', lastLogin: '-', source: 'admin' }); 
    setShowUserForm(true); 
  };
  const openEditUser = (u: SystemUser) => { setUserForm({ ...u }); setShowUserForm(true); };
  const saveUser = () => {
    if (!userForm.name || !userForm.email) { toast('error', '姓名和邮箱不能为空'); return; }
    if (userForm.id) {
      // 更新用户
      const existing = users.find((u) => u.id === userForm.id);
      if (existing) {
        // 记录变更日志
        if (existing.name !== userForm.name) addLog('update', userForm, '姓名', existing.name, userForm.name);
        if (existing.email !== userForm.email) addLog('update', userForm, '邮箱', existing.email, userForm.email);
        if (existing.role !== userForm.role) addLog('update', userForm, '角色', ROLE_LABELS[existing.role] || existing.role, ROLE_LABELS[userForm.role] || userForm.role);
        if (existing.department !== userForm.department) addLog('update', userForm, '部门', existing.department, userForm.department);
        if (existing.status !== userForm.status) addLog('status_change', userForm, '状态', existing.status === 'active' ? '活跃' : '停用', userForm.status === 'active' ? '活跃' : '停用');
      }
      setUsers((p) => p.map((u) => (u.id === userForm.id ? userForm : u))); 
      toast('success', '用户已更新'); 
    } else {
      // 新增用户
      const newUser = { ...userForm, id: 'u' + Date.now() };
      setUsers((p) => [...p, newUser]); 
      addLog('create', newUser);
      toast('success', '用户已添加'); 
    }
    setShowUserForm(false);
  };
  const deleteUser = () => { 
    toast('error', '禁止删除用户，请通过修改状态来停用用户');
    setDeleteId(null); 
  };

  const filteredUsers = useMemo(() => {
    if (activeUserTab === 'internal') return allUsers.filter((u) => u.source === 'admin');
    if (activeUserTab === 'partner') return allUsers.filter((u) => u.source === 'partner');
    return allUsers;
  }, [allUsers, activeUserTab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(editingConfig);
      // Also sync currency to global_settings for backward compatibility
      if (editingConfig.currency) {
        const { supabase: sb } = await import('../../lib/supabase');
        const { error } = await sb.from('global_settings').upsert({ id: 'default', currency: editingConfig.currency, updated_at: new Date().toISOString() });
        if (error) console.warn('Failed to sync currency to global_settings:', error.message);
      }
      toast('success', t('settings.saved'));
    } catch { toast('error', '保存失败'); }
    setSaving(false);
  };

  // Sync editingConfig with global config changes
  useEffect(() => {
    setEditingConfig((prev) => ({
      ...config,
      companyName: prev.companyName || config.companyName || defaultCompany.nameCN,
      companyNameEn: prev.companyNameEn || config.companyNameEn || defaultCompany.nameEN,
      companyAddress: prev.companyAddress || config.companyAddress || defaultCompany.address,
      companyPhone: prev.companyPhone || config.companyPhone || defaultCompany.phone,
      companyEmail: prev.companyEmail || config.companyEmail || defaultCompany.email,
      companyWebsite: prev.companyWebsite || config.companyWebsite || defaultCompany.website,
      businessModel: prev.businessModel || config.businessModel || defaultCompany.businessModel,
      annualTarget: prev.annualTarget || config.annualTarget || defaultCompany.annualTarget,
      quarterlyTarget: prev.quarterlyTarget || config.quarterlyTarget || defaultCompany.quarterlyTarget,
      partnerTarget: prev.partnerTarget || config.partnerTarget || defaultCompany.partnerTarget,
      channelRegions: prev.channelRegions || config.channelRegions || defaultCompany.channelRegions,
      coreBusiness: prev.coreBusiness || config.coreBusiness || defaultCompany.coreBusiness,
    }));
  }, [config]);

  // ── Permissions matrix ──────────────────────────────
  // 使用统一的权限服务
  const [permissions, setPermissions] = useState<PermissionDef[]>(() => {
    return permissionService.getPermissions();
  });

  const togglePermission = (permKey: string, role: string) => {
    const updated = permissions.map((p) => 
      p.key === permKey ? { ...p, [role]: !p[role] } : p
    );
    setPermissions(updated);
  };

  const savePermissions = () => {
    permissionService.savePermissions(permissions);
    toast('success', '权限配置已保存');
  };

  // 按类别分组权限
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, PermissionDef[]> = {};
    PERMISSION_CATEGORIES.forEach(cat => {
      grouped[cat] = permissions.filter(p => p.category === cat);
    });
    return grouped;
  }, [permissions]);

  const internalRoles = ['admin','channel_director','channel_manager','marketing_director','marketing_manager','sales_director','sales_manager'];
  const externalRoles = ['partner_admin','partner_sales','partner_engineer'];

  // ── Editable role definitions ────────────────────────
  const [roleDefs, setRoleDefs] = useState<Record<string, string>>({ ...ROLE_LABELS });
  const [editRoleKey, setEditRoleKey] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState('');
  const [newRoleKey, setNewRoleKey] = useState('');
  const [newRoleValue, setNewRoleValue] = useState('');
  const [newRoleType, setNewRoleType] = useState<'internal' | 'external'>('internal');
  const [showAddRole, setShowAddRole] = useState(false);

  const startEditRole = (key: string) => { setEditRoleKey(key); setEditRoleValue(roleDefs[key] || ''); };
  const saveEditRole = () => { if (editRoleKey && editRoleValue.trim()) { setRoleDefs((p) => ({ ...p, [editRoleKey]: editRoleValue.trim() })); toast('success', '角色名称已更新'); } setEditRoleKey(null); };
  const deleteRole = (key: string) => { if (key === 'admin') { toast('error', '管理员角色不可删除'); return; } const updated = { ...roleDefs }; delete updated[key]; setRoleDefs(updated); toast('success', '角色已删除'); };
  const addRole = () => { if (!newRoleKey.trim() || !newRoleValue.trim()) { toast('error', '角色标识和名称不能为空'); return; } setRoleDefs((p) => ({ ...p, [newRoleKey.trim()]: newRoleValue.trim() })); setShowAddRole(false); setNewRoleKey(''); setNewRoleValue(''); toast('success', '角色已添加'); };

  const { user, role } = useAuth();

  const currencyOptions = [{ value: 'CNY', label: '人民币 (CNY ¥)' }, { value: 'USD', label: '美元 (USD $)' }];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {isLoading && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-600">
          正在从服务器加载配置...
        </div>
      )}
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{t('settings.title')}</h1><p className="text-sm text-neutral-500 mt-1">{t('settings.subtitle')}</p></div>
        <Button variant="brand" size="sm" onClick={handleSave} loading={saving}><Save className="w-4 h-4" />{t('settings.save')}</Button>
      </div>

      <Tabs tabs={[
        { id: 'company', label: '公司信息' }, { id: 'users', label: '用户管理' }, { id: 'roles', label: '角色权限' }, { id: 'security', label: '安全设置' }, { id: 'global', label: '全局设置' }, { id: 'classification', label: '分类引擎' }, { id: 'ai', label: 'AI 配置' },
      ]} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'company' && (
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>公司基本信息</CardTitle>
              <CardDescription>设置您公司的基本信息，这些信息将展示在系统的多个位置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="公司中文名称" value={editingConfig.companyName || ''} onChange={(e) => setEditingConfig({ ...editingConfig, companyName: e.target.value })} placeholder="例如：星辰科技数据有限公司" />
                <Input label="公司英文名称" value={editingConfig.companyNameEn || ''} onChange={(e) => setEditingConfig({ ...editingConfig, companyNameEn: e.target.value })} placeholder="例如：StarTech Data Co., Ltd." />
                <Input label="公司地址" value={editingConfig.companyAddress || ''} onChange={(e) => setEditingConfig({ ...editingConfig, companyAddress: e.target.value })} placeholder="例如：北京市海淀区中关村科技园" />
                <Input label="联系电话" value={editingConfig.companyPhone || ''} onChange={(e) => setEditingConfig({ ...editingConfig, companyPhone: e.target.value })} placeholder="例如：400-888-8888" />
                <Input label="企业邮箱" value={editingConfig.companyEmail || ''} onChange={(e) => setEditingConfig({ ...editingConfig, companyEmail: e.target.value })} placeholder="例如：contact@company.com" />
                <Input label="企业网址" value={editingConfig.companyWebsite || ''} onChange={(e) => setEditingConfig({ ...editingConfig, companyWebsite: e.target.value })} placeholder="例如：https://www.company.com" />
              </div>
            </CardContent>
          </Card>

          {/* Company Business Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessGoals')}</CardTitle>
              <CardDescription>{t('settings.businessGoalsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={t('settings.annualTarget')} value={editingConfig.annualTarget || ''} onChange={(e) => setEditingConfig({ ...editingConfig, annualTarget: e.target.value })} placeholder={t('settings.annualTargetPlaceholder')} />
                <Input label={t('settings.partnerTarget')} value={editingConfig.partnerTarget || ''} onChange={(e) => setEditingConfig({ ...editingConfig, partnerTarget: e.target.value })} placeholder={t('settings.partnerTargetPlaceholder')} />
                <Input label={t('settings.channelRegions')} value={editingConfig.channelRegions || ''} onChange={(e) => setEditingConfig({ ...editingConfig, channelRegions: e.target.value })} placeholder={t('settings.channelRegionsPlaceholder')} />
                <Input label={t('settings.coreBusiness')} value={editingConfig.coreBusiness || ''} onChange={(e) => setEditingConfig({ ...editingConfig, coreBusiness: e.target.value })} placeholder={t('settings.coreBusinessPlaceholder')} />
                <div className="md:col-span-2">
                  <Input label={t('settings.businessModel')} value={editingConfig.businessModel || ''} onChange={(e) => setEditingConfig({ ...editingConfig, businessModel: e.target.value })} placeholder={t('settings.businessModelPlaceholder')} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Global Config */}
          <Card>
            <CardHeader>
              <CardTitle>全局配置</CardTitle>
              <CardDescription>配置系统核心数据字典，影响合作伙伴管理、商机报备等多个模块。界面语言请在左下角侧边栏切换</CardDescription>
            </CardHeader>
            <CardContent>
              {/* 结算币种 — 影响全系统所有金额显示 */}
              <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">结算币种</label>
                    <p className="text-xs text-neutral-500">影响商机金额、Pipeline、MDF、激励计划、Dashboard 等所有金额显示</p>
                  </div>
                  <Select options={currencyOptions} value={editingConfig.currency} onChange={(e) => setEditingConfig({ ...editingConfig, currency: e.target.value as GlobalConfig['currency'] })} />
                </div>
              </div>

              {/* 合作伙伴数据字典 — 与合作伙伴模块紧密关联 */}
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">合作伙伴数据字典</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">伙伴等级 <span className="text-neutral-400">(PartnerList筛选/批复)</span></label>
                    <Input value={editingConfig.partnerTiers.join(', ')} onChange={(e) => setEditingConfig({ ...editingConfig, partnerTiers: e.target.value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) })} placeholder="Diamond, Platinum, Gold, Silver, Registered" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">伙伴类型 <span className="text-neutral-400">(PartnerList/PartnerForm)</span></label>
                    <Input value={(editingConfig.partnerTypes || []).join(', ')} onChange={(e) => setEditingConfig({ ...editingConfig, partnerTypes: e.target.value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) })} placeholder="Reseller, ISV, SI, Service, VAD, VAR, OEM" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">伙伴状态 <span className="text-neutral-400">(PartnerList 状态筛选)</span></label>
                    <Input value={(editingConfig.partnerStatuses || []).join(', ')} onChange={(e) => setEditingConfig({ ...editingConfig, partnerStatuses: e.target.value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) })} placeholder="Cooperating, Inactive, Prospective, Rejected" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">合作厂商 <span className="text-neutral-400">(PartnerForm 厂商选择)</span></label>
                    <Input value={(editingConfig.partnerVendors || []).join(', ')} onChange={(e) => setEditingConfig({ ...editingConfig, partnerVendors: e.target.value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) })} placeholder="华为, 浪潮, 联想, Oracle, AWS" />
                  </div>
                </div>
              </div>

              {/* 业务数据字典 — 与商机、区域、行业关联 */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">业务数据字典</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">产品类型 <span className="text-neutral-400">(DealForm 产品选择)</span></label>
                    <Input value={(editingConfig.productTypes || []).join(', ')} onChange={(e) => setEditingConfig({ ...editingConfig, productTypes: e.target.value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) })} placeholder="云原生平台, 大数据平台, AI 智算平台" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">销售阶段 <span className="text-neutral-400">(DealForm 阶段选择)</span></label>
                    <Input value={editingConfig.salesStages.join(', ')} onChange={(e) => setEditingConfig({ ...editingConfig, salesStages: e.target.value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) })} placeholder="1. 需求发现, 2. 方案阶段, 3. 商务洽谈, 4. 合同签约, 5. 售后回访" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">区域设定 <span className="text-neutral-400">(Partner/Deal 筛选 + Dashboard)</span></label>
                    <Input value={editingConfig.regions.join(', ')} onChange={(e) => setEditingConfig({ ...editingConfig, regions: e.target.value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) })} placeholder="华北, 华东, 华南, 西部, 华中" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">行业设定 <span className="text-neutral-400">(Partner/Deal 筛选 + Dashboard)</span></label>
                    <Input value={editingConfig.industries.join(', ')} onChange={(e) => setEditingConfig({ ...editingConfig, industries: e.target.value.split(/[，,]/).map((s) => s.trim()).filter(Boolean) })} placeholder="金融, 医疗, 政务, 制造, 教育" />
                  </div>
                </div>
              </div>

              {/* 合作伙伴时间线标签 */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">合作伙伴时间线标签</h4>
                <p className="text-xs text-neutral-500 mb-3">配置合作伙伴时间线中显示的事件类型</p>
                
                <div className="bg-neutral-50/50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                    {[
                      { key: 'approved', label: '合作伙伴批复', auto: true },
                      { key: 'tier_upgrade', label: '级别提升', auto: true },
                      { key: 'tier_downgrade', label: '级别降级', auto: true },
                      { key: 'first_deal', label: '首个商机报备' },
                      { key: 'first_order', label: '首个订单' },
                      { key: 'manager_change', label: '负责人变更' },
                      { key: 'milestone', label: '合作里程碑' },
                      { key: 'contract_renewal', label: '合同续签' },
                      { key: 'contract_expiry', label: '合同到期' },
                      { key: 'certification', label: '获得认证' },
                      { key: 'mdf_approved', label: 'MDF审批通过' },
                      { key: 'award', label: '获得奖项' },
                    ].map((event) => {
                      const enabled = (editingConfig.timelineEvents || []).includes(event.key) || (editingConfig.timelineEvents === undefined && event.auto);
                      return (
                      <label key={event.key} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                        <input type="checkbox" checked={enabled} onChange={(e) => {
                          const current = editingConfig.timelineEvents || ['approved','tier_upgrade','tier_downgrade'];
                          const next = e.target.checked ? [...current, event.key] : current.filter((k:string) => k !== event.key);
                          setEditingConfig({...editingConfig, timelineEvents: next});
                        }} className="w-4 h-4 rounded border-neutral-300" />
                        <span>{event.label}</span>
                        {event.auto && <span className="text-[10px] text-blue-500">自动</span>}
                      </label>
                      );
                    })}
                    <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-neutral-300" />
                      <span>其他</span>
                      <input type="text" placeholder="自定义" className="flex-1 max-w-xs ml-auto text-xs border rounded px-2 py-1 bg-white dark:bg-neutral-700" />
                    </label>
                  </div>
                </div>
              </div>

              {/* 合作伙伴活跃度指标 */}
              <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">合作伙伴活跃度指标</h4>
                
                <div className="bg-neutral-50/50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3">
                  {/* 交易指标 */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">交易</span>
                    </div>
                    <div className="flex flex-wrap gap-3 flex-1">
                      <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-neutral-300" />
                        <span>订单频次</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-neutral-300" />
                        <span>项目报备数量</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-neutral-300" />
                        <span>成单金额</span>
                      </label>
                    </div>
                    <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                      <input type="checkbox" className="w-3 h-3 rounded border-neutral-300" />
                      <span>其他</span>
                      <input type="text" placeholder="自定义" className="w-16 text-xs border rounded px-1.5 py-0.5 bg-white dark:bg-neutral-700" />
                    </label>
                  </div>

                  {/* 互动指标 */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">互动</span>
                    </div>
                    <div className="flex flex-wrap gap-3 flex-1">
                      <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-neutral-300" />
                        <span>渠道门户登录频次</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-neutral-300" />
                        <span>参与培训</span>
                      </label>
                    </div>
                    <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                      <input type="checkbox" className="w-3 h-3 rounded border-neutral-300" />
                      <span>其他</span>
                      <input type="text" placeholder="自定义" className="w-16 text-xs border rounded px-1.5 py-0.5 bg-white dark:bg-neutral-700" />
                    </label>
                  </div>

                  {/* 市场指标 */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-purple-600" />
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">市场</span>
                    </div>
                    <div className="flex flex-wrap gap-3 flex-1">
                      <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-neutral-300" />
                        <span>联合市场活动次数</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-neutral-300" />
                        <span>商机线索跟进速度</span>
                      </label>
                    </div>
                    <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                      <input type="checkbox" className="w-3 h-3 rounded border-neutral-300" />
                      <span>其他</span>
                      <input type="text" placeholder="自定义" className="w-16 text-xs border rounded px-1.5 py-0.5 bg-white dark:bg-neutral-700" />
                    </label>
                  </div>

                  {/* 沟通指标 */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-amber-600" />
                      <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">沟通</span>
                    </div>
                    <div className="flex flex-wrap gap-3 flex-1">
                      <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-3 h-3 rounded border-neutral-300" />
                        <span>季度业务回顾（QBR）参与度</span>
                      </label>
                    </div>
                    <label className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                      <input type="checkbox" className="w-3 h-3 rounded border-neutral-300" />
                      <span>其他</span>
                      <input type="text" placeholder="自定义" className="w-16 text-xs border rounded px-1.5 py-0.5 bg-white dark:bg-neutral-700" />
                    </label>
                  </div>
                </div>
              </div>

{/* 合作伙伴分类类型 */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">合作伙伴分类类型</h4>
                <p className="text-xs text-neutral-500">基于活跃度和业绩表现自动对合作伙伴进行分类（分类结果在合作伙伴详情页显示）</p>
                
                <div className="bg-neutral-50/50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { key: 'Champions', label: '战略核心型', description: '活跃度极高且稳定' },
                      { key: 'RisingStars', label: '成长活跃型', description: '处于上升期，活跃趋势明显' },
                      { key: 'Opportunists', label: '项目驱动型', description: '活跃度呈阵发性、不连续' },
                      { key: 'Dormant', label: '沉默/睡眠型', description: '长期无实质产出' },
                      { key: 'Newcomers', label: '新晋观察型', description: '刚签约，处于磨合期' },
                    ].map((category) => (
                      <label key={category.key} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-neutral-700/50 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-neutral-300" />
                        <div>
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{category.label}</span>
                          <p className="text-xs text-neutral-500">{category.description}</p>
                        </div>
                        <Badge variant="info" size="sm" className="ml-auto text-[10px]">{category.key}</Badge>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* 用户列表 */}
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <CardTitle>系统用户</CardTitle>
              {activeUserTab !== 'partner' && <Button variant="brand" size="sm" onClick={openNewUser}><Plus className="w-4 h-4" />添加用户</Button>}
            </div>

            {/* 用户分类标签 */}
            <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex gap-2">
                <button onClick={() => setActiveUserTab('all')} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', activeUserTab === 'all' ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800')}>全部 ({allUsers.length})</button>
                <button onClick={() => setActiveUserTab('internal')} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', activeUserTab === 'internal' ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800')}>本公司 ({allUsers.filter(u => u.source === 'admin').length})</button>
                <button onClick={() => setActiveUserTab('partner')} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', activeUserTab === 'partner' ? 'bg-emerald-600 text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800')}>合作伙伴 ({allUsers.filter(u => u.source === 'partner').length})</button>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="py-16">
                <EmptyState title="暂无用户" description={activeUserTab === 'internal' ? '本公司用户由管理员添加' : activeUserTab === 'partner' ? '合作伙伴用户来自合作伙伴联系人数据，通过合作伙伴中心申请' : '点击添加按钮创建系统用户'} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">用户</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">来源</th>
                      {activeUserTab === 'partner' && <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">所属伙伴</th>}
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">角色</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">部门/职位</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">状态</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">最近登录</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="px-6 py-3">
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">{u.name}</p>
                            <p className="text-xs text-neutral-400">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={u.source === 'admin' ? 'info' : 'default'} size="sm">
                            {u.source === 'admin' ? '管理员添加' : '合作伙伴申请'}
                          </Badge>
                        </td>
                        {activeUserTab === 'partner' && (
                          <td className="px-6 py-3">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">{u.partnerName || '-'}</span>
                          </td>
                        )}
                        <td className="px-6 py-3">
                          <Badge variant={u.role === 'admin' ? 'primary' : isInternalRole(u.role) ? 'info' : 'default'} size="sm">
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400">{u.department}</td>
                        <td className="px-6 py-3">
                          {u.status === 'active' ? (
                            <Badge variant="success" size="sm">活跃</Badge>
                          ) : (
                            <Badge variant="warning" size="sm">停用</Badge>
                          )}
                        </td>
                        <td className="px-6 py-3 text-xs text-neutral-400">{u.lastLogin}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {u.source === 'admin' ? (
                              <>
                                <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-blue-500" title="编辑">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 rounded-lg text-neutral-300 cursor-not-allowed" title="禁止删除" disabled>
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-neutral-400">由合作伙伴中心管理</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* 操作日志 */}
          <Card>
            <CardHeader>
              <CardTitle>操作日志</CardTitle>
              <CardDescription>记录用户管理的所有操作，包括添加、修改和状态变更</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 text-sm">暂无操作记录</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {logs.slice(0, 20).map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                        {log.action === 'create' && <Plus className="w-4 h-4 text-emerald-500" />}
                        {log.action === 'update' && <Pencil className="w-4 h-4 text-blue-500" />}
                        {log.action === 'status_change' && <ToggleLeft className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {log.action === 'create' && `创建用户: ${log.userName}`}
                          {log.action === 'update' && `修改用户 ${log.userName} 的 ${log.field}: ${log.oldValue} → ${log.newValue}`}
                          {log.action === 'status_change' && `用户 ${log.userName} 状态变更: ${log.oldValue} → ${log.newValue}`}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          操作人: {log.operator} | {log.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ 角色权限 ═══ */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>角色定义</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowAddRole(!showAddRole)}><Plus className="w-3.5 h-3.5" /> 添加角色</Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddRole && (
                <div className="flex items-center gap-3 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <Input value={newRoleKey} onChange={(e) => setNewRoleKey(e.target.value)} placeholder="标识(英文)" className="w-40" />
                  <Input value={newRoleValue} onChange={(e) => setNewRoleValue(e.target.value)} placeholder="名称(中文)" className="w-40" />
                  <Select options={[{value:'internal',label:'内部角色'},{value:'external',label:'外部角色'}]} value={newRoleType} onChange={(e) => setNewRoleType(e.target.value as 'internal'|'external')} />
                  <Button variant="brand" size="sm" onClick={addRole}>确认添加</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddRole(false)}>取消</Button>
                </div>
              )}
              <div className="space-y-4">
                <p className="text-xs font-medium text-neutral-500">公司内部角色</p>
                <div className="grid grid-cols-4 gap-3">
                  {internalRoles.filter((r) => roleDefs[r]).map((role) => (
                    <div key={role} className={cn('p-3 rounded-xl border group relative', role === 'admin' ? 'border-purple-200 dark:border-purple-800 bg-purple-50/30' : role.includes('channel') ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30' : role.includes('marketing') ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/30' : 'border-amber-200 dark:border-amber-800 bg-amber-50/30')}>
                      {editRoleKey === role ? (
                        <div className="flex items-center gap-1">
                          <input value={editRoleValue} onChange={(e) => setEditRoleValue(e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded bg-white dark:bg-neutral-800" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEditRole()} />
                          <button onClick={saveEditRole} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setEditRoleKey(null)} className="p-1 text-red-400 hover:bg-red-50 rounded"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white cursor-pointer" onClick={() => startEditRole(role)}>{roleDefs[role]}</p>
                          <Badge variant="primary" size="sm" className="mt-1">{users.filter((u) => u.role === role).length} 人</Badge>
                          {role !== 'admin' && (
                            <button onClick={() => deleteRole(role)} className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-xs font-medium text-neutral-500">公司外部角色（渠道商）</p>
                <div className="grid grid-cols-3 gap-3">
                  {externalRoles.filter((r) => roleDefs[r]).map((role) => (
                    <div key={role} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 group relative">
                      {editRoleKey === role ? (
                        <div className="flex items-center gap-1">
                          <input value={editRoleValue} onChange={(e) => setEditRoleValue(e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded bg-white dark:bg-neutral-800" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveEditRole()} />
                          <button onClick={saveEditRole} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setEditRoleKey(null)} className="p-1 text-red-400 hover:bg-red-50 rounded"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white cursor-pointer" onClick={() => startEditRole(role)}>{roleDefs[role]}</p>
                          <Badge variant="default" size="sm" className="mt-1">{users.filter((u) => u.role === role).length} 人</Badge>
                          <button onClick={() => deleteRole(role)} className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>权限矩阵</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">点击图标切换权限</span>
                <Button variant="brand" size="sm" onClick={savePermissions}><Save className="w-3.5 h-3.5" /> 保存权限</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 公司内部角色权限 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-neutral-500" />
                    <p className="text-xs font-medium text-neutral-500">公司内部角色</p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">权限模块</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">权限项</th>
                          {internalRoles.map((r) => (
                            <th key={r} className="text-center py-3 px-3 text-[10px] font-semibold text-neutral-500 uppercase">
                              {roleDefs[r] || r}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {PERMISSION_CATEGORIES.map((category) => (
                          permissionsByCategory[category]?.map((p, idx) => (
                            <tr key={p.key} className={idx === 0 ? 'border-t border-neutral-200 dark:border-neutral-800' : ''}>
                              {idx === 0 && (
                                <td rowSpan={permissionsByCategory[category]?.length || 1} className="py-2 px-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{t(`permission.${category}`) || category}</p>
                                </td>
                              )}
                              <td className="py-2 px-4">
                                <div className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 -mx-4 px-4 py-1 rounded transition-colors">
                                  <p className="text-xs font-medium text-neutral-900 dark:text-white" title={t(`perm.${p.key}_desc`) || p.desc || ''}>
                                    {t(`perm.${p.key}`) || p.label}
                                  </p>
                                </div>
                              </td>
                              {internalRoles.map((r) => (
                                <td key={r} className="py-2 px-3 text-center">
                                  <button
                                    onClick={() => togglePermission(p.key, r)}
                                    className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                                      p[r] 
                                        ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/30' 
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400'
                                    )}
                                    title={`${roleDefs[r] || r}: ${p[r] ? t('common.authorized') || '已授权' : t('common.unauthorized') || '未授权'} (${t('common.clickToToggle') || '点击切换'})`}
                                  >
                                    {p[r] ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 公司外部角色权限 */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-neutral-500" />
                    <p className="text-xs font-medium text-neutral-500">公司外部角色（渠道商）</p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-50 dark:bg-neutral-800/50">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">权限模块</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase">权限项</th>
                          {externalRoles.map((r) => (
                            <th key={r} className="text-center py-3 px-3 text-[10px] font-semibold text-neutral-500 uppercase">
                              {roleDefs[r] || r}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {PERMISSION_CATEGORIES.map((category) => (
                          permissionsByCategory[category]?.map((p, idx) => (
                            <tr key={p.key} className={idx === 0 ? 'border-t border-neutral-200 dark:border-neutral-800' : ''}>
                              {idx === 0 && (
                                <td rowSpan={permissionsByCategory[category]?.length || 1} className="py-2 px-4 bg-neutral-50/50 dark:bg-neutral-800/30">
                                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">{t(`permission.${category}`) || category}</p>
                                </td>
                              )}
                              <td className="py-2 px-4">
                                <div className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 -mx-4 px-4 py-1 rounded transition-colors">
                                  <p className="text-xs font-medium text-neutral-900 dark:text-white" title={t(`perm.${p.key}_desc`) || p.desc || ''}>
                                    {t(`perm.${p.key}`) || p.label}
                                  </p>
                                </div>
                              </td>
                              {externalRoles.map((r) => (
                                <td key={r} className="py-2 px-3 text-center">
                                  <button
                                    onClick={() => togglePermission(p.key, r)}
                                    className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                                      p[r] 
                                        ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/30' 
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-400'
                                    )}
                                    title={`${roleDefs[r] || r}: ${p[r] ? '已授权' : '未授权'} (点击切换)`}
                                  >
                                    {p[r] ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 权限图例 */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-neutral-500">已授权</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs text-neutral-500">未授权</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ 安全设置 ═══ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>登录方式</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><Mail className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-sm font-semibold text-neutral-900 dark:text-white">邮箱密码登录</p><p className="text-xs text-neutral-500">通过 Supabase Auth 进行邮箱密码认证</p></div>
                  </div>
                  <Badge variant="success" size="sm">已启用</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center"><Smartphone className="w-5 h-5 text-purple-600" /></div>
                    <div><p className="text-sm font-semibold text-neutral-900 dark:text-white">微信扫码登录</p><p className="text-xs text-neutral-500">通过微信公众号授权登录（需配置微信开放平台）</p></div>
                  </div>
                  <Badge variant="default" size="sm">待配置</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center"><Key className="w-5 h-5 text-amber-600" /></div>
                    <div><p className="text-sm font-semibold text-neutral-900 dark:text-white">SSO 单点登录</p><p className="text-xs text-neutral-500">通过 SAML/OIDC 对接企业身份系统</p></div>
                  </div>
                  <Badge variant="default" size="sm">待配置</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>安全策略</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center"><Shield className="w-5 h-5 text-red-500" /></div>
                    <div><p className="text-sm font-semibold text-neutral-900 dark:text-white">双因素认证 (2FA)</p><p className="text-xs text-neutral-500">登录时需额外验证手机验证码</p></div>
                  </div>
                  <button onClick={() => setEditingConfig({ ...editingConfig, require2FA: !editingConfig.require2FA })}
                    className={cn('relative w-12 h-7 rounded-full transition-colors', editingConfig.require2FA ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600')}>
                    <span className={cn('absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform', editingConfig.require2FA ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </div>
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-neutral-500" /><span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">会话超时 (分钟)</span></div>
                  <Input type="number" value={editingConfig.sessionTimeoutMin || 60} onChange={(e) => setEditingConfig({ ...editingConfig, sessionTimeoutMin: parseInt(e.target.value) || 60 })} />
                </div>
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-neutral-500" /><span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">密码最小长度</span></div>
                  <Input type="number" value={editingConfig.passwordMinLength || 8} onChange={(e) => setEditingConfig({ ...editingConfig, passwordMinLength: parseInt(e.target.value) || 8 })} />
                </div>
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">最大登录尝试次数</span></div>
                  <Input type="number" value={editingConfig.loginAttempts || 5} onChange={(e) => setEditingConfig({ ...editingConfig, loginAttempts: parseInt(e.target.value) || 5 })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>当前会话</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{user?.email || '未登录'}</p>
                    <p className="text-xs text-neutral-400">角色: {ROLE_LABELS[role] || role} · 本次登录: {new Date().toLocaleString()}</p>
                  </div>
                  <Badge variant="success" size="sm">活跃</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'classification' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>分类引擎配置</CardTitle>
              <CardDescription>设置合作伙伴自动分类规则，系统将根据T/I/M/C四维度数据自动计算并打标</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 时间窗口设置 */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">计算时间窗口</h4>
                <p className="text-xs text-neutral-500">定义计算活跃度的时间范围，用于评估合作伙伴近期表现</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: '30', label: '30天', desc: '近期活跃表现' },
                    { value: '90', label: '90天', desc: '季度表现' },
                    { value: '180', label: '180天', desc: '半年度表现' },
                  ].map((option) => (
                    <label key={option.value} className="flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <input type="radio" name="timeWindow" value={option.value} defaultChecked={option.value === '90'} className="sr-only" />
                      <span className="text-lg font-semibold text-neutral-900 dark:text-white">{option.label}</span>
                      <span className="text-xs text-neutral-500 mt-1">{option.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 维度权重设置 */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">T/I/M/C 维度权重</h4>
                <p className="text-xs text-neutral-500">调整各维度在活跃度计算中的权重占比，权重总和应等于100%</p>
                <div className="space-y-4">
                  {/* 交易权重 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">交易 (T) - 订单频次、项目报备、成单金额</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">40%</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="40" className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />

                  {/* 互动权重 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">互动 (I) - 门户登录、培训参与</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">25%</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="25" className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />

                  {/* 市场权重 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">市场 (M) - 联合活动、商机跟进速度</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">20%</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="20" className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />

                  {/* 沟通权重 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">沟通 (C) - QBR参与度</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">15%</span>
                  </div>
                  <input type="range" min="0" max="100" defaultValue="15" className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>

              {/* 分类阈值配置 */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">分类阈值设置</h4>
                <p className="text-xs text-neutral-500">设置各分类类型的触发条件，系统将根据活跃度和业绩自动匹配</p>
                
                {/* 战略核心型 */}
                <div className="p-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">战略核心型 (Champions)</span>
                    <Badge variant="success" size="sm">最高优先级</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">活跃度阈值</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="100" defaultValue="80" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">≥80分</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">业绩产出阈值</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="5000" step="100" defaultValue="1000" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">≥100万</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">条件：活跃度 {'>'} 80 <span className="mx-1">且</span> 产出 {'>'} 100万</p>
                </div>

                {/* 成长活跃型 */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">成长活跃型 (RisingStars)</span>
                    <Badge variant="info" size="sm">上升期</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">活跃度阈值</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="100" defaultValue="60" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">≥60分</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">成长趋势</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="-100" max="100" defaultValue="30" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">+30%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">产出阈值</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="5000" step="100" defaultValue="300" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">≥30万</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">条件：活跃度 {'>'} 60 <span className="mx-1">且</span> 成长趋势 {'>'} +30%</p>
                </div>

                {/* 项目驱动型 */}
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">项目驱动型 (Opportunists)</span>
                    <Badge variant="warning" size="sm">阵发性</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">活跃度阈值</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="100" defaultValue="40" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">40-60分</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">活跃度波动系数</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="100" defaultValue="70" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">高波动</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">条件：活跃度中等但波动明显，呈阵发性活跃</p>
                </div>

                {/* 新晋观察型 */}
                <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">新晋观察型 (Newcomers)</span>
                    <Badge variant="default" size="sm">磨合期</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">合作时长</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="180" defaultValue="90" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">≤90天</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">活跃度阈值</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="100" defaultValue="30" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">任意</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">条件：合作时长 ≤ 90天的新签约伙伴</p>
                </div>

                {/* 沉默/睡眠型 */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/30 dark:bg-neutral-800/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-neutral-500"></div>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">沉默/睡眠型 (Dormant)</span>
                    <Badge variant="danger" size="sm">需唤醒</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">活跃度阈值</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="100" defaultValue="20" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">≤20分</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">沉默天数</label>
                      <div className="flex items-center gap-2">
                        <input type="range" min="0" max="365" defaultValue="60" className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">≥60天</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">条件：活跃度 ≤ 20 <span className="mx-1">且</span> 沉默天数 ≥ 60天</p>
                </div>
              </div>

              {/* 自动打标开关 */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">自动打标设置</h4>
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">开启自动打标</p>
                      <p className="text-xs text-neutral-500 mt-1">系统每天凌晨0:00自动扫描并更新合作伙伴分类标签</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                    <Clock className="w-3 h-3" />
                    <span>执行时间：每天凌晨 00:00</span>
                  </div>
                </div>
              </div>

              {/* 保存按钮 */}
              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button variant="secondary">重置为默认</Button>
                <Button variant="brand">保存配置</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ AI 配置 ═══ */}
      {activeTab === 'ai' && (
        <Card>
          <CardHeader><CardTitle>AI 接口配置</CardTitle><CardDescription>配置 AI 服务连接参数，用于智能分析、预测和建议功能</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">API Key</label>
              <Input type="password" value={editingConfig.aiApiKey || ''} onChange={(e) => setEditingConfig({ ...editingConfig, aiApiKey: e.target.value })} placeholder="sk-xxxxxxxx" />
              <p className="text-xs text-neutral-400 mt-1">支持 DeepSeek、OpenAI 或任何兼容 OpenAI API 的服务</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">API Base URL</label>
              <Input value={editingConfig.aiBaseUrl || 'https://api.deepseek.com'} onChange={(e) => setEditingConfig({ ...editingConfig, aiBaseUrl: e.target.value })} placeholder="https://api.deepseek.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">模型名称</label>
              <Input value={editingConfig.aiModel || 'deepseek-chat'} onChange={(e) => setEditingConfig({ ...editingConfig, aiModel: e.target.value })} placeholder="deepseek-chat" />
              <p className="text-xs text-neutral-400 mt-1">如 deepseek-chat、gpt-4o、claude-3-opus 等</p>
            </div>
            <div className="flex gap-2">
              <Button variant="brand" size="sm" onClick={handleSave} loading={saving}><Save className="w-4 h-4" />保存 AI 配置</Button>
              <Button variant="secondary" size="sm" onClick={async () => {
                const apiKey = editingConfig.aiApiKey;
                const baseUrl = editingConfig.aiBaseUrl || 'https://api.deepseek.com';
                const model = editingConfig.aiModel || 'deepseek-chat';
                if (!apiKey) { alert('请先填写 API Key'); return; }
                toast('info', '正在测试连接...');
                try {
                  const { aiQuery } = await import('../../services/ai-service');
                  const result = await aiQuery('回复"OK"', '', { aiApiKey: apiKey, aiBaseUrl: baseUrl, aiModel: model });
                  if (result.includes('OK')) toast('success', 'AI 连接成功！');
                  else if (result.includes('AI 调用失败')) toast('error', result);
                  else toast('success', 'AI 连接成功！响应: ' + result.substring(0, 80));
                } catch (e: any) { toast('error', '连接失败: ' + e.message); }
              }}>测试连接</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'global' && (
        <Card>
          <CardHeader><CardTitle>模块开关</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'revenueAlignment', label: '业绩概览与诊断' },
                { key: 'partnershipMatrix', label: '渠道矩阵与网络图' },
                { key: 'ecosystemNetwork', label: '生态拓扑图' },
                { key: 'mdfEfficiency', label: 'MDF 效率分析' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
                  <input type="checkbox" checked={!!editingConfig.sections[key as keyof typeof editingConfig.sections]}
                    onChange={(e) => setEditingConfig({ ...editingConfig, sections: { ...editingConfig.sections, [key]: e.target.checked } })}
                    className="w-4 h-4 rounded" />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── User Form Modal ─── */}
      {showUserForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowUserForm(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{userForm.id ? '编辑用户' : '添加用户'}</h3>
            <div className="space-y-3">
              <Input label="姓名 *" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
              <Input label="邮箱 *" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
              <Select label="角色" options={roleOptions} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })} />
              <Select label="部门" options={deptOptions} value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} />
              <Input label="手机号" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
              <Select label="状态" options={[{ value: 'active', label: '活跃' }, { value: 'inactive', label: '停用' }]} value={userForm.status} onChange={(e) => setUserForm({ ...userForm, status: e.target.value as 'active' | 'inactive' })} />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setShowUserForm(false)}>取消</Button>
              <Button variant="brand" onClick={saveUser}><Save className="w-4 h-4" />保存</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={deleteUser}
        title="确认删除" description="确定要移除此用户吗？此操作不可撤销。" confirmLabel="删除" variant="danger" />
    </div>
  );
};
