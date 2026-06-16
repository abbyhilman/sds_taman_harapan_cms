'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

import { MiniAreaChart, PpdbDonutChart } from '@/components/admin/DashboardCharts';

interface Stats {
  programs: number;
  facilities: number;
  achievements: number;
  news: number;
  photos: number;
  videos: number;
  registrations: number;
  acceptedRegistrations: number;
  activeStudents: number;
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
  activeStudents: 0,
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
  if (filter) query = query.eq(filter.column, filter.value);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -30 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 30 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const contentItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function DashboardPage() {
  const { user } = useAuth();

  const {
    data: stats = emptyStats,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const [
        programs, facilities, achievements, news, photos, videos,
        registrations, acceptedRegistrations, activeStudents,
      ] = await Promise.all([
        getCount('programs'),
        getCount('facilities'),
        getCount('achievements'),
        getCount('news'),
        getCount('gallery_photos'),
        getCount('gallery_videos'),
        getCount('ppdb_registrations'),
        getCount('ppdb_registrations', { column: 'status', value: 'diterima' }),
        getCount('students', { column: 'status', value: 'active' }),
      ]);
      return { programs, facilities, achievements, news, photos, videos, registrations, acceptedRegistrations, activeStudents };
    },
    enabled: !!user,
  });

  const cards = useMemo(() => [
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
      title: 'Data Siswa',
      value: stats.activeStudents,
      helper: 'siswa aktif terdaftar',
      icon: UserRound,
      color: '#10b981',
      fill: 'rgba(16, 185, 129, 0.18)',
      data: buildSeries(stats.activeStudents, 2),
    },
    {
      title: 'Konten & Galeri',
      value: stats.programs + stats.facilities + stats.news + stats.photos + stats.videos,
      helper: `${stats.news} berita, ${stats.photos} foto, ${stats.videos} video`,
      icon: Newspaper,
      color: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.22)',
      data: buildSeries(stats.programs + stats.facilities + stats.news + stats.photos + stats.videos, 3),
    },
  ], [stats]);

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
      {/* Header with fade in */}
      <motion.div 
        className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan CMS SDS Taman Harapan dan pendaftaran PPDB 2026.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white">
            {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())}
          </Badge>
        </div>
      </motion.div>

      {isError && (
        <Alert variant="destructive" className="mb-6 bg-white">
          <AlertTitle>Dashboard gagal memuat data</AlertTitle>
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      {/* Top Stats Cards - slide from bottom with stagger */}
      <motion.div 
        className="grid gap-5 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {cards.map((card, index) => (
          <motion.div key={card.title} variants={cardVariants}>
            <SmoothStatCard {...card} loading={isLoading} index={index} />
          </motion.div>
        ))}
      </motion.div>

      {/* Bottom Section */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        {/* Content Stats - slide from left */}
        <motion.div
          variants={slideFromLeft}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 bg-white shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Aktivitas Konten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div 
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {contentStats.map((item, index) => (
                  <motion.div 
                    key={item.label} 
                    className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow"
                    variants={contentItemVariants}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-full', item.className)}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{isLoading ? '-' : item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* PPDB Status - slide from right */}
        <motion.div
          variants={slideFromRight}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 bg-white shadow-sm h-full">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Status PPDB</CardTitle>
                <p className="text-sm text-muted-foreground">Komposisi pendaftar diterima dan menunggu proses.</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <UserRound className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[240px_1fr] lg:items-center">
                <PpdbDonutChart total={stats.registrations} accepted={stats.acceptedRegistrations} loading={isLoading} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
  index = 0,
}: {
  title: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  color: string;
  fill: string;
  data: { month: string; total: number }[];
  loading: boolean;
  index?: number;
}) {
  return (
    <Card className="overflow-hidden border-0 bg-white shadow-lg shadow-slate-100 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-0">
        <motion.div 
          className="flex h-12 w-12 items-center justify-center rounded-full" 
          style={{ backgroundColor: fill }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2 + index * 0.1, duration: 0.5, type: 'spring' }}
        >
          <Icon className="h-6 w-6" style={{ color }} />
        </motion.div>
        <div className="text-right">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <motion.span 
              className="font-semibold" 
              style={{ color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : value}
            </motion.span>
            <span>{helper}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="h-[118px]">
          <MiniAreaChart title={title} color={color} data={data} />
        </div>
      </CardContent>
    </Card>
  );
}
