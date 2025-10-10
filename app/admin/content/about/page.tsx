'use client';

import { useState, useEffect } from 'react';
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
  const [about, setAbout] = useState<AboutUs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const { data, error } = await supabase
        .from('about_us')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) setAbout(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!about) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('about_us')
        .update({
          vision: about.vision,
          mission: about.mission,
          description: about.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', about.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Data Tentang Kami berhasil disimpan',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
              value={about?.vision || ''}
              onChange={(e) =>
                setAbout(about ? { ...about, vision: e.target.value } : null)
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
              value={about?.mission || ''}
              onChange={(e) =>
                setAbout(about ? { ...about, mission: e.target.value } : null)
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
              value={about?.description || ''}
              onChange={(e) =>
                setAbout(about ? { ...about, description: e.target.value } : null)
              }
              placeholder="Masukkan deskripsi sekolah"
              rows={6}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
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
