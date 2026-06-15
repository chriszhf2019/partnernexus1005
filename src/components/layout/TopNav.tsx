import React, { useState, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConfig } from '../../contexts/ConfigContext';

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
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Try to fetch from notifications table
        const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(10);
        if (data && data.length > 0) {
          setNotifications(data as Notification[]);
          setNotificationCount(data.filter((n: any) => !n.read).length);
        } else {
          // Fallback: check deal_lifecycle_events for recent activities
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

  return (
    <>
      <header className="fixed top-0 right-0 w-[calc(100%-15rem)] h-14 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              className="w-full h-9 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg pl-9 pr-3 text-sm dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              placeholder={t('partners.search')}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              aria-label="Search partners"
              role="searchbox"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white dark:ring-neutral-950 px-1">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          </div>
          <span className="text-xs font-medium text-neutral-400">PartnerNexus</span>
        </div>
      </header>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed top-14 right-0 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="font-semibold text-sm">通知</h3>
            <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-500">暂无通知</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification)}
                  className={`p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">{notification.message}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">{notification.created_at}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
});
