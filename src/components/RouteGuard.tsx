import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UserRole } from '../types';
import Loader from './loader';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function RouteGuard({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, hydrated } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || !user) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      const defaultPath = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      router.replace(defaultPath);
    }
  }, [isAuthenticated, user, hydrated, allowedRoles, router, redirectTo]);

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <Loader fullScreen/>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}