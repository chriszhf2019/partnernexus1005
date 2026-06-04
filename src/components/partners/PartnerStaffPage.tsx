import { useState, useEffect, useMemo } from 'react';
import { Users, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PartnerStaffList } from './PartnerStaffList';
import { PartnerStaffDetail } from './PartnerStaffDetail';
import { PointsManagement } from './PointsManagement';
import { StaffProjectList } from './StaffProjectList';
import { StaffActivityList } from './StaffActivityList';
import { StaffCustomerList } from './StaffCustomerList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { supabase } from '../../lib/supabase';
import type { PartnerStaff, WorkHistory, StaffProject, StaffActivity, StaffCustomer, Deal, Activity as ActivityType } from '../../types';

// Map partner_contact DB row to PartnerStaff
function mapContactToStaff(c: any, partnerName: string): PartnerStaff {
  return {
    id: c.id,
    salutation: c.salutation || '',
    firstName: c.first_name || '',
    lastName: c.last_name || '',
    fullName: [c.last_name, c.first_name].filter(Boolean).join(' ') || c.email || '未知',
    phone: c.phone || '',
    mobile: c.mobile || '',
    email: c.email || '',
    partnerId: c.partner_id || '',
    partnerName: partnerName || '',
    title: c.title || '',
    department: c.department || '',
    city: '',
    skills: [],
    isPrimary: c.is_primary || false,
    status: 'active' as const,
    joinDate: c.created_at?.split('T')[0] || '',
    points: 0,
    pointsHistory: [],
    createdAt: c.created_at || '',
    updatedAt: c.created_at || '',
  };
}

