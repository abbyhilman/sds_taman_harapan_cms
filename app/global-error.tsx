'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Home, RotateCcw } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-[#f8fbff] px-4 py-10 font-sans">
          <div className="grid w-full max-w-4xl gap-8 rounded-3xl bg-white p-6 shadow-xl shadow-rose-100/70 md:grid-cols-[1.1fr_0.9fr] md:items-center md:p-10">
            <div className="order-2 space-y-5 md:order-1">
              <div className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                Critical Error
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Aplikasi gagal dimuat
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Terjadi gangguan pada aplikasi. Coba muat ulang atau kembali ke dashboard admin.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <AnimatedButton onClick={reset} className="bg-slate-950 hover:bg-slate-800">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Coba Lagi
                </AnimatedButton>
                <AnimatedButton asChild variant="outline" className="bg-white">
                  <Link href="/admin/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </AnimatedButton>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Image src="/error-school.svg" alt="Ilustrasi error aplikasi" width={720} height={520} className="h-auto w-full" priority />
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
