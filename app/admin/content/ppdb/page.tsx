"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FilePlus2,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type RegistrationStatus = "baru" | "diverifikasi" | "diterima" | "ditolak";

interface PPDBSettings {
  id: string;
  google_form_url: string;
}

interface PPDBRegistration {
  id: string;
  registration_number: string;
  student_name: string;
  nickname: string | null;
  gender: string;
  birth_place: string | null;
  birth_date: string | null;
  religion: string | null;
  previous_school: string | null;
  desired_grade: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  address: string | null;
  status: RegistrationStatus;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

type RegistrationForm = Pick<
  PPDBRegistration,
  | "student_name"
  | "nickname"
  | "gender"
  | "birth_place"
  | "birth_date"
  | "religion"
  | "previous_school"
  | "desired_grade"
  | "parent_name"
  | "parent_phone"
  | "parent_email"
  | "address"
  | "status"
  | "notes"
>;

const statusLabels: Record<RegistrationStatus, string> = {
  baru: "Baru",
  diverifikasi: "Diverifikasi",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

const statusBadgeClass: Record<RegistrationStatus, string> = {
  baru: "border-sky-200 bg-sky-50 text-sky-700",
  diverifikasi: "border-amber-200 bg-amber-50 text-amber-700",
  diterima: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ditolak: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusColors: Record<RegistrationStatus, string> = {
  baru: "hsl(var(--chart-1))",
  diverifikasi: "hsl(var(--chart-4))",
  diterima: "hsl(var(--chart-2))",
  ditolak: "hsl(var(--chart-5))",
};

const monthlyChartConfig = {
  total: {
    label: "Pendaftar",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const statusChartConfig = {
  baru: { label: "Baru", color: statusColors.baru },
  diverifikasi: { label: "Diverifikasi", color: statusColors.diverifikasi },
  diterima: { label: "Diterima", color: statusColors.diterima },
  ditolak: { label: "Ditolak", color: statusColors.ditolak },
} satisfies ChartConfig;

const emptyRegistrationForm: RegistrationForm = {
  student_name: "",
  nickname: "",
  gender: "Laki-laki",
  birth_place: "",
  birth_date: "",
  religion: "Islam",
  previous_school: "",
  desired_grade: "Kelas 1",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  address: "",
  status: "baru",
  notes: "",
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const generateRegistrationNumber = () =>
  `PPDB-2026-${new Date().getTime().toString().slice(-6)}`;

export default function PPDBSettingsCMS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settingsForm, setSettingsForm] = useState({ google_form_url: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "semua">("semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [registrationForm, setRegistrationForm] =
    useState<RegistrationForm>(emptyRegistrationForm);
  const [deleteTarget, setDeleteTarget] = useState<PPDBRegistration | null>(null);

  const {
    data: settings,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError,
  } = useQuery({
    queryKey: ["ppdb_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ppdb_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as PPDBSettings | null;
    },
  });

  const {
    data: registrations = [],
    isLoading: isRegistrationsLoading,
    isError: isRegistrationsError,
    error: registrationsError,
  } = useQuery({
    queryKey: ["ppdb_registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ppdb_registrations")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data as PPDBRegistration[];
    },
  });

  useEffect(() => {
    setSettingsForm({ google_form_url: settings?.google_form_url || "" });
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        google_form_url: settingsForm.google_form_url.trim(),
        updated_at: new Date().toISOString(),
      };

      const query = settings
        ? supabase.from("ppdb_settings").update(payload).eq("id", settings.id)
        : supabase.from("ppdb_settings").insert([payload]);

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ppdb_settings"] });
      toast({
        title: "Berhasil",
        description: "URL Google Form PPDB berhasil disimpan.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const createRegistrationMutation = useMutation({
    mutationFn: async (payload: RegistrationForm) => {
      const { error } = await supabase.from("ppdb_registrations").insert([
        {
          ...payload,
          registration_number: generateRegistrationNumber(),
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ppdb_registrations"] });
      setDialogOpen(false);
      setRegistrationForm(emptyRegistrationForm);
      toast({
        title: "Pendaftar ditambahkan",
        description: "Data siswa baru masuk ke daftar PPDB 2026.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menambahkan data",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: RegistrationStatus;
    }) => {
      const { error } = await supabase
        .from("ppdb_registrations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ppdb_registrations"] });
      toast({
        title: "Status diperbarui",
        description: "Status pendaftar berhasil disimpan.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui status",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const deleteRegistrationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ppdb_registrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ppdb_registrations"] });
      setDeleteTarget(null);
      toast({
        title: "Data dihapus",
        description: "Pendaftar sudah dihapus dari daftar PPDB.",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus data",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const filteredRegistrations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return registrations.filter((item) => {
      const matchesStatus = statusFilter === "semua" || item.status === statusFilter;
      const searchable = [
        item.registration_number,
        item.student_name,
        item.parent_name,
        item.parent_phone,
        item.previous_school,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [registrations, searchTerm, statusFilter]);

  const statusSummary = useMemo(() => {
    return registrations.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { baru: 0, diverifikasi: 0, diterima: 0, ditolak: 0 } as Record<
        RegistrationStatus,
        number
      >
    );
  }, [registrations]);

  const monthlyChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const counts = months.map((month) => ({ month, total: 0 }));

    registrations.forEach((item) => {
      const date = new Date(item.submitted_at || item.created_at);
      if (date.getFullYear() === 2026) {
        counts[date.getMonth()].total += 1;
      }
    });

    return counts;
  }, [registrations]);

  const statusChartData = useMemo(
    () =>
      (Object.keys(statusLabels) as RegistrationStatus[]).map((status) => ({
        status,
        label: statusLabels[status],
        total: statusSummary[status],
        fill: statusColors[status],
      })),
    [statusSummary]
  );

  const completionRate = registrations.length
    ? Math.round((statusSummary.diterima / registrations.length) * 100)
    : 0;

  const submitRegistration = () => {
    if (!registrationForm.student_name.trim() || !registrationForm.parent_name.trim()) {
      toast({
        title: "Data belum lengkap",
        description: "Nama siswa dan nama orang tua/wali wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    createRegistrationMutation.mutate(registrationForm);
  };

  if (isSettingsLoading || isRegistrationsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline" className="w-fit">
            PPDB Tahun Ajaran 2026
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Formulir Penerimaan Peserta Didik Baru
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Pantau pendaftar, status verifikasi, dan kanal formulir PPDB dalam satu halaman admin.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {settingsForm.google_form_url && (
            <Button variant="outline" asChild>
              <a href={settingsForm.google_form_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Buka Form
              </a>
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Tambah Pendaftar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Data Siswa</DialogTitle>
                <DialogDescription>
                  Gunakan form ini untuk input manual data dari formulir PPDB 2026.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="student_name">Nama Lengkap Siswa</Label>
                  <Input
                    id="student_name"
                    value={registrationForm.student_name}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        student_name: event.target.value,
                      }))
                    }
                    placeholder="Nama sesuai akta"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nama Panggilan</Label>
                  <Input
                    id="nickname"
                    value={registrationForm.nickname || ""}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        nickname: event.target.value,
                      }))
                    }
                    placeholder="Opsional"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select
                    value={registrationForm.gender}
                    onValueChange={(value) =>
                      setRegistrationForm((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_date">Tanggal Lahir</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={registrationForm.birth_date || ""}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        birth_date: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth_place">Tempat Lahir</Label>
                  <Input
                    id="birth_place"
                    value={registrationForm.birth_place || ""}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        birth_place: event.target.value,
                      }))
                    }
                    placeholder="Kota kelahiran"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rencana Kelas</Label>
                  <Select
                    value={registrationForm.desired_grade}
                    onValueChange={(value) =>
                      setRegistrationForm((prev) => ({ ...prev, desired_grade: value }))
                    }
                  >
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previous_school">Asal Sekolah</Label>
                  <Input
                    id="previous_school"
                    value={registrationForm.previous_school || ""}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        previous_school: event.target.value,
                      }))
                    }
                    placeholder="TK/SD asal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="religion">Agama</Label>
                  <Input
                    id="religion"
                    value={registrationForm.religion || ""}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        religion: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_name">Nama Orang Tua/Wali</Label>
                  <Input
                    id="parent_name"
                    value={registrationForm.parent_name}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        parent_name: event.target.value,
                      }))
                    }
                    placeholder="Nama wali utama"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_phone">Nomor WhatsApp</Label>
                  <Input
                    id="parent_phone"
                    value={registrationForm.parent_phone}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        parent_phone: event.target.value,
                      }))
                    }
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="parent_email">Email Orang Tua/Wali</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={registrationForm.parent_email || ""}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        parent_email: event.target.value,
                      }))
                    }
                    placeholder="nama@email.com"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    rows={3}
                    value={registrationForm.address || ""}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        address: event.target.value,
                      }))
                    }
                    placeholder="Alamat domisili siswa"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={registrationForm.notes || ""}
                    onChange={(event) =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Catatan verifikasi atau kebutuhan khusus"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setRegistrationForm(emptyRegistrationForm);
                  }}
                >
                  Batal
                </Button>
                <Button
                  onClick={submitRegistration}
                  disabled={createRegistrationMutation.isPending}
                >
                  {createRegistrationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Simpan Pendaftar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(isSettingsError || isRegistrationsError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Data belum bisa dimuat</AlertTitle>
          <AlertDescription>
            {getErrorMessage(settingsError || registrationsError)}
            {isRegistrationsError
              ? " Jika tabel PPDB belum dibuat, jalankan migration ppdb_registrations terlebih dahulu."
              : ""}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          title="Total Pendaftar"
          value={registrations.length}
          description="Data formulir PPDB 2026"
        />
        <MetricCard
          icon={ShieldCheck}
          title="Diverifikasi"
          value={statusSummary.diverifikasi}
          description="Siap ditinjau lanjutan"
        />
        <MetricCard
          icon={CheckCircle2}
          title="Diterima"
          value={statusSummary.diterima}
          description={`${completionRate}% dari total pendaftar`}
        />
        <MetricCard
          icon={ClipboardList}
          title="Menunggu"
          value={statusSummary.baru}
          description="Perlu follow-up admin"
        />
      </div>

      <Tabs defaultValue="pendaftar" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3 lg:w-fit">
          <TabsTrigger value="pendaftar">Data Siswa</TabsTrigger>
          <TabsTrigger value="analitik">Analitik</TabsTrigger>
          <TabsTrigger value="pengaturan">Pengaturan Form</TabsTrigger>
        </TabsList>

        <TabsContent value="pendaftar" className="space-y-4">
          <Card>
            <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>List Data Siswa PPDB 2026</CardTitle>
                <CardDescription>
                  Data yang masuk dari formulir dan input manual admin.
                </CardDescription>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px] lg:w-[520px]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Cari nama, nomor, wali, atau asal sekolah"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as RegistrationStatus | "semua")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua">Semua Status</SelectItem>
                    <SelectItem value="baru">Baru</SelectItem>
                    <SelectItem value="diverifikasi">Diverifikasi</SelectItem>
                    <SelectItem value="diterima">Diterima</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRegistrations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Siswa</TableHead>
                      <TableHead className="min-w-[150px]">Wali</TableHead>
                      <TableHead className="min-w-[130px]">Asal/Kelas</TableHead>
                      <TableHead className="min-w-[150px]">Tanggal</TableHead>
                      <TableHead className="min-w-[170px]">Status</TableHead>
                      <TableHead className="w-[70px] text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.student_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.registration_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p>{item.parent_name}</p>
                            <p className="text-xs text-muted-foreground">{item.parent_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p>{item.desired_grade}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.previous_school || "Asal sekolah belum diisi"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(item.submitted_at || item.created_at)}</TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({
                                id: item.id,
                                status: value as RegistrationStatus,
                              })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baru">Baru</SelectItem>
                              <SelectItem value="diverifikasi">Diverifikasi</SelectItem>
                              <SelectItem value="diterima">Diterima</SelectItem>
                              <SelectItem value="ditolak">Ditolak</SelectItem>
                            </SelectContent>
                          </Select>
                          <Badge
                            variant="outline"
                            className={cn("mt-2", statusBadgeClass[item.status])}
                          >
                            {statusLabels[item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(item)}
                            aria-label={`Hapus data ${item.student_name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
                  <FilePlus2 className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Belum ada data siswa yang cocok.</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Data akan muncul ketika formulir PPDB 2026 mulai terisi atau admin menambahkan pendaftar manual.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analitik" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tren Pendaftar 2026
                </CardTitle>
                <CardDescription>
                  Pergerakan jumlah formulir yang masuk per bulan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={monthlyChartConfig}
                  className="h-[300px] w-full sm:h-[360px]"
                >
                  <BarChart data={monthlyChartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="total"
                      fill="var(--color-total)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationDuration={900}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Pendaftar</CardTitle>
                <CardDescription>
                  Komposisi proses seleksi dan verifikasi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={statusChartConfig} className="mx-auto h-[300px]">
                  <PieChart accessibilityLayer>
                    <ChartTooltip
                      content={<ChartTooltipContent nameKey="label" hideLabel />}
                    />
                    <Pie
                      data={statusChartData}
                      dataKey="total"
                      nameKey="label"
                      innerRadius={62}
                      outerRadius={98}
                      paddingAngle={3}
                      isAnimationActive
                      animationDuration={900}
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 grid gap-2">
                  {statusChartData.map((item) => (
                    <div key={item.status} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        {item.label}
                      </span>
                      <span className="font-medium">{item.total}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pengaturan">
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Pengaturan Kanal Formulir</CardTitle>
              <CardDescription>
                Simpan tautan Google Form atau formulir eksternal PPDB yang dipakai orang tua siswa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google_form_url">URL Google Form PPDB 2026</Label>
                <Input
                  id="google_form_url"
                  value={settingsForm.google_form_url}
                  onChange={(event) =>
                    setSettingsForm({ google_form_url: event.target.value })
                  }
                  placeholder="https://forms.gle/..."
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Catatan integrasi</AlertTitle>
                <AlertDescription>
                  List data siswa membaca tabel Supabase `ppdb_registrations`. Jika Google Form dipakai sebagai sumber utama, hubungkan response form ke tabel ini melalui automation atau import data.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSettingsMutation.mutate()}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Simpan Pengaturan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data pendaftar?</AlertDialogTitle>
            <AlertDialogDescription>
              Data {deleteTarget?.student_name} akan dihapus dari daftar PPDB 2026. Tindakan ini tidak bisa dibatalkan dari halaman admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteRegistrationMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRegistrationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
