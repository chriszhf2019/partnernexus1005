import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900 p-6">
      <div className="max-w-md w-full text-center">
        {/* 404 Visual */}
        <div className="relative mb-8">
          <div className="text-[180px] font-black leading-none bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent select-none">
            404
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-neutral-400 dark:text-neutral-600">
            <Search className="w-16 h-16 mx-auto" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-3">
          页面不存在
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          抱歉，您访问的页面不存在或已被移除。<br />
          请检查 URL 是否正确，或返回首页继续浏览。
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上一页
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-colors shadow-lg shadow-blue-500/25"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-400 mb-4">您可能想访问：</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: '工作台', path: '/ecosystem' },
              { label: '合作伙伴', path: '/partners' },
              { label: '商机管理', path: '/deals' },
              { label: '营销赋能', path: '/marketing' },
              { label: '设置', path: '/settings' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
