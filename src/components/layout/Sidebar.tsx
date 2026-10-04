import { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Handshake, FileText, Megaphone, Gift,
  GraduationCap, BarChart3, Settings, Network, Sun, Moon, LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  path: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  permission?: string;
}

const NAV_GROUPS: { items: NavItem[] }[] = [
  {
    items: [
      { path: '/ecosystem', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    ],
  },
  {
    items: [
      { path: '/partners', labelKey: 'nav.partners', icon: Handshake },
      { path: '/deals', labelKey: 'nav.deals', icon: FileText },
    ],
  },
  {
    items: [
      { path: '/marketing', labelKey: 'nav.marketing', icon: Megaphone },
      { path: '/incentives', labelKey: 'nav.incentives', icon: Gift },
      { path: '/enablement', labelKey: 'nav.enablement', icon: GraduationCap },
    ],
  },
  {
    items: [
      { path: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
      { path: '/settings', labelKey: 'nav.settings', icon: Settings },
    ],
  },
];

export const Sidebar = memo(() => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { config } = useConfig();
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/ecosystem' && location.pathname.startsWith(path));

  return (
    <aside
      className="h-screen w-60 fixed left-0 top-0 flex flex-col z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-2xl border-r border-neutral-200/50 dark:border-neutral-800/50"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* System Branding */}
      <div className="h-16 flex items-center px-5 border-b border-neutral-100 dark:border-neutral-800/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow transition-shadow hover:shadow-glow-accent">
            <Network className="text-white w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-neutral-900 dark:text-white tracking-tight">PartnerNexus</span>
            <span className="text-[9px] font-medium text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">Partner Management</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
        {NAV_GROUPS.map((group, gi) => {
          return (
            <div key={gi}>
              {gi > 0 && <div className="mx-3 my-3 h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-800 to-transparent" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative group',
                        active
                          ? 'bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand/10 dark:to-accent/10 text-brand-700 dark:text-brand-300 shadow-sm'
                          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-800 dark:hover:text-neutral-200',
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-brand-500 to-accent-500" />
                      )}
                      <item.icon className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors',
                        active ? 'text-brand-600 dark:text-brand-400' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300',
                      )} aria-hidden="true" />
                      <span className="truncate">{t(item.labelKey)}</span>
                      {active && (
                        <Sparkles className="w-3 h-3 ml-auto text-accent-400 opacity-60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* CTA */}
      <div className="px-3 pb-3">
        <button
          onClick={() => window.open(config.partnerCenterUrl || 'https://www.partner-center.com', '_blank', 'noopener,noreferrer')}
          className="w-full h-10 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-glow hover:shadow-glow-accent hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          {config.ctaButtonLabel || '合作伙伴中心'}
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 border-t border-neutral-100 dark:border-neutral-800/50 pt-3">
        {/* Compact company info */}
        <div className="flex items-center gap-2.5 px-2 py-2 mb-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all duration-200 group relative"
          title={`${config.companyAddress ? config.companyAddress + ' · ' : ''}${config.companyPhone ? config.companyPhone : ''}`.trim()}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand/20 dark:to-accent/20 flex items-center justify-center shrink-0 ring-1 ring-brand-200/50 dark:ring-brand-800/30">
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">{config.companyName?.[0] || '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 truncate">{config.companyName || t('common.noData')}</p>
          </div>
        </div>

        {/* Theme + Language */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-brand-500 dark:hover:text-brand-400 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex gap-0.5 bg-neutral-100/80 dark:bg-neutral-800/80 rounded-lg p-0.5 ring-1 ring-neutral-200/50 dark:ring-neutral-700/30">
            <button
              onClick={() => setLanguage('zh')}
              className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200', language === 'zh' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}
            >
              中文
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200', language === 'en' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}
            >
              EN
            </button>
          </div>
        </div>

        {/* User info + Logout */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all duration-200 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm">
            {(user?.displayName || user?.email || '?')[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-neutral-900 dark:text-white truncate">{user?.displayName || user?.email || '用户'}</p>
            <p className="text-[10px] text-neutral-400 truncate">{role === 'admin' ? '系统管理员' : role === 'channel_manager' ? '渠道经理' : role === 'marketing_manager' ? '市场经理' : role === 'partner_admin' ? '渠道商管理员' : role === 'partner_sales' ? '合作伙伴销售' : role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
            aria-label="Logout"
            title="退出登录"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
});
