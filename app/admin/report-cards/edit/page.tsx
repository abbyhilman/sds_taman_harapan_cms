"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Predicate = "A" | "B" | "C" | "D";

interface Subject {
  id: string;
  name: string;
  code: string;
  category: string | null;
  order_position: number;
}

interface ReportCardDetail {
  id: string;
  semester: string;
  class_name: string;
  status: string;
  students: { full_name: string; nisn: string } | null;
  academic_years: { year_name: string } | null;
}

interface ExistingGrade {
  id: string;
  subject_id: string;
  knowledge_score: number | null;
  skill_score: number | null;
  predicate: Predicate | null;
  description: string | null;
}

type GradeDraft = {
  subjectId: string;
  knowledgeScore: string;
  skillScore: string;
  description: string;
};

const predicateClasses: Record<Predicate, string> = {
  A: "border-emerald-200 bg-emerald-50 text-emerald-700",
  B: "border-blue-200 bg-blue-50 text-blue-700",
  C: "border-amber-200 bg-amber-50 text-amber-700",
  D: "border-rose-200 bg-rose-50 text-rose-700",
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

const calculatePredicate = (score: number): Predicate => {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
};

const toNumberOrNull = (value: string) => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
    throw new Error("Nilai pengetahuan dan keterampilan harus berada di rentang 0-100.");
  }
  return parsed;
};

