'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Image as ImageIcon, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PageLoading } from '@/components/ui/loading';
import { staggerContainer, staggerItem, fadeInDown } from '@/components/ui/animated';

interface HomepageSettings {
  id: string;
  welcome_title: string;
  welcome_description: string;
  hero_images: string[];
}

export default function HomepagePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<HomepageSettings | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['homepage_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('homepage_settings').select('*').maybeSingle();
      if (error) throw error;
      return data ? { ...data, hero_images: Array.isArray(data.hero_images) ? data.hero_images : [] } as HomepageSettings : null;
    },
  });

  useEffect(() => { if (settings) setLocalSettings(settings); }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (updatedData: HomepageSettings) => {
      const { error } = await supabase.from('homepage_settings').update({ welcome_title: updatedData.welcome_title, welcome_description: updatedData.welcome_description, hero_images: updatedData.hero_images, updated_at: new Date().toISOString() }).eq('id', updatedData.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['homepage_settings'] }); toast({ title: 'Berhasil', description: 'Pengaturan beranda berhasil disimpan' }); },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !localSettings) return;
    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `hero-${Date.now()}-${i}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(`hero/${fileName}`, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`hero/${fileName}`);
        uploadedUrls.push(publicUrl);
      }
      setLocalSettings({ ...localSettings, hero_images: [...localSettings.hero_images, ...uploadedUrls] });
      toast({ title: 'Berhasil', description: `${uploadedUrls.length} foto berhasil diunggah` });
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Upload gagal', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const removeImage = (index: number) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, hero_images: localSettings.hero_images.filter((_, i) => i !== index) });
  };

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat pengaturan beranda..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-4xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div variants={fadeInDown}>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2"><Home className="h-7 w-7 text-cyan-600" /> Beranda</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola konten halaman utama website</p>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Teks Sambutan</CardTitle><CardDescription>Judul dan deskripsi yang ditampilkan di halaman utama</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Judul Sambutan</Label><Input value={localSettings?.welcome_title || ''} onChange={(e) => setLocalSettings(localSettings ? { ...localSettings, welcome_title: e.target.value } : null)} placeholder="Selamat Datang di SDS Taman Harapan" className="mt-2" /></div>
              <div><Label>Deskripsi</Label><Textarea value={localSettings?.welcome_description || ''} onChange={(e) => setLocalSettings(localSettings ? { ...localSettings, welcome_description: e.target.value } : null)} placeholder="Deskripsi singkat tentang sekolah" rows={4} className="mt-2" /></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Foto Hero Section</CardTitle><CardDescription>Gambar yang ditampilkan di bagian atas halaman utama</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {localSettings?.hero_images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`Hero ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                    <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <Label htmlFor="hero-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                <ImageIcon className="w-6 h-6 text-slate-400" />
                <span className="mt-1 text-xs text-slate-500">{uploading ? 'Mengunggah...' : 'Upload foto hero'}</span>
              </Label>
              <Input id="hero-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="flex justify-end">
          <Button onClick={() => localSettings && saveMutation.mutate(localSettings)} disabled={saveMutation.isPending} className="bg-slate-950 hover:bg-slate-800">
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
