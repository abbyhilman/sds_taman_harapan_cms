"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  Database,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
  order_position: number;
  created_at: string;
  updated_at: string | null;
}

interface Extracurricular {
  id: string;
  name: string;
  description: string | null;
  order_position: number;
  created_at: string;
  updated_at: string | null;
}

type DeleteTarget =
  | { type: "academic_years"; id: string; label: string }
  | { type: "subjects"; id: string; label: string }
  | { type: "extracurriculars"; id: string; label: string };

const emptyAcademicYear = {
  year_name: "",
  start_date: "",
  end_date: "",
  is_active: false,
};

const emptySubject = {
  name: "",
  code: "",
  category: "Wajib",
  order_position: "0",
};

const emptyExtracurricular = {
  name: "",
  description: "",
  order_position: "0",
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";

export default function MasterDataPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [academicYearDialog, setAcademicYearDialog] = useState(false);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [extracurricularDialog, setExtracurricularDialog] = useState(false);
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingExtracurricular, setEditingExtracurricular] = useState<Extracurricular | null>(null);
  const [academicYearForm, setAcademicYearForm] = useState(emptyAcademicYear);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [extracurricularForm, setExtracurricularForm] = useState(emptyExtracurricular);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const academicYearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as AcademicYear[];
    },
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("order_position", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Subject[];
    },
  });

  const extracurricularsQuery = useQuery({
    queryKey: ["extracurriculars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extracurriculars")
        .select("*")
        .order("order_position", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Extracurricular[];
    },
  });

  const resetAcademicYearDialog = () => {
    setEditingAcademicYear(null);
    setAcademicYearForm(emptyAcademicYear);
    setAcademicYearDialog(false);
  };

  const resetSubjectDialog = () => {
    setEditingSubject(null);
    setSubjectForm(emptySubject);
    setSubjectDialog(false);
  };

  const resetExtracurricularDialog = () => {
    setEditingExtracurricular(null);
    setExtracurricularForm(emptyExtracurricular);
    setExtracurricularDialog(false);
  };

  const saveAcademicYear = useMutation({
    mutationFn: async () => {
      if (!academicYearForm.year_name.trim() || !academicYearForm.start_date || !academicYearForm.end_date) {
        throw new Error("Nama tahun ajaran, tanggal mulai, dan tanggal selesai wajib diisi.");
      }

      if (academicYearForm.is_active) {
        const { error } = await supabase
          .from("academic_years")
          .update({ is_active: false })
          .neq("id", editingAcademicYear?.id ?? "00000000-0000-0000-0000-000000000000");
        if (error) throw error;
      }

      const payload = {
        year_name: academicYearForm.year_name.trim(),
        start_date: academicYearForm.start_date,
        end_date: academicYearForm.end_date,
        is_active: academicYearForm.is_active,
      };

      if (editingAcademicYear) {
        const { error } = await supabase
          .from("academic_years")
          .update(payload)
          .eq("id", editingAcademicYear.id);
        if (error) throw error;
        return "updated";
      }

      const { error } = await supabase.from("academic_years").insert([payload]);
      if (error) throw error;
      return "created";
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast({
        title: "Tahun ajaran tersimpan",
        description: "Data tahun ajaran sudah diperbarui.",
      });
      resetAcademicYearDialog();
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan tahun ajaran",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const saveSubject = useMutation({
    mutationFn: async () => {
      if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
        throw new Error("Nama mata pelajaran dan kode wajib diisi.");
      }

      const payload = {
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim().toUpperCase(),
        category: subjectForm.category,
        order_position: Number(subjectForm.order_position) || 0,
      };

      if (editingSubject) {
        const { error } = await supabase
          .from("subjects")
          .update(payload)
          .eq("id", editingSubject.id);
        if (error) throw error;
        return "updated";
      }

      const { error } = await supabase.from("subjects").insert([payload]);
      if (error) throw error;
      return "created";
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast({
        title: "Mata pelajaran tersimpan",
        description: "Data mata pelajaran sudah diperbarui.",
      });
      resetSubjectDialog();
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan mata pelajaran",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const saveExtracurricular = useMutation({
    mutationFn: async () => {
      if (!extracurricularForm.name.trim()) {
        throw new Error("Nama ekstrakurikuler wajib diisi.");
      }

      const payload = {
        name: extracurricularForm.name.trim(),
        description: extracurricularForm.description.trim(),
        order_position: Number(extracurricularForm.order_position) || 0,
      };

      if (editingExtracurricular) {
        const { error } = await supabase
          .from("extracurriculars")
          .update(payload)
          .eq("id", editingExtracurricular.id);
        if (error) throw error;
        return "updated";
      }

      const { error } = await supabase.from("extracurriculars").insert([payload]);
      if (error) throw error;
      return "created";
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extracurriculars"] });
      toast({
        title: "Ekstrakurikuler tersimpan",
        description: "Data ekstrakurikuler sudah diperbarui.",
      });
      resetExtracurricularDialog();
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan ekstrakurikuler",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      const { error } = await supabase.from(target.type).delete().eq("id", target.id);
      if (error) throw error;
      return target.type;
    },
    onSuccess: (type) => {
      const queryKeyMap = {
        academic_years: "academic-years",
        subjects: "subjects",
        extracurriculars: "extracurriculars",
      };
      queryClient.invalidateQueries({ queryKey: [queryKeyMap[type]] });
      toast({
        title: "Data dihapus",
        description: "Master data berhasil dihapus.",
      });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus data",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-sm font-medium text-cyan-700">Akademik</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Master Data Akademik
        </h1>
        <p className="mt-2 text-muted-foreground">
          Kelola tahun ajaran, mata pelajaran, dan ekstrakurikuler yang dipakai
          pada modul raport digital.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Tahun Ajaran"
          value={academicYearsQuery.data?.length ?? 0}
          icon={CalendarDays}
        />
        <SummaryCard
          title="Mata Pelajaran"
          value={subjectsQuery.data?.length ?? 0}
          icon={Database}
        />
        <SummaryCard
          title="Ekstrakurikuler"
          value={extracurricularsQuery.data?.length ?? 0}
          icon={Sparkles}
        />
      </div>

      <Tabs defaultValue="academic-years" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[560px]">
          <TabsTrigger value="academic-years">Tahun Ajaran</TabsTrigger>
          <TabsTrigger value="subjects">Mata Pelajaran</TabsTrigger>
          <TabsTrigger value="extracurriculars">Ekskul</TabsTrigger>
        </TabsList>

        <TabsContent value="academic-years">
          <Card>
            <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Tahun Ajaran</CardTitle>
                <CardDescription>
                  Hanya satu tahun ajaran yang dapat ditandai aktif.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingAcademicYear(null);
                  setAcademicYearForm(emptyAcademicYear);
                  setAcademicYearDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Tahun
              </Button>
            </CardHeader>
            <CardContent>
              <DataError error={academicYearsQuery.error} />
              <div className="rounded-lg border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academicYearsQuery.isLoading ? (
                      <LoadingRow colSpan={4} />
                    ) : academicYearsQuery.data?.length ? (
                      academicYearsQuery.data.map((year) => (
                        <TableRow key={year.id}>
                          <TableCell className="font-semibold">{year.year_name}</TableCell>
                          <TableCell>
                            {year.start_date} sampai {year.end_date}
                          </TableCell>
                          <TableCell>
                            {year.is_active ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="outline">Nonaktif</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <RowActions
                              onEdit={() => {
                                setEditingAcademicYear(year);
                                setAcademicYearForm({
                                  year_name: year.year_name,
                                  start_date: year.start_date,
                                  end_date: year.end_date,
                                  is_active: year.is_active,
                                });
                                setAcademicYearDialog(true);
                              }}
                              onDelete={() =>
                                setDeleteTarget({
                                  type: "academic_years",
                                  id: year.id,
                                  label: year.year_name,
                                })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow colSpan={4} label="Belum ada tahun ajaran." />
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Mata Pelajaran</CardTitle>
                <CardDescription>
                  Daftar mapel akan dipakai saat input nilai raport.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectForm(emptySubject);
                  setSubjectDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Mapel
              </Button>
            </CardHeader>
            <CardContent>
              <DataError error={subjectsQuery.error} />
              <div className="rounded-lg border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Urutan</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectsQuery.isLoading ? (
                      <LoadingRow colSpan={5} />
                    ) : subjectsQuery.data?.length ? (
                      subjectsQuery.data.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>{subject.order_position}</TableCell>
                          <TableCell className="font-mono text-xs">{subject.code}</TableCell>
                          <TableCell className="font-semibold">{subject.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{subject.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <RowActions
                              onEdit={() => {
                                setEditingSubject(subject);
                                setSubjectForm({
                                  name: subject.name,
                                  code: subject.code,
                                  category: subject.category,
                                  order_position: String(subject.order_position ?? 0),
                                });
                                setSubjectDialog(true);
                              }}
                              onDelete={() =>
                                setDeleteTarget({
                                  type: "subjects",
                                  id: subject.id,
                                  label: subject.name,
                                })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow colSpan={5} label="Belum ada mata pelajaran." />
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extracurriculars">
          <Card>
            <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Ekstrakurikuler</CardTitle>
                <CardDescription>
                  Data ekskul dapat dicatat ke raport siswa.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setEditingExtracurricular(null);
                  setExtracurricularForm(emptyExtracurricular);
                  setExtracurricularDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Ekskul
              </Button>
            </CardHeader>
            <CardContent>
              <DataError error={extracurricularsQuery.error} />
              <div className="rounded-lg border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Urutan</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extracurricularsQuery.isLoading ? (
                      <LoadingRow colSpan={4} />
                    ) : extracurricularsQuery.data?.length ? (
                      extracurricularsQuery.data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.order_position}</TableCell>
                          <TableCell className="font-semibold">{item.name}</TableCell>
                          <TableCell className="max-w-lg text-muted-foreground">
                            {item.description || "-"}
                          </TableCell>
                          <TableCell>
                            <RowActions
                              onEdit={() => {
                                setEditingExtracurricular(item);
                                setExtracurricularForm({
                                  name: item.name,
                                  description: item.description ?? "",
                                  order_position: String(item.order_position ?? 0),
                                });
                                setExtracurricularDialog(true);
                              }}
                              onDelete={() =>
                                setDeleteTarget({
                                  type: "extracurriculars",
                                  id: item.id,
                                  label: item.name,
                                })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow colSpan={4} label="Belum ada ekstrakurikuler." />
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={academicYearDialog} onOpenChange={setAcademicYearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAcademicYear ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}</DialogTitle>
            <DialogDescription>
              Tahun ajaran aktif akan menjadi default di modul raport.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nama Tahun Ajaran *" id="year_name">
              <Input
                id="year_name"
                placeholder="2026/2027"
                value={academicYearForm.year_name}
                onChange={(event) =>
                  setAcademicYearForm((prev) => ({ ...prev, year_name: event.target.value }))
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal Mulai *" id="start_date">
                <Input
                  id="start_date"
                  type="date"
                  value={academicYearForm.start_date}
                  onChange={(event) =>
                    setAcademicYearForm((prev) => ({ ...prev, start_date: event.target.value }))
                  }
                />
              </Field>
              <Field label="Tanggal Selesai *" id="end_date">
                <Input
                  id="end_date"
                  type="date"
                  value={academicYearForm.end_date}
                  onChange={(event) =>
                    setAcademicYearForm((prev) => ({ ...prev, end_date: event.target.value }))
                  }
                />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Jadikan aktif</p>
                <p className="text-sm text-muted-foreground">
                  Tahun ajaran aktif lain akan otomatis dinonaktifkan.
                </p>
              </div>
              <Switch
                checked={academicYearForm.is_active}
                onCheckedChange={(checked) =>
                  setAcademicYearForm((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetAcademicYearDialog}>
              Batal
            </Button>
            <Button onClick={() => saveAcademicYear.mutate()} disabled={saveAcademicYear.isPending}>
              {saveAcademicYear.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}</DialogTitle>
            <DialogDescription>
              Atur kode, kategori, dan urutan tampilan pada raport.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nama Mata Pelajaran *" id="subject_name">
              <Input
                id="subject_name"
                value={subjectForm.name}
                onChange={(event) => setSubjectForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kode *" id="subject_code">
                <Input
                  id="subject_code"
                  value={subjectForm.code}
                  onChange={(event) => setSubjectForm((prev) => ({ ...prev, code: event.target.value }))}
                />
              </Field>
              <Field label="Urutan" id="subject_order">
                <Input
                  id="subject_order"
                  type="number"
                  value={subjectForm.order_position}
                  onChange={(event) =>
                    setSubjectForm((prev) => ({ ...prev, order_position: event.target.value }))
                  }
                />
              </Field>
            </div>
            <Field label="Kategori" id="subject_category">
              <Select
                value={subjectForm.category}
                onValueChange={(value) => setSubjectForm((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="subject_category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wajib">Wajib</SelectItem>
                  <SelectItem value="Muatan Lokal">Muatan Lokal</SelectItem>
                  <SelectItem value="Pengembangan Diri">Pengembangan Diri</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetSubjectDialog}>
              Batal
            </Button>
            <Button onClick={() => saveSubject.mutate()} disabled={saveSubject.isPending}>
              {saveSubject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={extracurricularDialog} onOpenChange={setExtracurricularDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExtracurricular ? "Edit Ekstrakurikuler" : "Tambah Ekstrakurikuler"}
            </DialogTitle>
            <DialogDescription>
              Data ini akan tersedia saat input nilai ekstrakurikuler raport.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nama Ekstrakurikuler *" id="extracurricular_name">
              <Input
                id="extracurricular_name"
                value={extracurricularForm.name}
                onChange={(event) =>
                  setExtracurricularForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Urutan" id="extracurricular_order">
              <Input
                id="extracurricular_order"
                type="number"
                value={extracurricularForm.order_position}
                onChange={(event) =>
                  setExtracurricularForm((prev) => ({
                    ...prev,
                    order_position: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Deskripsi" id="extracurricular_description">
              <Textarea
                id="extracurricular_description"
                rows={3}
                value={extracurricularForm.description}
                onChange={(event) =>
                  setExtracurricularForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetExtracurricularDialog}>
              Batal
            </Button>
            <Button onClick={() => saveExtracurricular.mutate()} disabled={saveExtracurricular.isPending}>
              {saveExtracurricular.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus master data?</AlertDialogTitle>
            <AlertDialogDescription>
              Data &quot;{deleteTarget?.label}&quot; akan dihapus. Jika data sudah dipakai di raport,
              database dapat menolak penghapusan untuk menjaga relasi data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-28 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-cyan-600" />
        <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
      </TableCell>
    </TableRow>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-28 text-center text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

function DataError({ error }: { error: unknown }) {
  if (!error) return null;

  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4" />
        <p>{getErrorMessage(error)}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
