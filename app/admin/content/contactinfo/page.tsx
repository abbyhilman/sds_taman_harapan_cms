'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ContactInfo {
  id: string;
  address_line1: string;
  address_line2: string;
  phone: string;
  email1: string;
  email2: string | null;
  operating_hours: string;
  operating_hours_subtext: string | null;
}

export default function ContactInfoCMS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localContactInfo, setLocalContactInfo] = useState<ContactInfo | null>(null);

  // Fetch Contact Info
  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ['contact_info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data as ContactInfo;
    },
  });

  // Sync local state when data is fetched
  useEffect(() => {
    if (contactInfo) {
      setLocalContactInfo(contactInfo);
    }
  }, [contactInfo]);

  // Mutation for saving
  const saveMutation = useMutation({
    mutationFn: async (updatedData: ContactInfo) => {
      const { error } = await supabase
        .from('contact_info')
        .update({
          address_line1: updatedData.address_line1,
          address_line2: updatedData.address_line2,
          phone: updatedData.phone,
          email1: updatedData.email1,
          email2: updatedData.email2,
          operating_hours: updatedData.operating_hours,
          operating_hours_subtext: updatedData.operating_hours_subtext,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact_info'] });
      toast({
        title: 'Berhasil',
        description: 'Data Kontak berhasil disimpan',
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
        <h1 className="text-3xl font-bold mb-2">Kelola Informasi Kontak</h1>
        <p className="text-muted-foreground">
          Perbarui informasi kontak sekolah seperti alamat, telepon, email, dan jam operasional
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Alamat</CardTitle>
            <CardDescription>Alamat utama sekolah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address_line1">Alamat Baris 1</Label>
                <Input
                  id="address_line1"
                  value={localContactInfo?.address_line1 || ''}
                  onChange={(e) =>
                    setLocalContactInfo(localContactInfo ? { ...localContactInfo, address_line1: e.target.value } : null)
                  }
                  placeholder="Masukkan alamat baris 1"
                />
              </div>
              <div>
                <Label htmlFor="address_line2">Alamat Baris 2 (Opsional)</Label>
                <Input
                  id="address_line2"
                  value={localContactInfo?.address_line2 || ''}
                  onChange={(e) =>
                    setLocalContactInfo(localContactInfo ? { ...localContactInfo, address_line2: e.target.value } : null)
                  }
                  placeholder="Masukkan alamat baris 2 (opsional)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Telepon</CardTitle>
            <CardDescription>Nomor telepon sekolah</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="phone"
              value={localContactInfo?.phone || ''}
              onChange={(e) =>
                setLocalContactInfo(localContactInfo ? { ...localContactInfo, phone: e.target.value } : null)
              }
              placeholder="Masukkan nomor telepon"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>Email kontak sekolah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email1">Email Utama</Label>
                <Input
                  id="email1"
                  type="email"
                  value={localContactInfo?.email1 || ''}
                  onChange={(e) =>
                    setLocalContactInfo(localContactInfo ? { ...localContactInfo, email1: e.target.value } : null)
                  }
                  placeholder="Masukkan email utama"
                />
              </div>
              <div>
                <Label htmlFor="email2">Email Sekunder (Opsional)</Label>
                <Input
                  id="email2"
                  type="email"
                  value={localContactInfo?.email2 || ''}
                  onChange={(e) =>
                    setLocalContactInfo(localContactInfo ? { ...localContactInfo, email2: e.target.value } : null)
                  }
                  placeholder="Masukkan email sekunder (opsional)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jam Operasional</CardTitle>
            <CardDescription>Informasi jam operasional sekolah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="operating_hours">Jam Operasional</Label>
                <Textarea
                  id="operating_hours"
                  value={localContactInfo?.operating_hours || ''}
                  onChange={(e) =>
                    setLocalContactInfo(localContactInfo ? { ...localContactInfo, operating_hours: e.target.value } : null)
                  }
                  placeholder="Masukkan jam operasional"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="operating_hours_subtext">Keterangan Tambahan (Opsional)</Label>
                <Textarea
                  id="operating_hours_subtext"
                  value={localContactInfo?.operating_hours_subtext || ''}
                  onChange={(e) =>
                    setLocalContactInfo(localContactInfo ? { ...localContactInfo, operating_hours_subtext: e.target.value } : null)
                  }
                  placeholder="Masukkan keterangan tambahan (opsional)"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={() => localContactInfo && saveMutation.mutate(localContactInfo)} 
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
