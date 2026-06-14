"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  GraduationCap,
  ImageIcon,
  Loader2,
  Save,
  Target,
  FileText,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from "@/components/ui/animated";

interface SchoolProfile {
  id: string;
  school_name: string;
  npsn: string;
  address: string;
  phone: string;
  email: string;
  accreditation: string;
  vision: string;
  mission: string;
  logo_url: string;
  report_header: string;
  report_footer: string;
  headmaster_name: string;
  headmaster_nip: string;
  created_at: string;
  updated_at: string;
}

type ProfileForm = Omit<SchoolProfile, 'id' | 'created_at' | 'updated_at'>;

const EMPTY_FORM: ProfileForm = {
  school_name: '',
  npsn: '',
  address: '',
  phone: '',
  email: '',
  accreditation: '',
  vision: '',
  mission: '',
  logo_url: '',
  report_header: '',
  report_footer: '',
  headmaster_name: '',
  headmaster_nip: '',
};

export default function SchoolProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['school-profile'],
    queryFn: async () => {
      const res = await fetch('/api/school-profile');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as SchoolProfile | null;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        school_name: profile.school_name || '',
        npsn: profile.npsn || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        accreditation: profile.accreditation || '',
        vision: profile.vision || '',
        mission: profile.mission || '',
        logo_url: profile.logo_url || '',
        report_header: profile.report_header || '',
        report_footer: profile.report_footer || '',
        headmaster_name: profile.headmaster_name || '',
        headmaster_nip: profile.headmaster_nip || '',
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/school-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-profile'] });
      toast({ title: 'Profil sekolah berhasil disimpan' });
    },
    onError: (e: Error) => toast({ title: 'Gagal menyimpan', description: e.message, variant: 'destructive' }),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Ukuran file maksimal 2MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `school-logo-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('images').upload(`settings/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`settings/${fileName}`);
      setForm(f => ({ ...f, logo_url: publicUrl }));
      toast({ title: 'Logo berhasil diunggah' });
    } catch (error: unknown) {
      toast({ title: 'Gagal mengunggah logo', description: error instanceof Error ? error.message : 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const set = (key: keyof ProfileForm, value: string) => setForm(f => ({ ...f, [key]: value }));

  const isLoadingPage = isLoading;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-4xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div className="flex items-start gap-3">
            <Button asChild variant="outline" size="icon" className="mt-1 bg-white">
              <Link href="/admin/users"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Profil Sekolah</h1>
              <p className="mt-2 text-sm text-slate-500">Kelola identitas dan informasi sekolah yang tampil di rapor dan website.</p>
            </div>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoadingPage}
            className="bg-slate-950 hover:bg-slate-800"
          >
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Profil
          </Button>
        </motion.div>

        {isLoadingPage ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* Section: School Identity */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Identitas Sekolah
                  </CardTitle>
                  <CardDescription>Informasi dasar sekolah yang digunakan di seluruh sistem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nama Sekolah <span className="text-red-500">*</span></Label>
                      <Input value={form.school_name} onChange={e => set('school_name', e.target.value)} placeholder="SDS Taman Harapan" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">NPSN</Label>
                      <Input value={form.npsn} onChange={e => set('npsn', e.target.value)} placeholder="12345678" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Alamat</Label>
                    <Textarea value={form.address} onChange={e => set('address', e.target.value)} placeholder="Jl. Contoh No. 123, Kota..." className="h-20 resize-none" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Telepon</Label>
                      <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="021-1234567" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@sdstamanharapan.sch.id" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Akreditasi</Label>
                      <Input value={form.accreditation} onChange={e => set('accreditation', e.target.value)} placeholder="A" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section: Headmaster */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-5 w-5 text-violet-600" />
                    Kepala Sekolah
                  </CardTitle>
                  <CardDescription>Data kepala sekolah yang ditampilkan di rapor dan surat resmi.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nama Kepala Sekolah</Label>
                      <Input value={form.headmaster_name} onChange={e => set('headmaster_name', e.target.value)} placeholder="Nama lengkap" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">NIP</Label>
                      <Input value={form.headmaster_nip} onChange={e => set('headmaster_nip', e.target.value)} placeholder="197001012000011001" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section: Vision & Mission */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5 text-emerald-600" />
                    Visi & Misi
                  </CardTitle>
                  <CardDescription>Visi dan misi sekolah untuk ditampilkan di website dan dokumen resmi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Visi</Label>
                    <Textarea value={form.vision} onChange={e => set('vision', e.target.value)} placeholder="Menjadi sekolah yang unggul dalam prestasi dan berkarakter..." className="h-24 resize-none" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Misi</Label>
                    <Textarea value={form.mission} onChange={e => set('mission', e.target.value)} placeholder="1. Menyelenggarakan pendidikan berkualitas&#10;2. Mengembangkan potensi siswa secara optimal&#10;3. Membentuk karakter yang berakhlak mulia" className="h-32 resize-none" />
                    <p className="text-xs text-slate-400">Gunakan Enter untuk memisahkan setiap poin misi.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section: Logo */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ImageIcon className="h-5 w-5 text-amber-600" />
                    Logo Sekolah
                  </CardTitle>
                  <CardDescription>Logo yang ditampilkan di rapor, website, dan dokumen resmi. Format: PNG/JPG, maks 2MB.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-6">
                    {form.logo_url ? (
                      <div className="shrink-0">
                        <div className="h-24 w-24 rounded-xl border border-slate-200 bg-white p-2 shadow-sm flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={form.logo_url} alt="Logo Sekolah" className="h-full w-full object-contain" />
                        </div>
                      </div>
                    ) : (
                      <div className="shrink-0 h-24 w-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                    <div className="space-y-3 flex-1">
                      <div>
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                            {uploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            {uploading ? 'Mengunggah...' : 'Pilih File Logo'}
                          </div>
                        </Label>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploading}
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        Rekomendasi: gambar persegi (1:1) dengan resolusi minimal 200x200px dan latar belakang transparan.
                      </p>
                      {form.logo_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => set('logo_url', '')}
                        >
                          Hapus Logo
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section: Report Settings */}
            <motion.div variants={fadeInUp}>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-cyan-600" />
                    Pengaturan Raport
                  </CardTitle>
                  <CardDescription>Teks header dan footer yang ditampilkan di setiap halaman rapor PDF.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Header Raport</Label>
                    <Input value={form.report_header} onChange={e => set('report_header', e.target.value)} placeholder="YAYASAN PENDIDIKAN TAMAN HARAPAN" />
                    <p className="text-xs text-slate-400">Teks yang muncul di bagian atas setiap halaman rapor.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Footer Raport</Label>
                    <Input value={form.report_footer} onChange={e => set('report_footer', e.target.value)} placeholder="Kepala Sekolah" />
                    <p className="text-xs text-slate-400">Teks yang muncul di bagian bawah setiap halaman rapor.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Last Updated Info */}
            {profile?.updated_at && (
              <motion.div variants={fadeInUp} className="text-center">
                <p className="text-xs text-slate-400">
                  Terakhir diperbarui: {new Date(profile.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
