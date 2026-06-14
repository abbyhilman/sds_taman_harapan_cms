"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenCheck, FileText, Loader2, Plus, Search, AlertTriangle } from "lucide-react";
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
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from "@/components/ui/animated";
import { PageLoading } from "@/components/ui/loading";

type Semester = "Ganjil" | "Genap";
type ReportStatus = "draft" | "finalized" | "sent";

interface Student { id: string; nisn: string; full_name: string; current_class: string; parent_email: string | null; }
interface AcademicYear { id: string; year_name: string; is_active: boolean; }
interface ReportCardGrade { knowledge_score: number | null; skill_score: number | null; }
interface ReportCard { id: string; semester: Semester; class_name: string; status: ReportStatus; created_at: string; students: Student | null; academic_years: AcademicYear | null; report_card_grades: ReportCardGrade[]; }

const semesterOptions: Semester[] = ["Ganjil", "Genap"];
const statusLabels: Record<ReportStatus, string> = { draft: "Draft", finalized: "Final", sent: "Terkirim" };
const statusClasses: Record<ReportStatus, string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  finalized: "border-blue-200 bg-blue-50 text-blue-700",
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "Terjadi kesalahan.";

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
      const { data, error } = await supabase.from("students").select("id, nisn, full_name, current_class, parent_email").eq("status", "active").is("deleted_at", null).order("current_class").order("full_name");
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

  const academicYearsQuery = useQuery({
    queryKey: ["report-academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase.from("academic_years").select("id, year_name, is_active").order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AcademicYear[];
    },
  });

  const reportCardsQuery = useQuery({
    queryKey: ["report-cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("report_cards").select("id, semester, class_name, status, created_at, students(id, nisn, full_name, current_class, parent_email), academic_years(id, year_name, is_active), report_card_grades(knowledge_score, skill_score)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReportCard[];
    },
  });

  const templatesQuery = useQuery({
    queryKey: ["prereq-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("raport_templates").select("id, status").eq("status", "active").limit(1);
      if (error) throw error;
      return data ?? [];
    },
  });

  const subjectsQuery = useQuery({
    queryKey: ["prereq-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id").limit(1);
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedStudent = studentsQuery.data?.find((s) => s.id === studentId);
  const filteredStudents = useMemo(() => {
    const keyword = studentSearch.toLowerCase().trim();
    return (studentsQuery.data ?? []).filter((s) => [s.full_name, s.nisn, s.current_class].some((v) => v?.toLowerCase().includes(keyword)));
  }, [studentSearch, studentsQuery.data]);

  const createReport = useMutation({
    mutationFn: async () => {
      if (!studentId || !academicYearId || !selectedStudent) throw new Error("Pilih siswa, tahun ajaran, dan semester.");
      const { data: existing } = await supabase.from("report_cards").select("id").eq("student_id", studentId).eq("academic_year_id", academicYearId).eq("semester", semester).maybeSingle();
      if (existing) throw new Error("Raport sudah ada.");
      const { error } = await supabase.from("report_cards").insert({ student_id: studentId, academic_year_id: academicYearId, semester, class_name: selectedStudent.current_class, status: "draft" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      setDialogOpen(false);
      setStudentId("");
      setStudentSearch("");
      toast({ title: "Raport dibuat", description: "Draft raport siap diisi nilainya." });
    },
    onError: (error) => toast({ title: "Gagal", description: getErrorMessage(error), variant: "destructive" }),
  });

  const activeYearId = academicYearsQuery.data?.find((y) => y.is_active)?.id;
  const hasActiveTemplate = (templatesQuery.data?.length ?? 0) > 0;
  const hasActiveYear = !!activeYearId;
  const hasSubjects = (subjectsQuery.data?.length ?? 0) > 0;
  const missingPrereqs: { label: string; href: string; action: string }[] = [];
  if (!hasActiveTemplate) missingPrereqs.push({ label: "Template Raport aktif", href: "/admin/raport-templates", action: "Upload & aktifkan template" });
  if (!hasActiveYear) missingPrereqs.push({ label: "Tahun Ajaran aktif", href: "/admin/master-data", action: "Tambah tahun ajaran" });
  if (!hasSubjects) missingPrereqs.push({ label: "Mata Pelajaran", href: "/admin/master-data", action: "Tambah mata pelajaran" });
  const reports = reportCardsQuery.data ?? [];
  const stats = [
    { label: "Total Raport", value: reports.length, color: "text-cyan-700", iconClass: "bg-cyan-50 text-cyan-700", icon: BookOpenCheck },
    { label: "Draft", value: reports.filter((r) => r.status === "draft").length, color: "text-amber-700", iconClass: "bg-amber-50 text-amber-700", icon: FileText },
    { label: "Terkirim", value: reports.filter((r) => r.status === "sent").length, color: "text-emerald-700", iconClass: "bg-emerald-50 text-emerald-700", icon: FileText },
  ];

  const isInitialLoading = reportCardsQuery.isLoading && studentsQuery.isLoading;

  if (isInitialLoading) {
    return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat raport digital..." /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Raport Digital</h1>
            <p className="mt-2 text-sm text-slate-500">Kelola draft raport, pilih siswa, semester, tahun ajaran, lalu input nilai.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open && activeYearId && !academicYearId) setAcademicYearId(activeYearId); }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-950 hover:bg-slate-800" disabled={missingPrereqs.length > 0}><Plus className="mr-2 h-4 w-4" /> Buat Raport</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Buat Raport Baru</DialogTitle>
                <DialogDescription>Pilih siswa aktif, semester, dan tahun ajaran.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cari Siswa</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input className="pl-9" placeholder="Nama, NISN, atau kelas..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
                  </div>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                    <SelectContent>{filteredStudents.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name} · {s.nisn} · {s.current_class}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select value={semester} onValueChange={(v) => setSemester(v as Semester)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{semesterOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun Ajaran</Label>
                    <Select value={academicYearId} onValueChange={setAcademicYearId}>
                      <SelectTrigger><SelectValue placeholder="Pilih tahun ajaran" /></SelectTrigger>
                      <SelectContent>{(academicYearsQuery.data ?? []).map((y) => <SelectItem key={y.id} value={y.id}>{y.year_name}{y.is_active ? " · Aktif" : ""}</SelectItem>)}</SelectContent>
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
        </motion.div>

        {/* Prerequisite Warnings */}
        {missingPrereqs.length > 0 && (
          <motion.div className="space-y-2" variants={fadeInDown}>
            {missingPrereqs.map((prereq) => (
              <div key={prereq.label} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    Belum ada {prereq.label}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Anda perlu menyiapkan {prereq.label.toLowerCase()} sebelum membuat raport digital.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0">
                  <Link href={prereq.href}>{prereq.action}</Link>
                </Button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div className="grid gap-4 md:grid-cols-3" variants={staggerContainer}>
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem} whileHover={{ y: -2 }}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", stat.iconClass)}><stat.icon /></div>
                  <div><p className="text-sm text-slate-500">{stat.label}</p><p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Table Card */}
        <motion.div variants={fadeInUp}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Daftar Raport</CardTitle>
              <CardDescription>Draft raport yang sudah dibuat dapat dilanjutkan ke input nilai.</CardDescription>
            </CardHeader>
            <CardContent>
              {reportCardsQuery.isLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : reports.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-8 text-center">
                  <BookOpenCheck className="mb-3 h-10 w-10 text-cyan-700" />
                  <h2 className="text-lg font-semibold text-slate-950">Belum ada raport</h2>
                  <p className="mt-2 max-w-md text-sm text-slate-500">Mulai dengan membuat draft raport pertama untuk siswa aktif.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Siswa</TableHead><TableHead>Kelas</TableHead><TableHead>Tahun Ajaran</TableHead><TableHead>Semester</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {reports.map((report, index) => (
                        <motion.tr
                          key={report.id}
                          className="border-b transition-colors hover:bg-muted/50"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                          <TableCell><div className="font-medium text-slate-950">{report.students?.full_name ?? "-"}</div><div className="text-xs text-slate-500">NISN {report.students?.nisn ?? "-"}</div></TableCell>
                          <TableCell>{report.class_name}</TableCell>
                          <TableCell>{report.academic_years?.year_name ?? "-"}</TableCell>
                          <TableCell>{report.semester}</TableCell>
                          <TableCell><Badge variant="outline" className={cn("font-medium", statusClasses[report.status])}>{statusLabels[report.status]}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/report-cards/edit?id=${report.id}`}>
                                  {report.status === "draft" ? "Input Nilai" : "Lihat Nilai"}
                                </Link>
                              </Button>
                              <Button asChild size="sm" className="bg-cyan-700 hover:bg-cyan-800 text-white">
                                <Link
                                  href={`/admin/report-cards/preview?id=${report.id}`}
                                  onClick={(e) => {
                                    const hasGrades = report.report_card_grades && report.report_card_grades.length > 0 && report.report_card_grades.some(
                                      (g) => g.knowledge_score !== null || g.skill_score !== null
                                    );
                                    if (!hasGrades) {
                                      e.preventDefault();
                                      toast({
                                        title: "Nilai Belum Diisi",
                                        description: "Rapor ini belum memiliki input nilai. Silakan isi nilai terlebih dahulu sebelum mereview.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  Review Rapor
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
