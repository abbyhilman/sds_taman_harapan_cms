'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AboutUs {
  id: string;
  vision: string;
  mission: string;
  description: string;
}

export default function AboutPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localAbout, setLocalAbout] = useState<AboutUs | null>(null);

  // Fetch About Data
  const { data: about, isLoading } = useQuery({
    queryKey: ['about_us'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('about_us')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data as AboutUs;
    },
  });

  // Sync local state when data is fetched
  useEffect(() => {
    if (about) {
      setLocalAbout(about);
    }
  }, [about]);

  // Mutation for saving
  const saveMutation = useMutation({
    mutationFn: async (updatedData: AboutUs) => {
      const { error } = await supabase
        .from('about_us')
        .update({
          vision: updatedData.vision,
          mission: updatedData.mission,
          description: updatedData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about_us'] });
      toast({
        title: 'Berhasil',
        description: 'Data Tentang Kami berhasil disimpan',
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
        <h1 className="text-3xl font-bold mb-2">Tentang Kami</h1>
        <p className="text-muted-foreground">
          Kelola informasi visi, misi, dan deskripsi sekolah
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Visi</CardTitle>
            <CardDescription>
              Visi sekolah untuk masa depan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={localAbout?.vision || ''}
              onChange={(e) =>
                setLocalAbout(localAbout ? { ...localAbout, vision: e.target.value } : null)
              }
              placeholder="Masukkan visi sekolah"
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Misi</CardTitle>
            <CardDescription>
              Misi sekolah dalam mencapai visi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={localAbout?.mission || ''}
              onChange={(e) =>
                setLocalAbout(localAbout ? { ...localAbout, mission: e.target.value } : null)
              }
              placeholder="Masukkan misi sekolah"
              rows={6}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deskripsi Sekolah</CardTitle>
            <CardDescription>
              Deskripsi singkat tentang sekolah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={localAbout?.description || ''}
              onChange={(e) =>
                setLocalAbout(localAbout ? { ...localAbout, description: e.target.value } : null)
              }
              placeholder="Masukkan deskripsi sekolah"
              rows={6}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={() => localAbout && saveMutation.mutate(localAbout)} 
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
