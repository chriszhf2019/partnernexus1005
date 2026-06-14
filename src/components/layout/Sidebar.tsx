import { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Handshake, FileText, Megaphone, Gift,
  GraduationCap, BarChart3, Settings, Plus, Network, Sun, Moon, LogOut,
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
      className="h-screen w-60 fixed left-0 top-0 flex flex-col z-50 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* System Branding */}
      <div className="h-14 flex items-center px-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-neutral-900 dark:bg-white rounded-lg flex items-center justify-center">
            <Network className="text-white dark:text-neutral-900 w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-white tracking-tight">PartnerNexus</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-auto">
        {NAV_GROUPS.map((group, gi) => {
          return (
            <div key={gi}>
              {gi > 0 && <div className="mx-3 mb-2 h-px bg-neutral-200 dark:bg-neutral-800" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative',
                        active
                          ? 'bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white before:absolute before:left-[-12px] before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-5 before:rounded-r-full before:bg-brand'
                          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white',
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* CTA */}
      <div className="px-3 pb-2">
        <button
          onClick={() => window.open(config.partnerCenterUrl || 'https://www.partner-center.com', '_blank', 'noopener,noreferrer')}
          className="w-full h-9 bg-brand hover:bg-brand/90 text-white rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          {config.ctaButtonLabel || '合作伙伴中心'}
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 border-t border-neutral-200 dark:border-neutral-800 pt-3">
        {/* Compact company info */}
        <div className="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group relative"
          title={`${config.companyAddress ? config.companyAddress + ' · ' : ''}${config.companyPhone ? config.companyPhone : ''}`.trim()}>
          <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-neutral-400">{config.companyName?.[0] || '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 truncate">{config.companyName || t('common.noData')}</p>
          </div>
        </div>

        {/* Theme + Language */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-md p-0.5">
            <button
              onClick={() => setLanguage('zh')}
              className={cn('px-2.5 py-1 rounded text-[11px] font-medium transition-all', language === 'zh' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}
            >
              中文
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={cn('px-2.5 py-1 rounded text-[11px] font-medium transition-all', language === 'en' ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-500')}
            >
              EN
            </button>
          </div>
        </div>

        {/* User info + Logout */}
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
          <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 shrink-0">
            {(user?.displayName || user?.email || '?')[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-neutral-900 dark:text-white truncate">{user?.displayName || user?.email || '用户'}</p>
            <p className="text-[11px] text-neutral-400 truncate">{role === 'admin' ? '系统管理员' : role === 'channel_manager' ? '渠道经理' : role === 'marketing_manager' ? '市场经理' : role === 'partner_admin' ? '渠道商管理员' : role === 'partner_sales' ? '合作伙伴销售' : role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
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
