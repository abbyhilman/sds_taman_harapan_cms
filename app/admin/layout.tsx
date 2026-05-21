'use client';

import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppLoadingScreen } from '@/components/ui/app-loading-screen';

function AdminShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  return (
    <>
      <AnimatePresence>{loading && <AppLoadingScreen key="admin-loading" />}</AnimatePresence>
      {children}
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
