'use client';

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((mod) => mod.ReactQueryDevtools),
  { ssr: false }
);

function isAuthError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { status?: number; statusCode?: number; message?: string };
  if (err.status === 401 || err.statusCode === 401) return true;
  const msg = (err.message ?? '').toLowerCase();
  return msg.includes('jwt expired') || msg.includes('invalid claim') || msg.includes('token expired');
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isAuthError(error)) {
          console.warn('[QueryProvider] Auth error detected, signing out');
          supabase.auth.signOut();
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isAuthError(error)) return false;
          return failureCount < 2;
        },
        retryDelay: 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
