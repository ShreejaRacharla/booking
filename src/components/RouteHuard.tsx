import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UserRole } from '../types';

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

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      router.replace(redirectTo);
      return;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Redirect based on user role
      const defaultPath = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      router.replace(defaultPath);
    }
  }, [isAuthenticated, user, hydrated, allowedRoles, router, redirectTo]);

  // Show nothing while checking authentication
  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rotary-royal"></div>
      </div>
    );
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}