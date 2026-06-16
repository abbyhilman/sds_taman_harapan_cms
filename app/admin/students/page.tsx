"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, FileDown, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, UserRoundCheck, Users } from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { staggerContainer, staggerItem, fadeInDown } from "@/components/ui/animated";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

type Gender = "Laki-laki" | "Perempuan";
type StudentStatus = "active" | "inactive" | "graduated" | "transferred";

interface Student {
  id: string;
  nisn: string;
  full_name: string;
  nickname: string | null;
  gender: Gender;
  birth_place: string | null;
  birth_date: string | null;
  religion: string | null;
  address: string | null;
  current_class: string;
  classroom_id: string | null;
  avatar_url: string | null;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  status: StudentStatus;
  enrollment_date: string | null;
  notes: string | null;
  ppdb_registration_id: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

interface PPDBRegistration {
  id: string;
  registration_number: string;
  student_name: string;
  nickname: string | null;
  gender: Gender;
  birth_place: string | null;
  birth_date: string | null;
  religion: string | null;
  desired_grade: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  address: string | null;
  status: string;
}

type StudentForm = {
  nisn: string;
  full_name: string;
  nickname: string;
  gender: Gender;
  birth_place: string;
  birth_date: string;
  religion: string;
  address: string;
  current_class: string;
  classroom_id: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  status: StudentStatus;
  notes: string;
};

type ImportForm = {
  registrationId: string;
  nisn: string;
  currentClass: string;
  classroomId: string;
};

const classOptions = ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"];
const religionOptions = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const pageSize = 20;

const emptyStudentForm: StudentForm = {
  nisn: "",
  full_name: "",
  nickname: "",
  gender: "Laki-laki",
  birth_place: "",
  birth_date: "",
  religion: "Islam",
  address: "",
  current_class: "Kelas 1",
  classroom_id: "",
  parent_name: "",
  parent_phone: "",
  parent_email: "",
  status: "active",
  notes: "",
};

const statusLabels: Record<StudentStatus, string> = {
  active: "Aktif",
  inactive: "Tidak Aktif",
  graduated: "Lulus",
  transferred: "Pindah",
};

const statusBadgeClass: Record<StudentStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-slate-200 bg-slate-50 text-slate-600",
  graduated: "border-blue-200 bg-blue-50 text-blue-700",
  transferred: "border-amber-200 bg-amber-50 text-amber-700",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "S";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";

const mapStudentToForm = (student: Student): StudentForm => ({
  nisn: student.nisn,
  full_name: student.full_name,
  nickname: student.nickname ?? "",
  gender: student.gender,
  birth_place: student.birth_place ?? "",
  birth_date: student.birth_date ?? "",
  religion: student.religion ?? "Islam",
  address: student.address ?? "",
  current_class: student.current_class,
  classroom_id: student.classroom_id ?? "",
  parent_name: student.parent_name,
  parent_phone: student.parent_phone,
  parent_email: student.parent_email ?? "",
  status: student.status,
  notes: student.notes ?? "",
});

const sanitizeSearch = (value: string) => value.trim().replace(/[%,]/g, "");

export default function StudentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [classFilter, setClassFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyStudentForm);
  const [importForm, setImportForm] = useState<ImportForm>({
    registrationId: "",
    nisn: "",
    currentClass: "Kelas 1",
    classroomId: "",
  });