export default function EditReportCardPage() {
  const searchParams = useSearchParams();
  const reportCardId = searchParams.get("id") ?? "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [grades, setGrades] = useState<Record<string, GradeDraft>>({});

  const reportQuery = useQuery({
    queryKey: ["report-card", reportCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_cards")
        .select("id, semester, class_name, status, students(full_name, nisn), academic_years(year_name)")
        .eq("id", reportCardId)
        .single();
      if (error) throw error;
      return data as unknown as ReportCardDetail;
    },
  });

  const subjectsQuery = useQuery({
    queryKey: ["report-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code, category, order_position")
        .order("order_position");
      if (error) throw error;
      return (data ?? []) as Subject[];
    },
  });

  const gradesQuery = useQuery({
    queryKey: ["report-card-grades", reportCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_card_grades")
        .select("id, subject_id, knowledge_score, skill_score, predicate, description")
        .eq("report_card_id", reportCardId);
      if (error) throw error;
      const existingGrades = (data ?? []) as ExistingGrade[];
      const draft = existingGrades.reduce<Record<string, GradeDraft>>((accumulator, grade) => {
        accumulator[grade.subject_id] = {
          subjectId: grade.subject_id,
          knowledgeScore: grade.knowledge_score?.toString() ?? "",
          skillScore: grade.skill_score?.toString() ?? "",
          description: grade.description ?? "",
        };
        return accumulator;
      }, {});
      setGrades(draft);
      return existingGrades;
    },
  });

  const subjects = subjectsQuery.data ?? [];
  const mergedGrades = useMemo(() => {
    return subjects.reduce<Record<string, GradeDraft>>((accumulator, subject) => {
      accumulator[subject.id] = grades[subject.id] ?? {
        subjectId: subject.id,
        knowledgeScore: "",
        skillScore: "",
        description: "",
      };
      return accumulator;
    }, {});
  }, [grades, subjects]);

  const updateGrade = (subjectId: string, field: keyof GradeDraft, value: string) => {
    setGrades((current) => ({
      ...current,
      [subjectId]: {
        ...(current[subjectId] ?? { subjectId, knowledgeScore: "", skillScore: "", description: "" }),
        [field]: value,
      },
    }));
  };

  const saveGrades = useMutation({
    mutationFn: async () => {
      const payload = subjects.map((subject) => {
        const grade = mergedGrades[subject.id];
        const knowledgeScore = toNumberOrNull(grade.knowledgeScore);
        const skillScore = toNumberOrNull(grade.skillScore);
        const average = knowledgeScore !== null && skillScore !== null ? (knowledgeScore + skillScore) / 2 : null;
        return {
          report_card_id: reportCardId,
          subject_id: subject.id,
          knowledge_score: knowledgeScore,
          skill_score: skillScore,
          predicate: average === null ? null : calculatePredicate(average),
          description: grade.description.trim() || null,
        };
      });

      const { error } = await supabase
        .from("report_card_grades")
        .upsert(payload, { onConflict: "report_card_id,subject_id" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["report-card-grades", reportCardId] });
      toast({ title: "Nilai tersimpan", description: "Draft nilai mata pelajaran berhasil diperbarui." });
    },
    onError: (error) => {
      toast({ title: "Gagal menyimpan nilai", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const isLoading = reportQuery.isLoading || subjectsQuery.isLoading || gradesQuery.isLoading;
  const completedCount = subjects.filter((subject) => {
    const grade = mergedGrades[subject.id];
    return grade?.knowledgeScore !== "" && grade?.skillScore !== "";
  }).length;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button asChild variant="outline" size="icon" className="mt-1 bg-white">
              <Link href="/admin/report-cards"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <p className="text-sm font-medium text-cyan-700">B-006 · Input Nilai Mata Pelajaran</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Input Nilai Raport</h1>
              <p className="mt-2 text-sm text-slate-500">Predikat otomatis dihitung dari rata-rata nilai pengetahuan dan keterampilan.</p>
            </div>
          </div>
          <Button onClick={() => saveGrades.mutate()} disabled={saveGrades.isPending || isLoading} className="bg-slate-950 hover:bg-slate-800">
            {saveGrades.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Nilai
          </Button>
        </div>

        <motion.div className="grid gap-4 md:grid-cols-3" variants={containerVariants} initial="hidden" animate="show">
          {[
            { title: "Siswa", description: reportQuery.data?.students?.nisn ?? "-", value: reportQuery.data?.students?.full_name ?? "Memuat...", valueClass: "text-slate-950" },
            { title: "Periode", description: reportQuery.data?.academic_years?.year_name ?? "-", value: `Semester ${reportQuery.data?.semester ?? "-"}`, valueClass: "text-cyan-700" },
            { title: "Progress Nilai", description: `${completedCount} dari ${subjects.length} mapel lengkap`, value: `${subjects.length ? Math.round((completedCount / subjects.length) * 100) : 0}%`, valueClass: "text-emerald-700" },
          ].map((item) => (
            <motion.div key={item.title} variants={itemVariants}>
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="text-base">{item.title}</CardTitle><CardDescription>{item.description}</CardDescription></CardHeader>
                <CardContent className={cn("text-xl font-bold", item.valueClass)}>{item.value}</CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Nilai Mata Pelajaran</CardTitle>
            <CardDescription>Isi nilai 0-100. Predikat: A ≥ 90, B ≥ 80, C ≥ 70, D &lt; 70.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(7)].map((_, index) => (
                  <div key={index} className="grid gap-4 rounded-xl border border-slate-100 p-4 md:grid-cols-[48px_1.4fr_140px_140px_100px_1.6fr]">
                    <Skeleton className="h-4 w-6" />
                    <div className="space-y-2"><Skeleton className="h-4 w-44" /><Skeleton className="h-3 w-24" /></div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">Belum ada master data mata pelajaran. Tambahkan melalui menu Master Data.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead className="w-12">No</TableHead><TableHead>Mata Pelajaran</TableHead><TableHead className="w-36">Pengetahuan</TableHead><TableHead className="w-36">Keterampilan</TableHead><TableHead className="w-28">Predikat</TableHead><TableHead>Deskripsi</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {subjects.map((subject, index) => {
                      const grade = mergedGrades[subject.id];
                      const knowledgeScore = grade.knowledgeScore === "" ? null : Number(grade.knowledgeScore);
                      const skillScore = grade.skillScore === "" ? null : Number(grade.skillScore);
                      const average = knowledgeScore !== null && skillScore !== null ? (knowledgeScore + skillScore) / 2 : null;
                      const predicate = average === null ? null : calculatePredicate(average);

                      return (
                        <motion.tr
                          key={subject.id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.025 }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell><div className="font-medium text-slate-950">{subject.name}</div><div className="text-xs text-slate-500">{subject.code} · {subject.category ?? "Umum"}</div></TableCell>
                          <TableCell><Input type="number" min={0} max={100} value={grade.knowledgeScore} onChange={(event) => updateGrade(subject.id, "knowledgeScore", event.target.value)} /></TableCell>
                          <TableCell><Input type="number" min={0} max={100} value={grade.skillScore} onChange={(event) => updateGrade(subject.id, "skillScore", event.target.value)} /></TableCell>
                          <TableCell>{predicate ? <Badge variant="outline" className={cn("font-semibold", predicateClasses[predicate])}>{predicate}</Badge> : <span className="text-xs text-slate-400">-</span>}</TableCell>
                          <TableCell><Textarea className="min-w-[260px]" placeholder="Deskripsi capaian kompetensi..." value={grade.description} onChange={(event) => updateGrade(subject.id, "description", event.target.value)} /></TableCell>
                        </motion.tr>
                      );
                    })}
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



