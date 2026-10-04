import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@partnernxus.com');
  const [password, setPassword] = useState('Demo@123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/ecosystem', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('Invalid login credentials')) {
        setError('邮箱或密码错误，请重试');
      } else if (msg.includes('Email not confirmed')) {
        setError('邮箱尚未确认，请检查收件箱');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950" />
      <div className="absolute inset-0 gradient-mesh" />

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200/20 dark:bg-brand-900/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-200/20 dark:bg-accent-900/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-brand-300/10 dark:bg-brand-800/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-md px-4 space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-glow">
              <Network className="text-white w-6 h-6" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">PartnerNexus</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('login.subtitle')}</p>
          </div>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[
              { icon: Shield, text: t('login.security') },
              { icon: Zap, text: t('login.analytics') },
              { icon: Globe, text: t('login.global') },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/60 dark:bg-neutral-800/40 backdrop-blur-sm rounded-full border border-neutral-200/40 dark:border-neutral-700/30 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <Icon className="w-3 h-3 text-brand-500" />
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* Login Card */}
        <Card className="p-8 space-y-6 shadow-elevated border-t-2 border-t-brand relative overflow-hidden" padding={false}>
          <div className="p-8 space-y-6">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-brand-50/60 to-transparent dark:from-brand-900/10 rounded-bl-[5rem] pointer-events-none" />

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/40 rounded-xl text-sm text-red-600 dark:text-red-400 backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">{t('login.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required autoComplete="email"
                    className="w-full h-11 pl-11 pr-4 bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/50 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all backdrop-blur-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">{t('login.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input id="password" type={showPassword ? 'text' : 'password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete="current-password"
                    className="w-full h-11 pl-11 pr-11 bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/50 rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all backdrop-blur-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg" variant="brand">
                {t('login.submit')} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
          {t('footer.copyright')}
        </p>
      </div>
    </div>
  );
};