  const studentsQuery = useQuery({
    queryKey: ["students", classFilter, search, page],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from("students")
        .select("*", { count: "exact" })
        .is("deleted_at", null)
        .order("current_class", { ascending: true })
        .order("full_name", { ascending: true })
        .range(from, to);

      if (classFilter !== "all") {
        query = query.eq("current_class", classFilter);
      }

      const keyword = sanitizeSearch(search);
      if (keyword) {
        query = query.or(`full_name.ilike.%${keyword}%,nisn.ilike.%${keyword}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { students: (data ?? []) as Student[], count: count ?? 0 };
    },
  });

  const overviewQuery = useQuery({
    queryKey: ["students-overview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, gender, current_class, status")
        .is("deleted_at", null);

      if (error) throw error;
      return (data ?? []) as Pick<Student, "id" | "gender" | "current_class" | "status">[];
    },
  });

  const ppdbQuery = useQuery({
    queryKey: ["ppdb-import-candidates"],
    enabled: isImportDialogOpen,
    queryFn: async () => {
      const [{ data: registrations, error: registrationsError }, { data: students, error: studentsError }] =
        await Promise.all([
          supabase
            .from("ppdb_registrations")
            .select("id, registration_number, student_name, nickname, gender, birth_place, birth_date, religion, desired_grade, parent_name, parent_phone, parent_email, address, status")
            .eq("status", "diterima")
            .order("student_name", { ascending: true }),
          supabase
            .from("students")
            .select("ppdb_registration_id")
            .not("ppdb_registration_id", "is", null)
            .is("deleted_at", null),
        ]);

      if (registrationsError) throw registrationsError;
      if (studentsError) throw studentsError;

      const importedIds = new Set(
        (students ?? [])
          .map((student) => student.ppdb_registration_id as string | null)
          .filter(Boolean)
      );

      return ((registrations ?? []) as PPDBRegistration[]).filter(
        (registration) => !importedIds.has(registration.id)
      );
    },
  });

  const classroomsQuery = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classrooms")
        .select("id, grade_level, section, display_name, is_active")
        .eq("is_active", true)
        .order("grade_level", { ascending: true })
        .order("section", { ascending: true });

      if (error) throw error;
      return (data ?? []) as { id: string; grade_level: number; section: string | null; display_name: string; is_active: boolean }[];
    },
  });

  const overview = useMemo(() => {
    const students = overviewQuery.data ?? [];
    return {
      total: students.length,
      active: students.filter((student) => student.status === "active").length,
      male: students.filter((student) => student.gender === "Laki-laki").length,
      female: students.filter((student) => student.gender === "Perempuan").length,
    };
  }, [overviewQuery.data]);

  const totalPages = Math.max(1, Math.ceil((studentsQuery.data?.count ?? 0) / pageSize));

  const resetStudentDialog = () => {
    setEditingStudent(null);
    setForm(emptyStudentForm);
    setIsStudentDialogOpen(false);
  };

  const openCreateDialog = () => {
    setEditingStudent(null);
    const matchedRoom = classroomsQuery.data?.find((c) => c.display_name === classFilter);
    setForm({
      ...emptyStudentForm,
      current_class: classFilter === "all" ? "Kelas 1" : classFilter,
      classroom_id: matchedRoom?.id || "",
    });
    setIsStudentDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setForm(mapStudentToForm(student));
    setIsStudentDialogOpen(true);
  };

  const updateForm = (key: keyof StudentForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateStudentForm = () => {
    const requiredFields = [
      form.nisn,
      form.full_name,
      form.gender,
      form.birth_date,
      form.current_class,
      form.parent_name,
      form.parent_phone,
    ];
    return requiredFields.every((value) => value.trim().length > 0);
  };

  const saveStudentMutation = useMutation({
    mutationFn: async () => {
      if (!validateStudentForm()) {
        throw new Error("Lengkapi NISN, nama siswa, tanggal lahir, kelas, dan data orang tua.");
      }

      const selectedClassroom = classroomsQuery.data?.find((c) => c.id === form.classroom_id);
      const currentClass = selectedClassroom?.display_name || form.current_class;

      const payload = {
        nisn: form.nisn.trim(),
        full_name: form.full_name.trim(),
        nickname: form.nickname.trim(),
        gender: form.gender,
        birth_place: form.birth_place.trim(),
        birth_date: form.birth_date,
        religion: form.religion.trim(),
        address: form.address.trim(),
        current_class: currentClass,
        classroom_id: form.classroom_id || null,
        parent_name: form.parent_name.trim(),
        parent_phone: form.parent_phone.trim(),
        parent_email: form.parent_email.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };

      if (editingStudent) {
        const { error } = await supabase
          .from("students")
          .update({ ...payload, nisn: editingStudent.nisn })
          .eq("id", editingStudent.id);
        if (error) throw error;
        return "updated";
      }

      const { error } = await supabase.from("students").insert([payload]);
      if (error) throw error;
      return "created";
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students-overview"] });
      toast({
        title: result === "created" ? "Siswa ditambahkan" : "Data siswa diperbarui",
        description: "Perubahan data siswa sudah tersimpan.",
      });
      resetStudentDialog();
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan data siswa",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (student: Student) => {
      const { error } = await supabase
        .from("students")
        .update({
          deleted_at: new Date().toISOString(),
          status: "inactive",
          notes: student.notes
            ? `${student.notes}\nSoft deleted from admin student management.`
            : "Soft deleted from admin student management.",
        })
        .eq("id", student.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students-overview"] });
      toast({
        title: "Siswa dihapus",
        description: "Data siswa disembunyikan dari daftar aktif.",
      });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus siswa",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const importStudentMutation = useMutation({
    mutationFn: async () => {
      const registration = ppdbQuery.data?.find((item) => item.id === importForm.registrationId);
      if (!registration) throw new Error("Pilih data PPDB yang akan diimport.");
      if (!importForm.nisn.trim()) throw new Error("NISN wajib diisi sebelum import.");

      const { error } = await supabase.from("students").insert([
        {
          nisn: importForm.nisn.trim(),
          full_name: registration.student_name,
          nickname: registration.nickname ?? "",
          gender: registration.gender,
          birth_place: registration.birth_place ?? "",
          birth_date: registration.birth_date,
          religion: registration.religion ?? "Islam",
          address: registration.address ?? "",
          current_class: importForm.currentClass,
          classroom_id: importForm.classroomId || null,
          parent_name: registration.parent_name,
          parent_phone: registration.parent_phone,
          parent_email: registration.parent_email ?? "",
          status: "active",
          ppdb_registration_id: registration.id,
          notes: `Imported from PPDB ${registration.registration_number}`,
        },
      ]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students-overview"] });
      queryClient.invalidateQueries({ queryKey: ["ppdb-import-candidates"] });
      toast({
        title: "Import PPDB berhasil",
        description: "Data calon siswa sudah masuk ke daftar siswa aktif.",
      });
      setImportForm({ registrationId: "", nisn: "", currentClass: "Kelas 1", classroomId: "" });
      setIsImportDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Gagal import dari PPDB",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const selectedRegistration = ppdbQuery.data?.find(
    (registration) => registration.id === importForm.registrationId
  );

  const isInitialLoading = studentsQuery.isLoading && overviewQuery.isLoading;

  if (isInitialLoading) {
    return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat data siswa..." /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" variants={fadeInDown}>
          <div>
            <p className="text-sm font-medium text-cyan-700">Akademik</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Manajemen Siswa
            </h1>
            <p className="mt-2 text-muted-foreground">
              Kelola siswa aktif, data orang tua, kelas, dan import siswa dari PPDB.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <FileDown className="mr-2 h-4 w-4" />
            Import dari PPDB
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Siswa
          </Button>
          </div>
        </motion.div>

        <motion.div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" variants={staggerItem}>
        <MetricCard title="Total Siswa" value={overview.total} icon={Users} tone="cyan" />
        <MetricCard title="Siswa Aktif" value={overview.active} icon={UserRoundCheck} tone="emerald" />
        <MetricCard title="Laki-laki" value={overview.male} icon={Users} tone="blue" />
        <MetricCard title="Perempuan" value={overview.female} icon={Users} tone="rose" />
        </motion.div>

        <motion.div variants={staggerItem}>
        <Card className="border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
          <CardDescription>
            Filter berdasarkan kelas atau cari siswa melalui nama dan NISN.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
            <Select
              value={classFilter}
              onValueChange={(value) => {
                setClassFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {(classroomsQuery.data?.length
                  ? classroomsQuery.data
                  : classOptions.map((name, i) => ({ id: String(i), display_name: name, grade_level: i + 1, section: "" }))
                ).map((room) => (
                  <SelectItem key={room.display_name} value={room.display_name}>
                    {room.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama siswa atau NISN..."
                className="pl-9"
              />
            </div>
          </div>

          {studentsQuery.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <p>{getErrorMessage(studentsQuery.error)}</p>
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead>NISN</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Orang Tua</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-cyan-600" />
                      <p className="mt-2 text-sm text-muted-foreground">Memuat data siswa...</p>
                    </TableCell>
                  </TableRow>
                ) : studentsQuery.data?.students.length ? (
                  studentsQuery.data.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className={cn(
                            "h-11 w-11",
                            student.gender === "Perempuan" ? "bg-rose-50" : "bg-cyan-50"
                          )}>
                            <AvatarFallback
                              className={cn(
                                "font-bold",
                                student.gender === "Perempuan"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-cyan-50 text-cyan-700"
                              )}
                            >
                              {getInitials(student.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-950">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.nickname || "Tanpa nama panggilan"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{student.nisn}</TableCell>
                      <TableCell>{student.current_class}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>{student.parent_name}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <p>{student.parent_phone}</p>
                          {student.parent_email && (
                            <p className="text-muted-foreground">{student.parent_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass[student.status]}>
                          {statusLabels[student.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(student)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setDeleteTarget(student)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="font-semibold text-slate-700">Belum ada data siswa</p>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Tambahkan siswa baru secara manual atau import data siswa yang sudah diterima dari pendaftaran PPDB.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {studentsQuery.data?.students.length ?? 0} dari {studentsQuery.data?.count ?? 0} siswa
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>
              <span className="text-sm font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingStudent ? "Edit Data Siswa" : "Tambah Siswa Baru"}</DialogTitle>
            <DialogDescription>
              Lengkapi data siswa dan kontak orang tua/wali. NISN tidak dapat diubah setelah data dibuat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="NISN *" id="nisn">
              <Input
                id="nisn"
                value={form.nisn}
                onChange={(event) => updateForm("nisn", event.target.value)}
                disabled={Boolean(editingStudent)}
                required
              />
            </Field>
            <Field label="Nama Lengkap *" id="full_name">
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(event) => updateForm("full_name", event.target.value)}
                required
              />
            </Field>
            <Field label="Nama Panggilan" id="nickname">
              <Input
                id="nickname"
                value={form.nickname}
                onChange={(event) => updateForm("nickname", event.target.value)}
              />
            </Field>
            <Field label="Jenis Kelamin *" id="gender">
              <Select value={form.gender} onValueChange={(value: Gender) => updateForm("gender", value)}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tempat Lahir" id="birth_place">
              <Input
                id="birth_place"
                value={form.birth_place}
                onChange={(event) => updateForm("birth_place", event.target.value)}
              />
            </Field>
            <Field label="Tanggal Lahir *" id="birth_date">
              <Input
                id="birth_date"
                type="date"
                value={form.birth_date}
                onChange={(event) => updateForm("birth_date", event.target.value)}
                required
              />
            </Field>
            <Field label="Agama" id="religion">
              <Select value={form.religion} onValueChange={(value) => updateForm("religion", value)}>
                <SelectTrigger id="religion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {religionOptions.map((religion) => (
                    <SelectItem key={religion} value={religion}>
                      {religion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Kelas *" id="classroom_id">
              <Select
                value={form.classroom_id || "_legacy"}
                onValueChange={(value) => {
                  const room = classroomsQuery.data?.find((c) => c.id === value);
                  setForm((prev) => ({
                    ...prev,
                    classroom_id: value === "_legacy" ? "" : value,
                    current_class: room?.display_name || prev.current_class,
                  }));
                }}
              >
                <SelectTrigger id="classroom_id">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {!classroomsQuery.data?.length && (
                    <SelectItem value="_legacy">
                      {form.current_class || "Kelas 1"}
                    </SelectItem>
                  )}
                  {(classroomsQuery.data ?? []).map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nama Orang Tua/Wali *" id="parent_name">
              <Input
                id="parent_name"
                value={form.parent_name}
                onChange={(event) => updateForm("parent_name", event.target.value)}
                required
              />
            </Field>
            <Field label="No. HP Orang Tua *" id="parent_phone">
              <Input
                id="parent_phone"
                value={form.parent_phone}
                onChange={(event) => updateForm("parent_phone", event.target.value)}
                required
              />
            </Field>
            <Field label="Email Orang Tua" id="parent_email" className="sm:col-span-2">
              <Input
                id="parent_email"
                type="email"
                value={form.parent_email}
                onChange={(event) => updateForm("parent_email", event.target.value)}
              />
            </Field>
            <Field label="Status" id="status">
              <Select value={form.status} onValueChange={(value: StudentStatus) => updateForm("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Alamat" id="address" className="sm:col-span-2">
              <Textarea
                id="address"
                value={form.address}
                onChange={(event) => updateForm("address", event.target.value)}
                rows={3}
              />
            </Field>
            <Field label="Catatan" id="notes" className="sm:col-span-2">
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                rows={3}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetStudentDialog}>
              Batal
            </Button>
            <Button onClick={() => saveStudentMutation.mutate()} disabled={saveStudentMutation.isPending}>
              {saveStudentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Siswa dari PPDB</DialogTitle>
            <DialogDescription>
              Pilih calon siswa dengan status diterima. NISN tetap wajib diisi karena tidak dikumpulkan di formulir PPDB.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Data PPDB Diterima" id="registration">
              <Select
                value={importForm.registrationId}
                onValueChange={(value) => {
                  const registration = ppdbQuery.data?.find((item) => item.id === value);
                  setImportForm((prev) => ({
                    ...prev,
                    registrationId: value,
                    currentClass: registration?.desired_grade || prev.currentClass,
                  }));
                }}
              >
                <SelectTrigger id="registration">
                  <SelectValue placeholder={ppdbQuery.isLoading ? "Memuat data..." : "Pilih calon siswa"} />
                </SelectTrigger>
                <SelectContent>
                  {(ppdbQuery.data ?? []).map((registration) => (
                    <SelectItem key={registration.id} value={registration.id}>
                      {registration.student_name} - {registration.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {ppdbQuery.data?.length === 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Belum ada data PPDB yang siap diimport</p>
                  <p className="text-xs text-amber-700 mt-0.5">Pastikan ada pendaftaran PPDB dengan status "Diterima" di menu PPDB terlebih dahulu.</p>
                </div>
              </div>
            )}

            {selectedRegistration && (
              <div className="rounded-lg border bg-slate-50 p-4 text-sm">
                <p className="font-semibold">{selectedRegistration.student_name}</p>
                <p className="mt-1 text-muted-foreground">
                  Orang tua: {selectedRegistration.parent_name} / {selectedRegistration.parent_phone}
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NISN *" id="import-nisn">
                <Input
                  id="import-nisn"
                  value={importForm.nisn}
                  onChange={(event) => setImportForm((prev) => ({ ...prev, nisn: event.target.value }))}
                />
              </Field>
              <Field label="Masukkan ke Kelas" id="import-class">
                <Select
                  value={importForm.classroomId || "_none"}
                  onValueChange={(value) => {
                    const room = classroomsQuery.data?.find((c) => c.id === value);
                    setImportForm((prev) => ({
                      ...prev,
                      classroomId: value === "_none" ? "" : value,
                      currentClass: room?.display_name || prev.currentClass,
                    }));
                  }}
                >
                  <SelectTrigger id="import-class">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Tidak dipilih</SelectItem>
                    {(classroomsQuery.data ?? []).map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => importStudentMutation.mutate()}
              disabled={importStudentMutation.isPending || !importForm.registrationId}
            >
              {importStudentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Siswa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus siswa dari daftar?</AlertDialogTitle>
            <AlertDialogDescription>
              Data {deleteTarget?.full_name} akan di-soft delete. Data tidak dihapus permanen dari database,
              tetapi tidak tampil lagi di daftar siswa aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteStudentMutation.mutate(deleteTarget)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </motion.div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "cyan" | "emerald" | "blue" | "rose";
}) {
  const toneStyles = {
    cyan: { bg: "bg-cyan-50", text: "text-cyan-700", accent: "#06b6d4" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", accent: "#10b981" },
    blue: { bg: "bg-blue-50", text: "text-blue-700", accent: "#3b82f6" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", accent: "#f43f5e" },
  }[tone];

  return (
    <Card className="border-0 bg-white shadow-lg shadow-slate-100">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn("flex h-14 w-14 items-center justify-center rounded-full", toneStyles.bg)}
        >
          <Icon className={cn("h-7 w-7", toneStyles.text)} />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: toneStyles.accent }}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
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
