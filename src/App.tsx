import { Suspense, useState, useRef, useEffect } from 'react';
import type { Partner } from './types';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoader } from './components/ui/PageLoader';
import { NetworkStatus } from './components/ui/NetworkStatus';
import { ToastProvider } from './components/ui/Toast';
import { usePartners, useDeals, useActivities, type ActivityItem } from './hooks/useData';
import { partnerService } from './services/partner-service';
import { dealService } from './services/deal-service';
import { buildPartnerDetails } from './lib/partnerDataBuilder';
import { supabase } from './lib/supabase';
import { Shield, HelpCircle, Clock } from 'lucide-react';

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzAbbr = time.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium" title={`时区: ${tz}`}>
      <Clock className="w-3.5 h-3.5" />
      {time.toLocaleString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })}
      <span className="text-[10px] text-neutral-300 ml-0.5">{tzAbbr}</span>
    </div>
  );
};
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { LoginPage } from './components/auth/LoginPage';
import type { PartnerDetails } from './types';
import { retryableLazy } from './lib/retryableLazy';

const EcosystemDashboard = retryableLazy(() => import('./components/dashboard/EcosystemDashboard').then(m => ({ default: m.EcosystemDashboard })));
const PartnerList = retryableLazy(() => import('./components/partners/PartnerList').then(m => ({ default: m.PartnerList })));
import { PartnerProfile } from './components/partners/PartnerProfile';
import { PartnerBusinessPlan } from './components/partners/PartnerBusinessPlan';
const PartnerFormPage = retryableLazy(() => import('./components/partners/PartnerFormPage').then(m => ({ default: m.PartnerFormPage })));
const MarketingIncentivePage = retryableLazy(() => import('./components/marketing/MarketingIncentivePage').then(m => ({ default: m.MarketingIncentivePage })));
const DealRegistrationPage = retryableLazy(() => import('./components/deals/DealRegistrationPage').then(m => ({ default: m.DealRegistrationPage })));
const DealRegistrationForm = retryableLazy(() => import('./components/deals/DealRegistrationForm').then(m => ({ default: m.DealRegistrationForm })));
const DealDetailPage = retryableLazy(() => import('./components/deals/DealDetailPage').then(m => ({ default: m.DealDetailPage })));
const SettingsPage = retryableLazy(() => import('./components/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const IncentivesPage = retryableLazy(() => import('./components/marketing/IncentivesPage').then(m => ({ default: m.IncentivesPage })));
const IncentiveClosingDashboard = retryableLazy(() => import('./components/marketing/IncentiveClosingDashboard').then(m => ({ default: m.IncentiveClosingDashboard })));
const CustomerAnalysis = retryableLazy(() => import('./components/deals/CustomerAnalysis').then(m => ({ default: m.CustomerAnalysis })));
const EnablementPage = retryableLazy(() => import('./components/marketing/EnablementPage').then(m => ({ default: m.EnablementPage })));
const AnalyticsPage = retryableLazy(() => import('./components/marketing/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ChannelDashboard = retryableLazy(() => import('./components/marketing/ChannelDashboard').then(m => ({ default: m.ChannelDashboard })));
const MarketingPlanPage = retryableLazy(() => import('./components/marketing/MarketingPlanPage').then(m => ({ default: m.MarketingPlanPage })));
const InvitationPage = retryableLazy(() => import('./components/marketing/InvitationPage').then(m => ({ default: m.InvitationPage })));
const PartnerStaffPage = retryableLazy(() => import('./components/partners/PartnerStaffPage').then(m => ({ default: m.PartnerStaffPage })));
const CampaignManagementPage = retryableLazy(() => import('./components/marketing/CampaignManagementPage').then(m => ({ default: m.CampaignManagementPage })));
const CampaignDetailPage = retryableLazy(() => import('./components/marketing/CampaignDetailPage').then(m => ({ default: m.CampaignDetailPage })));
const BudgetManagementPage = retryableLazy(() => import('./components/marketing/BudgetManagementPage').then(m => ({ default: m.BudgetManagementPage })));
const ChannelCampaignPage = retryableLazy(() => import('./components/marketing/ChannelCampaignPage').then(m => ({ default: m.ChannelCampaignPage })));
const MarketingActivityDetail = retryableLazy(() => import('./components/marketing/MarketingActivityDetail').then(m => ({ default: m.MarketingActivityDetail })));

function EcosystemRoute() {
  const navigate = useNavigate();
  const handleNavigate = (view: string) => {
    const route = ['partners', 'deals', 'marketing', 'incentives', 'enablement', 'analytics', 'settings'].includes(view) ? `/${view}` : '/ecosystem';
    navigate(route);
  };
  return (
    <div className="space-y-6">
      <ErrorBoundary>
        <EcosystemDashboard
          onViewChange={handleNavigate}
          onSelectPartner={(id) => navigate(`/partners/${id}`)}
        />
      </ErrorBoundary>
    </div>
  );
}

function PartnersRoute() {
  const navigate = useNavigate();
  const { partners: initialPartners, partnerListRef } = usePartners();
  const [partners, setPartners] = useState(initialPartners);

  // Fetch Supabase partners and merge with imported/local (Supabase data takes precedence for same ID)
  useEffect(() => {
    partnerService.list().then((result) => {
      const dbIds = new Set(result.items.map((p: Partner) => p.id));
      const kept = initialPartners.filter((p) => !dbIds.has(p.id));
      const merged = [...result.items, ...kept];
      setPartners(merged);
      partnerListRef.current = merged;
    }).catch(() => {
      // Keep using initialPartners from usePartners
    });
  }, []);

  // Sync local state to ref so PartnerProfileRoute can find all partners
  partnerListRef.current = partners;

  const handleImport = (imported: typeof initialPartners, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setPartners(imported);
    } else {
      const existingIds = new Set(partners.map((p) => p.id));
      const newItems = imported.filter((p) => !existingIds.has(p.id));
      setPartners(prev => [...prev, ...newItems]);
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <PartnerList
          partners={partners}
          onSelectPartner={(id) => navigate(`/partners/${id}`)}
          onImport={handleImport}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

function PartnerProfileRoute() {
  const { id } = useParams<{ id: string }>();
  const { partnerListRef } = usePartners();
  const { activities } = useActivities();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [relatedDeals, setRelatedDeals] = useState<any[]>([]);
  const [relatedPlans, setRelatedPlans] = useState<any[]>([]);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const fromRef = partnerListRef.current.find((p) => p.id === id);
    if (fromRef) { setPartner({...fromRef}); setLoading(false); }
    else { partnerService.getById(id).then((p) => { if (p) setPartner(p); setLoading(false); }).catch(() => setLoading(false)); }

    // Fetch related deals and PMDF plans
    supabase.from('deals').select('*').eq('partner_id', id).order('created_date', { ascending: false }).then(({ data }: any) => { if (data) setRelatedDeals(data); });
    supabase.from('marketing_plan').select('*').eq('partner_id', id).eq('activity_type', 'PMDF').then(({ data }: any) => { if (data) setRelatedPlans(data); });
    // Load contacts from partner_contacts table
    supabase.from('partner_contacts').select('*').eq('partner_id', id).then(({ data: contacts }: any) => {
      if (contacts?.length > 0) {
        setPartner((prev: any) => prev ? { ...prev, contacts: contacts.map((c: any) => ({ salutation: c.salutation, firstName: c.first_name, lastName: c.last_name, title: c.title, department: c.department, phone: c.phone, mobile: c.mobile, email: c.email, isPrimary: c.is_primary })) } : prev);
      }
    });
  }, [id, refreshKey]);

  const handlePartnerUpdate = (updated: Partner) => {
    setPartner(updated);
    setRefreshKey(k => k + 1);
  };

  if (loading) return <PageLoader />;

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-lg font-semibold text-neutral-400">未找到合作伙伴</p>
        <p className="text-sm text-neutral-400">ID: {id}</p>
        <button onClick={() => navigate('/partners')} className="text-sm text-brand hover:underline">返回合作伙伴列表</button>
      </div>
    );
  }

  // Build pipeline from real deals — each stage maps to its corresponding deal lifecycle stage
  const dealPipeline = {
    registered: relatedDeals.filter((d: any) => d.stage === 'Registered' || !d.stage).reduce((s: number, d: any) => s + Number(d.value || 0), 0),
    solution: relatedDeals.filter((d: any) => d.stage === 'Solution' || d.status === 'Approved').reduce((s: number, d: any) => s + Number(d.value || 0), 0),
    commercial: relatedDeals.filter((d: any) => d.stage === 'Commercial').reduce((s: number, d: any) => s + Number(d.value || 0), 0),
    won: relatedDeals.filter((d: any) => d.stage === 'ClosedWon' || d.status === 'Converted' || d.status === 'Closed Won').reduce((s: number, d: any) => s + Number(d.value || 0), 0),
  };

  // Merge pipeline data into partner details
  const baseDetails = buildPartnerDetails(partner);
  const partnerDetails: PartnerDetails = {
    ...baseDetails,
    pipeline: dealPipeline.registered > 0 ? dealPipeline : baseDetails.pipeline,
    topProjects: relatedDeals.map((d: any) => ({
      name: d.title, amount: Number(d.value || 0), progress: d.status === 'Approved' ? 75 : d.status === 'Pending' ? 40 : d.status === 'Converted' ? 100 : 20,
      closeDate: d.end_date || d.created_date || '',
    })),
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <div className="space-y-6">
          <PartnerBusinessPlan
            partner={partner}
            relatedDeals={relatedDeals}
            contacts={partner.contacts}
            onScheduleJBP={() => {
              // Scroll to PartnerProfile and trigger JBP via a custom approach
              const btn = document.querySelector('[data-jbp-trigger]') as HTMLElement;
              if (btn) btn.click();
              else alert(`即将为 ${partner.name} 发起 JBP 联合业务规划会议...\n\n📅 建议时间：2周内\n⏱ 建议时长：90分钟\n👥 参会方：双方销售+技术负责人\n📋 议题：业务回顾 · 市场拓展 · 目标设定\n\n会议邀请将通过系统发送。`);
            }}
          />
          <PartnerProfile
            partner={partnerDetails}
            activities={activities as any}
            onBack={() => navigate('/partners')}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

function DealsRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const partnerFilter = searchParams.get('partner') || '';
  const { deals, stats } = useDeals();

  const filtered = partnerFilter
    ? deals.filter(d => d.partnerId === partnerFilter)
    : deals;

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {partnerFilter && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-neutral-500">筛选合作伙伴: <strong>{partnerFilter}</strong></span>
            <button onClick={() => navigate('/deals')} className="text-xs text-blue-500 hover:underline">清除</button>
          </div>
        )}
        <DealRegistrationPage
          stats={stats}
          deals={filtered}
          onNewDeal={() => navigate('/deals/new')}
          onDealUpdate={async (updatedDeal) => {
            try {
              await dealService.update(updatedDeal.id, {
                stage: updatedDeal.stage,
                status: updatedDeal.status || (updatedDeal.stage === 'ClosedWon' ? 'Closed Won' : updatedDeal.stage === 'ClosedLost' ? 'Closed Lost' : 'Approved'),
              });
              window.location.reload();
            } catch (e: any) { alert('更新失败: ' + e.message); }
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

function NewDealRoute() {
  const { t } = useLanguage();
  return (
    <ErrorBoundary>
      <div className="space-y-10">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">{t('newDeal.title')}</h1>
          <p className="text-on-surface-variant text-lg">{t('newDeal.subtitle')}</p>
        </div>
        <Suspense fallback={<PageLoader />}>
          <DealRegistrationForm />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

function MarketingRoute() {
  const [searchParams] = useSearchParams();
  const partnerFilter = searchParams.get('partner') || '';
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {partnerFilter && <div className="mb-4 text-sm text-neutral-500">合作伙伴: <strong>{partnerFilter}</strong></div>}
        <MarketingIncentivePage />
      </Suspense>
    </ErrorBoundary>
  );
}

function IncentivesRoute() {
  const [searchParams] = useSearchParams();
  const partnerFilter = searchParams.get('partner') || '';
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {partnerFilter && <div className="mb-4 text-sm text-neutral-500">筛选合作伙伴: <strong>{partnerFilter}</strong></div>}
        <IncentivesPage />
      </Suspense>
    </ErrorBoundary>
  );
}

function EnablementRoute() {
  const [searchParams] = useSearchParams();
  const partnerFilter = searchParams.get('partner') || '';
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {partnerFilter && <div className="mb-4 text-sm text-neutral-500">合作伙伴: <strong>{partnerFilter}</strong></div>}
        <EnablementPage />
      </Suspense>
    </ErrorBoundary>
  );
}

function AnalyticsRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <AnalyticsPage />
      </Suspense>
    </ErrorBoundary>
  );
}

function SettingsRoute() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <SettingsPage />
      </Suspense>
    </ErrorBoundary>
  );
}

