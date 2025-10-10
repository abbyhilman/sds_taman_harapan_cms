'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Image, Video, Newspaper, Award, Building } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Stats {
  programs: number;
  facilities: number;
  achievements: number;
  news: number;
  photos: number;
  videos: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    programs: 0,
    facilities: 0,
    achievements: 0,
    news: 0,
    photos: 0,
    videos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [programs, facilities, achievements, news, photos, videos] = await Promise.all([
        supabase.from('programs').select('*', { count: 'exact', head: true }),
        supabase.from('facilities').select('*', { count: 'exact', head: true }),
        supabase.from('achievements').select('*', { count: 'exact', head: true }),
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('gallery_photos').select('*', { count: 'exact', head: true }),
        supabase.from('gallery_videos').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        programs: programs.count || 0,
        facilities: facilities.count || 0,
        achievements: achievements.count || 0,
        news: news.count || 0,
        photos: photos.count || 0,
        videos: videos.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Program Unggulan', value: stats.programs, icon: FileText, color: 'text-blue-600' },
    { title: 'Fasilitas', value: stats.facilities, icon: Building, color: 'text-green-600' },
    { title: 'Prestasi', value: stats.achievements, icon: Award, color: 'text-yellow-600' },
    { title: 'Berita', value: stats.news, icon: Newspaper, color: 'text-red-600' },
    { title: 'Foto', value: stats.photos, icon: Image, color: 'text-purple-600' },
    { title: 'Video', value: stats.videos, icon: Video, color: 'text-pink-600' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di Admin Panel CMS SDS Taman Harapan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? '-' : card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total {card.title.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      
    </div>
  );
}
