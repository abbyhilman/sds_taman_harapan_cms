import Image from 'next/image';
import Link from 'next/link';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eefbff] px-4 py-8">
      <Card className="w-full max-w-md border-0 shadow-xl shadow-cyan-100">
        <CardContent className="p-7 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
            <div className="relative h-16 w-16">
              <Image
                src="/logo_tamhar.png"
                alt="Logo SDS Taman Harapan"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="mx-auto mb-4 inline-flex items-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            <ShieldCheck className="mr-2 h-3.5 w-3.5" />
            Akses Admin
          </div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            CMS SDS Taman Harapan
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Halaman ini khusus untuk admin sekolah mengelola konten website dan
            data pendaftaran PPDB.
          </p>
          <AnimatedButton className="mt-7 w-full" size="lg" asChild>
            <Link href="/admin/login">
              <LockKeyhole className="mr-2 h-4 w-4" />
              Masuk Admin
            </Link>
          </AnimatedButton>
        </CardContent>
      </Card>
    </main>
  );
}