function AppLayout() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      <Sidebar />

      <div className="flex-1 ml-60 flex flex-col">
        <NetworkStatus />
        <TopNav />

        <main className="flex-1 pt-20 pb-16 px-8 max-w-[1440px] mx-auto w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/ecosystem" replace />} />
              <Route path="/ecosystem" element={<EcosystemRoute />} />
              <Route path="/partners" element={<PartnersRoute />} />
              <Route path="/partners/new" element={<Suspense fallback={<PageLoader />}><PartnerFormPage /></Suspense>} />
            <Route path="/partners/:id" element={<PartnerProfileRoute />} />
              <Route path="/partners/:id/staff" element={<Suspense fallback={<PageLoader />}><PartnerStaffPage /></Suspense>} />
              <Route path="/deals" element={<DealsRoute />} />
              <Route path="/deals/new" element={<NewDealRoute />} />
              <Route path="/deals/:id" element={<Suspense fallback={<PageLoader />}><DealDetailPage /></Suspense>} />
              <Route path="/deals/:id/edit" element={<Suspense fallback={<PageLoader />}><DealRegistrationForm /></Suspense>} />
              <Route path="/customer/:name/analysis" element={<Suspense fallback={<PageLoader />}><CustomerAnalysis /></Suspense>} />
              <Route path="/marketing" element={<MarketingRoute />} />
              <Route path="/marketing/activity/:id" element={<Suspense fallback={<PageLoader />}><MarketingActivityDetail /></Suspense>} />
              <Route path="/marketing/plan" element={<Suspense fallback={<PageLoader />}><MarketingPlanPage /></Suspense>} />
              <Route path="/marketing/campaigns" element={<Suspense fallback={<PageLoader />}><CampaignManagementPage /></Suspense>} />
              <Route path="/marketing/campaigns/:id" element={<Suspense fallback={<PageLoader />}><CampaignDetailPage /></Suspense>} />
              <Route path="/marketing/budget" element={<Suspense fallback={<PageLoader />}><BudgetManagementPage /></Suspense>} />
              <Route path="/marketing/budget/:year" element={<Suspense fallback={<PageLoader />}><BudgetManagementPage /></Suspense>} />
              <Route path="/marketing/channel-campaigns" element={<Suspense fallback={<PageLoader />}><ChannelCampaignPage /></Suspense>} />
              <Route path="/marketing/incentive-policy" element={<Navigate to="/incentives" replace />} />
              <Route path="/incentives" element={<IncentivesRoute />} />
              <Route path="/incentives/:id/report" element={<Suspense fallback={<PageLoader />}><IncentiveClosingDashboard /></Suspense>} />
              <Route path="/enablement" element={<EnablementRoute />} />
              <Route path="/analytics" element={<AnalyticsRoute />} />
              <Route path="/settings" element={<SettingsRoute />} />
              <Route path="/channels" element={<Suspense fallback={<PageLoader />}><ChannelDashboard /></Suspense>} />
              <Route path="/invitation/:code" element={<Suspense fallback={<PageLoader />}><InvitationPage /></Suspense>} />
            </Routes>
        </main>

        <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 py-3 flex justify-center items-center gap-6">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <Shield className="w-3.5 h-3.5" />
            {t('footer.secure')}
          </div>
          <div className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
          <LiveClock />
          <div className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <HelpCircle className="w-3.5 h-3.5" />
            {t('footer.assistance')}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <AuthProvider>
          <LanguageProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<AuthGuard><AppLayout /></AuthGuard>} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}
