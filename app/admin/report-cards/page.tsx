"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, FileText, Loader2, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Semester = "Ganjil" | "Genap";
type ReportStatus = "draft" | "finalized" | "sent";

interface Student {
  id: string;
  nisn: string;
  full_name: string;
  current_class: string;
  parent_email: string | null;
}

interface AcademicYear {
  id: string;
  year_name: string;
  is_active: boolean;
}

interface ReportCard {
  id: string;
  semester: Semester;
  class_name: string;
  status: ReportStatus;
  created_at: string;
  students: Student | null;
  academic_years: AcademicYear | null;
}

const semesterOptions: Semester[] = ["Ganjil", "Genap"];
const statusLabels: Record<ReportStatus, string> = {
  draft: "Draft",
  finalized: "Final",
  sent: "Terkirim",
};
const statusClasses: Record<ReportStatus, string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  finalized: "border-blue-200 bg-blue-50 text-blue-700",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

export default function ReportCardsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [semester, setSemester] = useState<Semester>("Ganjil");
  const [studentSearch, setStudentSearch] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["report-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, nisn, full_name, current_class, parent_email")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("current_class")
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

  const academicYearsQuery = useQuery({
    queryKey: ["report-academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id, year_name, is_active")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AcademicYear[];
    },
  });

  const reportCardsQuery = useQuery({
    queryKey: ["report-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_cards")
        .select("id, semester, class_name, status, created_at, students(id, nisn, full_name, current_class, parent_email), academic_years(id, year_name, is_active)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReportCard[];
    },
  });

  const selectedStudent = studentsQuery.data?.find((student) => student.id === studentId);
  const filteredStudents = useMemo(() => {
    const keyword = studentSearch.toLowerCase().trim();
    return (studentsQuery.data ?? []).filter((student) =>
      [student.full_name, student.nisn, student.current_class].some((value) =>
        value?.toLowerCase().includes(keyword)
      )
    );
  }, [studentSearch, studentsQuery.data]);

  const createReport = useMutation({
    mutationFn: async () => {
      if (!studentId || !academicYearId || !selectedStudent) {
        throw new Error("Pilih siswa, tahun ajaran, dan semester terlebih dahulu.");
      }

      const { data: existing, error: existingError } = await supabase
        .from("report_cards")
        .select("id")
        .eq("student_id", studentId)
        .eq("academic_year_id", academicYearId)
        .eq("semester", semester)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) throw new Error("Raport untuk siswa, tahun ajaran, dan semester ini sudah ada.");

      const { data, error } = await supabase
        .from("report_cards")
        .insert({
          student_id: studentId,
          academic_year_id: academicYearId,
          semester,
          class_name: selectedStudent.current_class,
          status: "draft",
        })
        .select("id")
        .single();

      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      setDialogOpen(false);
      setStudentId("");
      setStudentSearch("");
      toast({ title: "Raport dibuat", description: "Draft raport siap diisi nilainya." });
    },
    onError: (error) => {
      toast({ title: "Gagal membuat raport", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const activeYearId = academicYearsQuery.data?.find((year) => year.is_active)?.id;
  const reports = reportCardsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-700">Sprint 3 · Input Nilai</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Raport Digital</h1>
            <p className="mt-2 text-sm text-slate-500">Kelola draft raport, pilih siswa, semester, tahun ajaran, lalu input nilai mata pelajaran.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (open && activeYearId && !academicYearId) setAcademicYearId(activeYearId);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-950 hover:bg-slate-800">
                <Plus className="mr-2 h-4 w-4" /> Buat Raport
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Raport Baru</DialogTitle>
                <DialogDescription>Pilih siswa aktif, semester, dan tahun ajaran. Sistem akan menolak duplikasi raport.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cari Siswa</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input className="pl-9" placeholder="Nama, NISN, atau kelas..." value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} />
                  </div>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                    <SelectContent>
                      {filteredStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>{student.full_name} · {student.nisn} · {student.current_class}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={semester} onValueChange={(value) => setSemester(value as Semester)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{semesterOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun Ajaran</Label>
                    <Select value={academicYearId} onValueChange={setAcademicYearId}>
                      <SelectTrigger><SelectValue placeholder="Pilih tahun ajaran" /></SelectTrigger>
                      <SelectContent>
                        {(academicYearsQuery.data ?? []).map((year) => <SelectItem key={year.id} value={year.id}>{year.year_name}{year.is_active ? " · Aktif" : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button onClick={() => createReport.mutate()} disabled={createReport.isPending}>
                  {createReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Buat Draft
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <motion.div className="grid gap-4 md:grid-cols-3" variants={containerVariants} initial="hidden" animate="show">
          {[
            { label: "Total Raport", value: reports.length, color: "text-cyan-700", iconClass: "bg-cyan-50 text-cyan-700", icon: BookOpenCheck },
            { label: "Draft", value: reports.filter((report) => report.status === "draft").length, color: "text-amber-700", iconClass: "bg-amber-50 text-amber-700", icon: FileText },
            { label: "Terkirim", value: reports.filter((report) => report.status === "sent").length, color: "text-emerald-700", iconClass: "bg-emerald-50 text-emerald-700", icon: FileText },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", stat.iconClass)}><Icon /></div>
                    <div><p className="text-sm text-slate-500">{stat.label}</p><p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p></div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Daftar Raport</CardTitle>
            <CardDescription>Draft raport yang sudah dibuat dapat dilanjutkan ke input nilai.</CardDescription>
          </CardHeader>
          <CardContent>
            {reportCardsQuery.isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="grid gap-4 rounded-xl border border-slate-100 p-4 md:grid-cols-[1.4fr_0.8fr_1fr_0.7fr_0.7fr_0.8fr]">
                    <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-9 w-24 justify-self-end" />
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-8 text-center">
                <BookOpenCheck className="mb-3 h-10 w-10 text-cyan-700" />
                <h2 className="text-lg font-semibold text-slate-950">Belum ada raport</h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">Mulai Sprint 3 dengan membuat draft raport pertama untuk siswa aktif.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Siswa</TableHead><TableHead>Kelas</TableHead><TableHead>Tahun Ajaran</TableHead><TableHead>Semester</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {reports.map((report, index) => (
                      <motion.tr
                        key={report.id}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.035 }}
                      >
                        <TableCell><div className="font-medium text-slate-950">{report.students?.full_name ?? "-"}</div><div className="text-xs text-slate-500">NISN {report.students?.nisn ?? "-"}</div></TableCell>
                        <TableCell>{report.class_name}</TableCell>
                        <TableCell>{report.academic_years?.year_name ?? "-"}</TableCell>
                        <TableCell>{report.semester}</TableCell>
                        <TableCell><Badge variant="outline" className={cn("font-medium", statusClasses[report.status])}>{statusLabels[report.status]}</Badge></TableCell>
                        <TableCell className="text-right"><Button asChild variant="outline" size="sm"><Link href={`/admin/report-cards/edit?id=${report.id}`}>Input Nilai</Link></Button></TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