export const PartnerStaffPage = () => {
  const navigate = useNavigate();
  const params = useParams<{ partnerId?: string }>();
  const [selectedStaff, setSelectedStaff] = useState<PartnerStaff | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);

  // Real data from Supabase
  const [staff, setStaff] = useState<PartnerStaff[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [marketingActivities, setMarketingActivities] = useState<ActivityType[]>([]);
  const [orgStructure, setOrgStructure] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    const partnerId = params.partnerId;

    async function loadData() {
      try {
        // Fetch partner contacts (staff)
        const contactQuery = partnerId
          ? supabase.from('partner_contacts').select('*, partners!inner(name)').eq('partner_id', partnerId)
          : supabase.from('partner_contacts').select('*, partners!inner(name)');
        const { data: contacts } = await contactQuery;
        if (contacts) {
          setStaff(contacts.map((c: any) => mapContactToStaff(c, c.partners?.name || '')));
        }
      } catch {}

      try {
        // Fetch deals
        const dealQuery = partnerId
          ? supabase.from('deals').select('*').eq('partner_id', partnerId).order('created_date', { ascending: false }).limit(10)
          : supabase.from('deals').select('*').order('created_date', { ascending: false }).limit(10);
        const { data: dealData } = await dealQuery;
        if (dealData) {
          setDeals(dealData.map((d: any) => ({
            id: d.id,
            title: d.title || '',
            customerName: d.customer || '',
            value: Number(d.value || 0),
            partnerId: d.partner_id || '',
            partnerName: d.partner_name || '',
            partnerType: (d.partner_type || 'Reseller') as any,
            stage: (d.status === 'Converted' ? 'ClosedWon' : 'Registered') as any,
            status: d.status || 'Pending',
            region: d.region || '',
            salesName: d.sales_name || '',
            salesTeam: d.sales_team || '',
            productType: d.product_type || '',
            createdDate: d.created_date || '',
            lastActivityDate: d.updated_at || '',
            expectedCloseDate: d.end_date || '',
            isPriority: d.is_priority || false,
            lifecycle: [],
          })));
        }
      } catch {}

      try {
        // Fetch marketing activities
        const { data: mktData } = await supabase.from('marketing_activities').select('*').order('event_date', { ascending: false }).limit(10);
        if (mktData) {
          setMarketingActivities(mktData.map((a: any) => ({
            id: a.id,
            type: 'milestone' as const,
            title: a.name || '',
            description: a.type || '',
            date: a.event_date || '',
            time: '',
          })));
        }
      } catch {}

      // Build org structure: use partner's org_structure or auto-generate from staff
      try {
        if (partnerId) {
          const { data: partner } = await supabase.from('partners').select('org_structure,name').eq('id', partnerId).single();
          if (partner?.org_structure && Array.isArray(partner.org_structure) && partner.org_structure.length > 0) {
            setOrgStructure(partner.org_structure);
          }
        }
      } catch {}

      setLoading(false);
    }

    loadData();
  }, [params.partnerId]);

  const handleViewDetails = (s: PartnerStaff) => setSelectedStaff(s);

  const handleUpdateStaff = (updatedStaff: PartnerStaff) => setSelectedStaff(updatedStaff);

  const handleAddPoints = (staffId: string, points: number, type: any, source: string, description: string) => {
    setStaff(prev => prev.map(s => {
      if (s.id !== staffId) return s;
      return {
        ...s,
        points: s.points + points,
        pointsHistory: [
          ...s.pointsHistory,
          { id: `p-${Date.now()}`, staffId, type, points, source, description, date: new Date().toISOString().split('T')[0], operator: '管理员' },
        ],
      };
    }));
  };

  const handleAddProject = (project: Omit<StaffProject, 'id'>) => {
    // Projects are derived from deals - refresh deals
    // For now, just add to in-memory list
  };

  const handleAddActivity = (activity: Omit<StaffActivity, 'id'>) => {
    // Activities are derived from marketing_activities
  };

  const handleAddCustomer = (customer: Omit<StaffCustomer, 'id'>) => {
    // Customers need a dedicated table - not yet implemented
  };

  const staffForPartner = params.partnerId
    ? staff.filter(s => s.partnerId === params.partnerId)
    : staff;

  // Auto-generate org structure from staff if no explicit org_structure
  const displayOrgStructure = useMemo(() => {
    if (orgStructure.length > 0) return orgStructure;
    if (staffForPartner.length === 0) return [];
    const levels: any[] = [];
    const primary = staffForPartner.find(s => s.isPrimary);
    if (primary) {
      levels.push({ role: primary.title || '负责人', name: primary.fullName });
    }
    const others = staffForPartner.filter(s => !s.isPrimary);
    if (others.length > 0) {
      const children = others.map(s => ({ role: s.title || '成员', name: s.fullName }));
      if (levels.length > 0) {
        levels[0].children = children;
      } else {
        levels.push({ role: '团队', name: '', children });
      }
    }
    return levels;
  }, [orgStructure, staffForPartner]);

  const tabItems = [
    { id: 'org', label: '组织架构' },
    { id: 'list', label: `人员列表 (${staffForPartner.length})` },
    { id: 'points', label: '积分管理' },
    { id: 'projects', label: '项目管理' },
    { id: 'activities', label: '活动培训' },
    { id: 'customers', label: '重点客户' },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/partners')} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回合作伙伴列表
          </button>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
            <Users className="w-5 h-5 inline-block mr-2" /> 合作伙伴人员管理
          </h1>
        </div>
        <div className="flex items-center justify-center h-48 text-sm text-neutral-400">
          <Users className="w-4 h-4 mr-2 animate-pulse" /> 加载人员数据...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/partners')}
          className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回合作伙伴列表
        </button>
        <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
          <Users className="w-5 h-5 inline-block mr-2" />
          合作伙伴人员管理
          {params.partnerId && staffForPartner.length > 0 && (
            <span className="text-sm font-normal text-neutral-500 ml-2">
              - {staffForPartner[0]?.partnerName}
            </span>
          )}
        </h1>
      </div>

      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      <div className="pt-4">
        {activeTab === 'org' && (
          <Card>
            <CardHeader><CardTitle><Building2 className="w-4 h-4 inline mr-1" />组织架构</CardTitle></CardHeader>
            <CardContent>
              {displayOrgStructure.length > 0 ? (
                <div className="flex flex-col items-center text-sm">
                  {displayOrgStructure.map((level: any, i: number) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-center">
                        <p className="font-semibold">{level.role || '未命名'}</p>
                        <p className="text-xs opacity-70">{level.name || ''}</p>
                      </div>
                      {level.children && level.children.length > 0 && (
                        <>
                          <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-600" />
                          <div className="flex gap-4">
                            {level.children.map((c: any, ci: number) => (
                              <div key={ci} className="flex flex-col items-center">
                                <div className="w-px h-3 bg-neutral-300 dark:bg-neutral-600" />
                                <div className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
                                  <p className="font-medium text-neutral-900 dark:text-white">{c.role}</p>
                                  <p className="text-xs text-neutral-500">{c.name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-neutral-400">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>暂无组织架构数据</p>
                  <p className="text-xs mt-1">添加联系人后，组织架构将自动从联系人信息生成</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'list' && (
          <PartnerStaffList
            staff={staffForPartner.length > 0 ? staffForPartner : staff}
            partnerId={params.partnerId}
            onViewDetails={handleViewDetails}
          />
        )}

        {activeTab === 'points' && (
          <PointsManagement
            staff={staff}
            onAddPoints={handleAddPoints}
          />
        )}

        {activeTab === 'projects' && (
          <StaffProjectList
            projects={deals.map(d => ({
              id: `proj-${d.id}`,
              staffId: '',
              dealId: d.id,
              dealTitle: d.title,
              partnerId: d.partnerId,
              role: '参与',
              contribution: d.description || '',
              startDate: d.createdDate,
              endDate: d.expectedCloseDate,
            }))}
            deals={deals}
            staffId={selectedStaff?.id}
            onAddProject={handleAddProject}
          />
        )}

        {activeTab === 'activities' && (
          <StaffActivityList
            activities={marketingActivities.map((a, i) => ({
              id: `sa-${i}`,
              staffId: '',
              activityId: a.id,
              activityName: a.title,
              activityType: 'activity' as const,
              points: 0,
              attendanceDate: a.date || '',
              completionStatus: 'completed' as const,
            }))}
            marketingActivities={marketingActivities}
            staffId={selectedStaff?.id}
            onAddActivity={handleAddActivity}
          />
        )}

        {activeTab === 'customers' && (
          <StaffCustomerList
            customers={deals.filter(d => d.customerName).map(d => ({
              id: `cust-${d.id}`,
              staffId: '',
              customerName: d.customerName,
              industry: d.customerIndustry || '未分类',
              contactPerson: d.salesName || '',
              contactPhone: '',
              annualRevenue: d.value,
              relationshipStart: d.createdDate,
              keyProducts: [d.productType || ''],
            }))}
            staffId={selectedStaff?.id}
            onAddCustomer={handleAddCustomer}
          />
        )}
      </div>

      {selectedStaff && (
        <PartnerStaffDetail
          staff={selectedStaff}
          workHistory={[]}
          projects={deals.filter(d => d.partnerId === selectedStaff.partnerId).map(d => ({
            id: `proj-${d.id}`,
            staffId: selectedStaff.id,
            dealId: d.id,
            dealTitle: d.title,
            partnerId: d.partnerId,
            role: '参与',
            contribution: d.description || '',
            startDate: d.createdDate,
            endDate: d.expectedCloseDate,
          }))}
          activities={[]}
          customers={deals.filter(d => d.customerName && d.partnerId === selectedStaff.partnerId).map(d => ({
            id: `cust-${d.id}`,
            staffId: selectedStaff.id,
            customerName: d.customerName,
            industry: d.customerIndustry || '未分类',
            contactPerson: d.salesName || '',
            contactPhone: '',
            annualRevenue: d.value,
            relationshipStart: d.createdDate,
            keyProducts: [d.productType || ''],
          }))}
          onClose={() => setSelectedStaff(null)}
          onUpdate={handleUpdateStaff}
        />
      )}
    </div>
  );
};
