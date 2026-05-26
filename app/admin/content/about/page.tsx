'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PageLoading } from '@/components/ui/loading';
import { staggerContainer, staggerItem, fadeInDown } from '@/components/ui/animated';

interface AboutUs { id: string; vision: string; mission: string; description: string; }

export default function AboutPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localAbout, setLocalAbout] = useState<AboutUs | null>(null);

  const { data: about, isLoading } = useQuery({
    queryKey: ['about_us'],
    queryFn: async () => { const { data, error } = await supabase.from('about_us').select('*').maybeSingle(); if (error) throw error; return data as AboutUs; },
  });

  useEffect(() => { if (about) setLocalAbout(about); }, [about]);

  const saveMutation = useMutation({
    mutationFn: async (updatedData: AboutUs) => {
      const { error } = await supabase.from('about_us').update({ vision: updatedData.vision, mission: updatedData.mission, description: updatedData.description, updated_at: new Date().toISOString() }).eq('id', updatedData.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['about_us'] }); toast({ title: 'Berhasil', description: 'Data Tentang Kami berhasil disimpan' }); },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat data tentang kami..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-4xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div variants={fadeInDown}>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2"><Info className="h-7 w-7 text-cyan-600" /> Tentang Kami</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola informasi visi, misi, dan deskripsi sekolah</p>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Visi</CardTitle><CardDescription>Visi sekolah untuk masa depan</CardDescription></CardHeader>
            <CardContent><Textarea value={localAbout?.vision || ''} onChange={(e) => setLocalAbout(localAbout ? { ...localAbout, vision: e.target.value } : null)} placeholder="Masukkan visi sekolah" rows={4} /></CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Misi</CardTitle><CardDescription>Misi sekolah dalam mencapai visi</CardDescription></CardHeader>
            <CardContent><Textarea value={localAbout?.mission || ''} onChange={(e) => setLocalAbout(localAbout ? { ...localAbout, mission: e.target.value } : null)} placeholder="Masukkan misi sekolah" rows={6} /></CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Deskripsi Sekolah</CardTitle><CardDescription>Deskripsi singkat tentang sekolah</CardDescription></CardHeader>
            <CardContent><Textarea value={localAbout?.description || ''} onChange={(e) => setLocalAbout(localAbout ? { ...localAbout, description: e.target.value } : null)} placeholder="Masukkan deskripsi sekolah" rows={6} /></CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="flex justify-end">
          <Button onClick={() => localAbout && saveMutation.mutate(localAbout)} disabled={saveMutation.isPending} className="bg-slate-950 hover:bg-slate-800">
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
