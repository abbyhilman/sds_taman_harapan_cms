'use client';

import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Sidebar } from '@/components/admin/Sidebar';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <div className="flex min-h-screen bg-[#f8fbff]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#f8fbff] pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
