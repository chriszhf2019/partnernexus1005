import React, { useState, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, X, Sparkles, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';
import { cn } from '../../lib/utils';

import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  type?: string;
}

export const TopNav: React.FC = memo(() => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { config } = useConfig();
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
        if (data && data.length > 0) {
          setNotifications(data as Notification[]);
          setNotificationCount(data.filter((n: any) => !n.read).length);
        } else {
          const { data: events } = await supabase.from('deal_lifecycle_events').select('*, deals(title)').order('event_date', { ascending: false }).limit(5);
          if (events && events.length > 0) {
            const mockNotifications: Notification[] = events.map((e: any, idx) => ({
              id: `mock-${idx}`,
              title: '商机动态',
              message: `${e.deals?.title || '某商机'} 状态更新: ${e.stage}`,
              created_at: e.event_date,
              read: false,
              type: 'deal'
            }));
            setNotifications(mockNotifications);
            setNotificationCount(mockNotifications.filter(n => !n.read).length);
          } else {
            setNotificationCount(0);
          }
        }
      } catch {
        setNotificationCount(0);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.id.startsWith('mock-')) return;
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.warn('[TopNav] Error:', e); }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/partners?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <header className="fixed top-0 right-0 w-[calc(100%-15rem)] h-16 z-40 bg-white/60 dark:bg-neutral-950/60 backdrop-blur-2xl border-b border-neutral-200/40 dark:border-neutral-800/40 flex items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className={cn(
            "relative w-full max-w-sm transition-all duration-300",
            isSearchFocused && "max-w-md"
          )}>
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
              isSearchFocused ? "text-brand-500" : "text-neutral-400"
            )} />
            <input
              className="w-full h-10 bg-neutral-100/80 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50 rounded-xl pl-10 pr-4 text-sm dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 focus:bg-white dark:focus:bg-neutral-800 transition-all duration-200"
              placeholder={t('partners.search') || '搜索合作伙伴...'}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label="Search partners"
              role="searchbox"
            />
            {isSearchFocused && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 bg-neutral-200/60 dark:bg-neutral-700/60 rounded-md border border-neutral-300/40 dark:border-neutral-600/40">
                ↵
              </kbd>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "relative p-2.5 rounded-xl transition-all duration-200",
                showNotifications
                  ? "bg-brand-50 dark:bg-brand/10 text-brand-600 dark:text-brand-400"
                  : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
              )}
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-neutral-950 px-1 shadow-sm">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-neutral-200/60 dark:bg-neutral-700/40" />

          {/* Page title area */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-brand to-accent animate-pulse" />
            <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">PartnerNexus</span>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed top-16 right-6 w-96 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-700/40 rounded-2xl shadow-elevated z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-50/50 to-accent-50/50 dark:from-brand/5 dark:to-accent/5 border-b border-neutral-100 dark:border-neutral-800/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">通知中心</h3>
              {notificationCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand/20 rounded-full">
                  {notificationCount} 新
                </span>
              )}
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
                </div>
                <p className="text-sm font-medium text-neutral-500">暂无通知</p>
                <p className="text-xs text-neutral-400 mt-1">新通知将会在这里显示</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification)}
                  className={cn(
                    "p-4 border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 cursor-pointer transition-all duration-150",
                    !notification.read && "bg-brand-50/30 dark:bg-brand/5 border-l-2 border-l-brand-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {!notification.read && (
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-brand-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{notification.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-[11px] text-neutral-400">{formatTime(notification.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
});
