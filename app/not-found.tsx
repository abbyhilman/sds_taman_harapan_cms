import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fbff] px-4 py-10">
      <Card className="w-full max-w-4xl overflow-hidden border-0 bg-white shadow-xl shadow-cyan-100/70">
        <CardContent className="grid gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-10 md:items-center">
          <div className="order-2 space-y-5 md:order-1">
            <div className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              404 · Rute tidak tersedia
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Halaman tidak ditemukan
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                Link yang kamu buka mungkin sudah dipindahkan, belum dibuat, atau hanya bisa diakses dari menu admin yang tersedia.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <AnimatedButton asChild className="bg-slate-950 hover:bg-slate-800">
                <Link href="/admin/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Kembali ke Dashboard
                </Link>
              </AnimatedButton>
              <AnimatedButton asChild variant="outline" className="bg-white">
                <Link href="/admin/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Admin
                </Link>
              </AnimatedButton>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <Image
              src="/not-found-school.svg"
              alt="Ilustrasi halaman tidak ditemukan"
              width={720}
              height={520}
              className="h-auto w-full"
              priority
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}


