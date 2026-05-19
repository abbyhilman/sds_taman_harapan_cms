import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, LockKeyhole, School, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#eefbff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 rounded-lg bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11">
              <Image src="/logo_tamhar.png" alt="Logo SDS Taman Harapan" fill className="object-contain" />
            </div>
            <div>
              <p className="font-bold">SDS Taman Harapan</p>
              <p className="text-xs text-muted-foreground">Pendaftaran Peserta Didik Baru</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/login">
              <LockKeyhole className="mr-2 h-4 w-4" />
              Admin
            </Link>
          </Button>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Badge className="mb-5 bg-cyan-100 text-cyan-700 hover:bg-cyan-100">
              PPDB Tahun Ajaran 2026
            </Badge>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Daftar sekolah dasar yang hangat, tertib, dan siap mendampingi anak bertumbuh.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Isi formulir PPDB SDS Taman Harapan secara online. Data langsung masuk ke admin sekolah untuk proses verifikasi.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/ppdb">
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/admin/login">Masuk Admin</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-0 bg-cyan-500 text-white shadow-xl shadow-cyan-100">
            <CardContent className="relative p-8 text-center">
              <div className="absolute left-8 top-10 h-0 w-0 border-b-[30px] border-l-[18px] border-r-[18px] border-b-yellow-300 border-l-transparent border-r-transparent opacity-80" />
              <div className="absolute bottom-14 right-8 h-0 w-0 border-b-[36px] border-l-[22px] border-r-[22px] border-b-pink-400 border-l-transparent border-r-transparent opacity-80" />
              <p className="text-xl font-bold">Welcome To Kids School</p>
              <div className="relative mx-auto my-8 h-40 w-40 rounded-full border-4 border-white bg-white p-5 shadow-2xl">
                <Image src="/logo_tamhar.png" alt="Logo SDS Taman Harapan" fill className="object-contain p-6" priority />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Info icon={School} title="Jenjang SD" />
                <Info icon={Sparkles} title="PPDB Online" />
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function Info({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-cyan-700">
      <Icon className="mr-2 inline h-4 w-4" />
      {title}
    </div>
  );
}
