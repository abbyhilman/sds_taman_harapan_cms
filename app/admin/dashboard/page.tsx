'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Building,
  Camera,
  FileText,
  Loader2,
  Newspaper,
  Sparkles,
  UserRound,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Stats {
  programs: number;
  facilities: number;
  achievements: number;
  news: number;
  photos: number;
  videos: number;
  registrations: number;
  acceptedRegistrations: number;
}

const emptyStats: Stats = {
  programs: 0,
  facilities: 0,
  achievements: 0,
  news: 0,
  photos: 0,
  videos: 0,
  registrations: 0,
  acceptedRegistrations: 0,
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Dashboard belum bisa memuat data.';

const buildSeries = (value: number, seed: number) => {
  const base = Math.max(value, 1);
  return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'].map((month, index) => ({
    month,
    total: Math.max(0, Math.round(base * (0.28 + index * 0.13) + ((index + seed) % 3) * 2)),
  }));
};

async function getCount(table: string, filter?: { column: string; value: string }) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export default function DashboardPage() {
  const {
    data: stats = emptyStats,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const [
        programs,
        facilities,
        achievements,
        news,
        photos,
        videos,
        registrations,
        acceptedRegistrations,
      ] = await Promise.all([
        getCount('programs'),
        getCount('facilities'),
        getCount('achievements'),
        getCount('news'),
        getCount('gallery_photos'),
        getCount('gallery_videos'),
        getCount('ppdb_registrations'),
        getCount('ppdb_registrations', { column: 'status', value: 'diterima' }),
      ]);

      return {
        programs,
        facilities,
        achievements,
        news,
        photos,
        videos,
        registrations,
        acceptedRegistrations,
      };
    },
  });

  const cards = useMemo(
    () => [
      {
        title: 'Pendaftar PPDB',
        value: stats.registrations,
        helper: `${stats.acceptedRegistrations} diterima`,
        icon: Users,
        color: '#06b6d4',
        fill: 'rgba(6, 182, 212, 0.18)',
        data: buildSeries(stats.registrations, 1),
      },
      {
        title: 'Konten Website',
        value: stats.programs + stats.facilities + stats.news,
        helper: `${stats.news} berita aktif`,
        icon: Newspaper,
        color: '#f59e0b',
        fill: 'rgba(245, 158, 11, 0.22)',
        data: buildSeries(stats.programs + stats.facilities + stats.news, 2),
      },
      {
        title: 'Media Galeri',
        value: stats.photos + stats.videos,
        helper: `${stats.photos} foto, ${stats.videos} video`,
        icon: Camera,
        color: '#ef4444',
        fill: 'rgba(239, 68, 68, 0.18)',
        data: buildSeries(stats.photos + stats.videos, 3),
      },
    ],
    [stats]
  );

  const contentStats = [
    { label: 'Program', value: stats.programs, icon: BookOpen, className: 'bg-sky-50 text-sky-700' },
    { label: 'Fasilitas', value: stats.facilities, icon: Building, className: 'bg-emerald-50 text-emerald-700' },
    { label: 'Prestasi', value: stats.achievements, icon: Award, className: 'bg-amber-50 text-amber-700' },
    { label: 'Berita', value: stats.news, icon: FileText, className: 'bg-rose-50 text-rose-700' },
    { label: 'Foto', value: stats.photos, icon: Camera, className: 'bg-violet-50 text-violet-700' },
    { label: 'Video', value: stats.videos, icon: Video, className: 'bg-pink-50 text-pink-700' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan CMS SDS Taman Harapan dan pendaftaran PPDB 2026.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white">
            {new Intl.DateTimeFormat('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).format(new Date())}
          </Badge>
          <Button className="rounded-full bg-pink-500 hover:bg-pink-600">Share</Button>
          <Button className="rounded-full bg-amber-400 text-amber-950 hover:bg-amber-500">
            More Details
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6 bg-white">
          <AlertTitle>Dashboard gagal memuat data</AlertTitle>
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {cards.map((card) => (
          <SmoothStatCard key={card.title} {...card} loading={isLoading} />
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Aktivitas Konten
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {contentStats.map((item) => (
              <div key={item.label} className="rounded-lg border bg-white p-4">
                <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-full', item.className)}>
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold tabular-nums">{isLoading ? '-' : item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Kesehatan PPDB</CardTitle>
              <p className="text-sm text-muted-foreground">Perbandingan total pendaftar dan siswa diterima.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <UserRound className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { label: 'Total', total: stats.registrations, accepted: stats.acceptedRegistrations },
                    { label: 'Aktif', total: Math.max(stats.registrations - stats.acceptedRegistrations, 0), accepted: stats.acceptedRegistrations },
                    { label: 'Diterima', total: stats.acceptedRegistrations, accepted: stats.acceptedRegistrations },
                  ]}
                  margin={{ left: 0, right: 8, top: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#06b6d4"
                    fill="rgba(6, 182, 212, 0.18)"
                    strokeWidth={3}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="accepted"
                    stroke="#10b981"
                    fill="rgba(16, 185, 129, 0.15)"
                    strokeWidth={3}
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SmoothStatCard({
  title,
  value,
  helper,
  icon: Icon,
  color,
  fill,
  data,
  loading,
}: {
  title: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  color: string;
  fill: string;
  data: { month: string; total: number }[];
  loading: boolean;
}) {
  return (
    <Card className="overflow-hidden border-0 bg-white shadow-lg shadow-slate-100">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: fill }}>
          <Icon className="h-6 w-6" style={{ color }} />
        </div>
        <div className="text-right">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span className="font-semibold" style={{ color }}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : value}
            </span>
            <span>{helper}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="h-[118px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 0, top: 16, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="total"
                stroke={color}
                fill={`url(#fill-${title.replace(/\s+/g, '-')})`}
                strokeWidth={3}
                dot={false}
                animationDuration={1100}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
