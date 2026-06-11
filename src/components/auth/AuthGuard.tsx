import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../ui/PageLoader';
import { useLanguage } from '../../contexts/LanguageContext';
import type { UserRole } from '../../services/auth-service';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const { user, loading, hasPermission } = useAuth();
  const { t } = useLanguage();

  if (loading) return <PageLoader />;

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-lg font-black text-slate-400">{t('common.unauthorized')}</h2>
        <p className="text-sm text-slate-500">{t('common.noData')}</p>
      </div>
    );
  }

  return <>{children}</>;
};
