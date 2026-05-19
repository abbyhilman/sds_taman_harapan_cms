'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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

  // Fetch Settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['homepage_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (data) {
        return {
          ...data,
          hero_images: Array.isArray(data.hero_images) ? data.hero_images : [],
        } as HomepageSettings;
      }
      return null;
    },
  });

  // Sync local state
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Mutation for saving
  const saveMutation = useMutation({
    mutationFn: async (updatedData: HomepageSettings) => {
      const { error } = await supabase
        .from('homepage_settings')
        .update({
          welcome_title: updatedData.welcome_title,
          welcome_description: updatedData.welcome_description,
          hero_images: updatedData.hero_images,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepage_settings'] });
      toast({
        title: 'Berhasil',
        description: 'Pengaturan beranda berhasil disimpan',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
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
        const filePath = `hero/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setLocalSettings({
        ...localSettings,
        hero_images: [...localSettings.hero_images, ...uploadedUrls],
      });

      toast({
        title: 'Berhasil',
        description: `${uploadedUrls.length} foto berhasil diunggah`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    if (!localSettings) return;
    const newImages = localSettings.hero_images.filter((_, i) => i !== index);
    setLocalSettings({ ...localSettings, hero_images: newImages });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Beranda</h1>
        <p className="text-muted-foreground">
          Kelola konten halaman utama website
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teks Sambutan</CardTitle>
            <CardDescription>
              Judul dan deskripsi yang ditampilkan di halaman utama
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Sambutan</Label>
              <Input
                id="title"
                value={localSettings?.welcome_title || ''}
                onChange={(e) =>
                  setLocalSettings(localSettings ? { ...localSettings, welcome_title: e.target.value } : null)
                }
                placeholder="Selamat Datang di SDS Taman Harapan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={localSettings?.welcome_description || ''}
                onChange={(e) =>
                  setLocalSettings(localSettings ? { ...localSettings, welcome_description: e.target.value } : null)
                }
                placeholder="Deskripsi singkat tentang sekolah"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={() => localSettings && saveMutation.mutate(localSettings)} 
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
