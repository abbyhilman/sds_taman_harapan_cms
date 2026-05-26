'use client';

import { ProtectedRoute } from '@/components/admin/ProtectedRoute';

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
