import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const TopNav: React.FC = memo(() => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/partners?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
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
        <button className="relative p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-950" />
        </button>
        <span className="text-xs font-medium text-neutral-400">PartnerNexus</span>
      </div>
    </header>
  );
});
