'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  School,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

type PublicPPDBForm = {
  student_name: string;
  nickname: string;
  gender: string;
  birth_place: string;
  birth_date: string;
  religion: string;
  previous_school: string;
  desired_grade: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  address: string;
  notes: string;
  website: string;
};

const initialForm: PublicPPDBForm = {
  student_name: '',
  nickname: '',
  gender: 'Laki-laki',
  birth_place: '',
  birth_date: '',
  religion: 'Islam',
  previous_school: '',
  desired_grade: 'Kelas 1',
  parent_name: '',
  parent_phone: '',
  parent_email: '',
  address: '',
  notes: '',
  website: '',
};

const generateRegistrationNumber = () =>
  `PPDB-2026-${Date.now().toString().slice(-7)}`;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Pendaftaran belum bisa dikirim. Silakan coba lagi.';

export default function PublicPPDBPage() {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNumber, setSubmittedNumber] = useState('');

  const updateForm = (key: keyof PublicPPDBForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (form.website.trim()) return false;

    const requiredFields = [
      form.student_name,
      form.gender,
      form.birth_date,
      form.desired_grade,
      form.parent_name,
      form.parent_phone,
      form.address,
    ];

    return requiredFields.every((value) => value.trim().length > 0);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Data belum lengkap',
        description: 'Mohon lengkapi nama siswa, tanggal lahir, kelas, data wali, dan alamat.',
        variant: 'destructive',
      });
      return;
    }

    const registrationNumber = generateRegistrationNumber();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('ppdb_registrations').insert([
        {
          registration_number: registrationNumber,
          student_name: form.student_name.trim(),
          nickname: form.nickname.trim(),
          gender: form.gender,
          birth_place: form.birth_place.trim(),
          birth_date: form.birth_date,
          religion: form.religion.trim(),
          previous_school: form.previous_school.trim(),
          desired_grade: form.desired_grade,
          parent_name: form.parent_name.trim(),
          parent_phone: form.parent_phone.trim(),
          parent_email: form.parent_email.trim(),
          address: form.address.trim(),
          status: 'baru',
          notes: form.notes.trim(),
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setSubmittedNumber(registrationNumber);
      setForm(initialForm);
      toast({
        title: 'Pendaftaran terkirim',
        description: 'Data PPDB berhasil dikirim ke admin sekolah.',
      });
    } catch (error) {
      toast({
        title: 'Gagal mengirim pendaftaran',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedNumber) {
    return (
      <main className="min-h-screen bg-[#eefbff] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center">
          <Card className="w-full border-0 shadow-xl">
            <CardContent className="space-y-6 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <Badge variant="outline" className="mb-3 bg-white">
                  PPDB 2026
                </Badge>
                <h1 className="text-2xl font-bold sm:text-3xl">Pendaftaran berhasil dikirim</h1>
                <p className="mt-3 text-muted-foreground">
                  Nomor pendaftaran Anda adalah:
                </p>
                <p className="mt-2 rounded-lg bg-muted px-4 py-3 font-mono text-lg font-bold">
                  {submittedNumber}
                </p>
              </div>
              <Alert className="text-left">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Langkah berikutnya</AlertTitle>
                <AlertDescription>
                  Admin SDS Taman Harapan akan melakukan verifikasi dan menghubungi orang tua/wali melalui nomor WhatsApp yang didaftarkan.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={() => setSubmittedNumber('')}>
                  Daftar Siswa Lain
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eefbff] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-8">
        <section className="flex flex-col justify-between rounded-lg bg-cyan-500 p-6 text-white shadow-xl shadow-cyan-100">
          <div>
            <Badge className="bg-white text-cyan-700 hover:bg-white">PPDB 2026</Badge>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
              Formulir Penerimaan Peserta Didik Baru
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/90 sm:text-base">
              Daftarkan putra-putri Anda ke SDS Taman Harapan. Isi data dengan benar agar admin dapat memverifikasi pendaftaran lebih cepat.
            </p>
          </div>

          <div className="my-8 flex justify-center">
            <div className="relative h-36 w-36 rounded-full border-4 border-white bg-white p-4 shadow-2xl">
              <Image
                src="/logo_tamhar.png"
                alt="Logo SDS Taman Harapan"
                fill
                className="object-contain p-4"
                priority
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <InfoPill icon={School} title="Jenjang SD" description="Kelas 1 sampai 6" />
            <InfoPill icon={Sparkles} title="Respons Cepat" description="Admin cek data masuk" />
            <InfoPill icon={ShieldCheck} title="Data Aman" description="Hanya admin yang membaca" />
          </div>
        </section>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Data Calon Peserta Didik</CardTitle>
            <CardDescription>
              Field bertanda wajib perlu dilengkapi sebelum formulir dikirim.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => updateForm('website', event.target.value)}
                className="hidden"
                aria-hidden="true"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama Lengkap Siswa *" id="student_name">
                  <Input
                    id="student_name"
                    value={form.student_name}
                    onChange={(event) => updateForm('student_name', event.target.value)}
                    placeholder="Nama sesuai akta"
                    required
                  />
                </Field>
                <Field label="Nama Panggilan" id="nickname">
                  <Input
                    id="nickname"
                    value={form.nickname}
                    onChange={(event) => updateForm('nickname', event.target.value)}
                    placeholder="Opsional"
                  />
                </Field>
                <Field label="Jenis Kelamin *" id="gender">
                  <Select value={form.gender} onValueChange={(value) => updateForm('gender', value)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tanggal Lahir *" id="birth_date">
                  <Input
                    id="birth_date"
                    type="date"
                    value={form.birth_date}
                    onChange={(event) => updateForm('birth_date', event.target.value)}
                    required
                  />
                </Field>
                <Field label="Tempat Lahir" id="birth_place">
                  <Input
                    id="birth_place"
                    value={form.birth_place}
                    onChange={(event) => updateForm('birth_place', event.target.value)}
                    placeholder="Kota kelahiran"
                  />
                </Field>
                <Field label="Agama" id="religion">
                  <Input
                    id="religion"
                    value={form.religion}
                    onChange={(event) => updateForm('religion', event.target.value)}
                  />
                </Field>
                <Field label="Rencana Kelas *" id="desired_grade">
                  <Select
                    value={form.desired_grade}
                    onValueChange={(value) => updateForm('desired_grade', value)}
                  >
                    <SelectTrigger id="desired_grade">
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kelas 1">Kelas 1</SelectItem>
                      <SelectItem value="Kelas 2">Kelas 2</SelectItem>
                      <SelectItem value="Kelas 3">Kelas 3</SelectItem>
                      <SelectItem value="Kelas 4">Kelas 4</SelectItem>
                      <SelectItem value="Kelas 5">Kelas 5</SelectItem>
                      <SelectItem value="Kelas 6">Kelas 6</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Asal Sekolah" id="previous_school">
                  <Input
                    id="previous_school"
                    value={form.previous_school}
                    onChange={(event) => updateForm('previous_school', event.target.value)}
                    placeholder="TK/SD asal"
                  />
                </Field>
                <Field label="Nama Orang Tua/Wali *" id="parent_name">
                  <Input
                    id="parent_name"
                    value={form.parent_name}
                    onChange={(event) => updateForm('parent_name', event.target.value)}
                    required
                  />
                </Field>
                <Field label="Nomor WhatsApp *" id="parent_phone">
                  <Input
                    id="parent_phone"
                    value={form.parent_phone}
                    onChange={(event) => updateForm('parent_phone', event.target.value)}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </Field>
                <Field label="Email Orang Tua/Wali" id="parent_email" className="sm:col-span-2">
                  <Input
                    id="parent_email"
                    type="email"
                    value={form.parent_email}
                    onChange={(event) => updateForm('parent_email', event.target.value)}
                    placeholder="nama@email.com"
                  />
                </Field>
                <Field label="Alamat Domisili *" id="address" className="sm:col-span-2">
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(event) => updateForm('address', event.target.value)}
                    rows={3}
                    required
                  />
                </Field>
                <Field label="Catatan Tambahan" id="notes" className="sm:col-span-2">
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(event) => updateForm('notes', event.target.value)}
                    rows={3}
                    placeholder="Kebutuhan khusus, pertanyaan, atau catatan untuk admin"
                  />
                </Field>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Pastikan nomor WhatsApp aktif</AlertTitle>
                <AlertDescription>
                  Informasi verifikasi dan tindak lanjut pendaftaran akan dikirim melalui nomor yang dicantumkan.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Kirim Pendaftaran
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Field({
  label,
  id,
  children,
  className,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function InfoPill({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg bg-white/15 p-4 backdrop-blur">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-cyan-700">
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-white/80">{description}</p>
    </div>
  );
}
