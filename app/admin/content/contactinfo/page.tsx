'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // Menggunakan Input untuk field teks biasa
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
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (data) setContactInfo(data);
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
    if (!contactInfo) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('contact_info')
        .update({
          address_line1: contactInfo.address_line1,
          address_line2: contactInfo.address_line2,
          phone: contactInfo.phone,
          email1: contactInfo.email1,
          email2: contactInfo.email2,
          operating_hours: contactInfo.operating_hours,
          operating_hours_subtext: contactInfo.operating_hours_subtext,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactInfo.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Data Kontak berhasil disimpan',
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
                  value={contactInfo?.address_line1 || ''}
                  onChange={(e) =>
                    setContactInfo(contactInfo ? { ...contactInfo, address_line1: e.target.value } : null)
                  }
                  placeholder="Masukkan alamat baris 1"
                />
              </div>
              <div>
                <Label htmlFor="address_line2">Alamat Baris 2 (Opsional)</Label>
                <Input
                  id="address_line2"
                  value={contactInfo?.address_line2 || ''}
                  onChange={(e) =>
                    setContactInfo(contactInfo ? { ...contactInfo, address_line2: e.target.value } : null)
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
              value={contactInfo?.phone || ''}
              onChange={(e) =>
                setContactInfo(contactInfo ? { ...contactInfo, phone: e.target.value } : null)
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
                  value={contactInfo?.email1 || ''}
                  onChange={(e) =>
                    setContactInfo(contactInfo ? { ...contactInfo, email1: e.target.value } : null)
                  }
                  placeholder="Masukkan email utama"
                />
              </div>
              <div>
                <Label htmlFor="email2">Email Sekunder (Opsional)</Label>
                <Input
                  id="email2"
                  type="email"
                  value={contactInfo?.email2 || ''}
                  onChange={(e) =>
                    setContactInfo(contactInfo ? { ...contactInfo, email2: e.target.value } : null)
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
                  value={contactInfo?.operating_hours || ''}
                  onChange={(e) =>
                    setContactInfo(contactInfo ? { ...contactInfo, operating_hours: e.target.value } : null)
                  }
                  placeholder="Masukkan jam operasional"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="operating_hours_subtext">Keterangan Tambahan (Opsional)</Label>
                <Textarea
                  id="operating_hours_subtext"
                  value={contactInfo?.operating_hours_subtext || ''}
                  onChange={(e) =>
                    setContactInfo(contactInfo ? { ...contactInfo, operating_hours_subtext: e.target.value } : null)
                  }
                  placeholder="Masukkan keterangan tambahan (opsional)"
                  rows={3}
                />
              </div>
            </div>
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