'use client';

import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (profile && !profile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fbff]">
        <div className="text-center space-y-4">
          <ShieldX className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-semibold">Akun Dinonaktifkan</h2>
          <p className="text-muted-foreground">Akun Anda telah dinonaktifkan. Hubungi administrator.</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && profile && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fbff]">
        <div className="text-center space-y-4">
          <ShieldX className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-semibold">Akses Ditolak</h2>
          <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
