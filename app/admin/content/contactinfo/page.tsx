'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PageLoading } from '@/components/ui/loading';
import { staggerContainer, staggerItem, fadeInDown } from '@/components/ui/animated';

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

  const { data: contactInfo, isLoading } = useQuery({
    queryKey: ['contact_info'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_info').select('*').maybeSingle();
      if (error) throw error;
      return data as ContactInfo;
    },
  });

  useEffect(() => { if (contactInfo) setLocalContactInfo(contactInfo); }, [contactInfo]);

  const saveMutation = useMutation({
    mutationFn: async (updatedData: ContactInfo) => {
      const { error } = await supabase.from('contact_info').update({
        address_line1: updatedData.address_line1,
        address_line2: updatedData.address_line2,
        phone: updatedData.phone,
        email1: updatedData.email1,
        email2: updatedData.email2,
        operating_hours: updatedData.operating_hours,
        operating_hours_subtext: updatedData.operating_hours_subtext,
        updated_at: new Date().toISOString(),
      }).eq('id', updatedData.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contact_info'] }); toast({ title: 'Berhasil', description: 'Data Kontak berhasil disimpan' }); },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat informasi kontak..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-4xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div variants={fadeInDown}>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2"><Phone className="h-7 w-7 text-cyan-600" /> Informasi Kontak</h1>
          <p className="mt-1 text-sm text-muted-foreground">Perbarui informasi kontak sekolah</p>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Alamat</CardTitle><CardDescription>Alamat utama sekolah</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Alamat Baris 1</Label><Input value={localContactInfo?.address_line1 || ''} onChange={(e) => setLocalContactInfo(localContactInfo ? { ...localContactInfo, address_line1: e.target.value } : null)} placeholder="Masukkan alamat baris 1" className="mt-2" /></div>
              <div><Label>Alamat Baris 2 (Opsional)</Label><Input value={localContactInfo?.address_line2 || ''} onChange={(e) => setLocalContactInfo(localContactInfo ? { ...localContactInfo, address_line2: e.target.value } : null)} placeholder="Masukkan alamat baris 2" className="mt-2" /></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Telepon</CardTitle><CardDescription>Nomor telepon sekolah</CardDescription></CardHeader>
            <CardContent><Input value={localContactInfo?.phone || ''} onChange={(e) => setLocalContactInfo(localContactInfo ? { ...localContactInfo, phone: e.target.value } : null)} placeholder="Masukkan nomor telepon" /></CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Email</CardTitle><CardDescription>Email kontak sekolah</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Email Utama</Label><Input type="email" value={localContactInfo?.email1 || ''} onChange={(e) => setLocalContactInfo(localContactInfo ? { ...localContactInfo, email1: e.target.value } : null)} placeholder="Masukkan email utama" className="mt-2" /></div>
              <div><Label>Email Sekunder (Opsional)</Label><Input type="email" value={localContactInfo?.email2 || ''} onChange={(e) => setLocalContactInfo(localContactInfo ? { ...localContactInfo, email2: e.target.value } : null)} placeholder="Masukkan email sekunder" className="mt-2" /></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Jam Operasional</CardTitle><CardDescription>Informasi jam operasional sekolah</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Jam Operasional</Label><Textarea value={localContactInfo?.operating_hours || ''} onChange={(e) => setLocalContactInfo(localContactInfo ? { ...localContactInfo, operating_hours: e.target.value } : null)} placeholder="Contoh: Senin - Jumat: 07:00 - 15:00" rows={3} className="mt-2" /></div>
              <div><Label>Keterangan Tambahan (Opsional)</Label><Input value={localContactInfo?.operating_hours_subtext || ''} onChange={(e) => setLocalContactInfo(localContactInfo ? { ...localContactInfo, operating_hours_subtext: e.target.value } : null)} placeholder="Keterangan tambahan" className="mt-2" /></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="flex justify-end">
          <Button onClick={() => localContactInfo && saveMutation.mutate(localContactInfo)} disabled={saveMutation.isPending} className="bg-slate-950 hover:bg-slate-800">
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
