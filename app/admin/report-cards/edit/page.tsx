"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Sparkles, TrendingUp, TrendingDown, FileText, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from "@/components/ui/animated";

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
  predicate: string | null;
  description: string | null;
}

interface AIAnalysis {
  student_name: string;
  class_name: string;
  semester: string;
  total_subjects: number;
  completed_subjects: number;
  completion_rate: number;
  average_knowledge: number;
  average_skill: number;
  overall_average: number;
  top_subjects: { name: string; score: number }[];
  weak_subjects: { name: string; score: number }[];
}

interface AIReport {
  appreciation: string;
  recommendation: string;
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

const calculatePredicate = (score: number): Predicate => {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
};

const toNumberOrNull = (value: string) => {
  const parsed = Number(value);
  return value === "" || Number.isNaN(parsed) ? null : parsed;
};

const validateScore = (value: string) => {
  if (value === "") return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
    throw new Error("Nilai pengetahuan dan keterampilan harus berada di rentang 0-100.");
  }
  return parsed;
};

export default function EditReportCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportCardId = searchParams.get("id") ?? "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [grades, setGrades] = useState<Record<string, GradeDraft>>({});
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProcessingMsg, setAiProcessingMsg] = useState("");

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
      return (data ?? []) as ExistingGrade[];
    },
  });

  // Sync database grades with local component state
  useEffect(() => {
    if (gradesQuery.data) {
      const draft = gradesQuery.data.reduce<Record<string, GradeDraft>>((accumulator, grade) => {
        accumulator[grade.subject_id] = {
          subjectId: grade.subject_id,
          knowledgeScore: grade.knowledge_score?.toString() ?? "",
          skillScore: grade.skill_score?.toString() ?? "",
          description: grade.description ?? "",
        };
        return accumulator;
      }, {});
      setGrades(draft);
    }
  }, [gradesQuery.data]);

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
      await queryClient.invalidateQueries({ queryKey: ["report-preview", reportCardId] });
      await queryClient.invalidateQueries({ queryKey: ["report-cards"] });

      if (completionRate >= 50) {
        setAiProcessing(true);
        setAiProcessingMsg("Menyimpan nilai berhasil. Menjalankan analisa AI...");

        try {
          setAiProcessingMsg("Menganalisis performa siswa dengan AI...");
          const res = await fetch(`/api/report-cards/${reportCardId}/analyze`, {
            method: "POST",
          });
          const data = await res.json();
          if (res.ok && data.ai_report) {
            setAiProcessingMsg("Menyimpan catatan wali kelas ke database...");
            const combinedNotes = JSON.stringify({
              appreciation: data.ai_report.appreciation || "",
              recommendation: data.ai_report.recommendation || "",
            });

            const { error: dbError } = await supabase
              .from("report_cards")
              .update({ homeroom_notes: combinedNotes })
              .eq("id", reportCardId);

            if (dbError) throw dbError;

            await queryClient.invalidateQueries({ queryKey: ["report-preview", reportCardId] });
            setAiProcessingMsg("Selesai! Mengalihkan ke pratinjau rapor...");
          } else {
            throw new Error(data.error || "Gagal melakukan analisa AI");
          }
        } catch (err: any) {
          console.error("Auto AI Analysis error:", err);
          toast({
            title: "Analisa AI Terlewati",
            description: "Nilai berhasil disimpan, namun analisis AI gagal: " + (err.message || ""),
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Nilai Berhasil Disimpan",
          description: "Mengalihkan ke pratinjau rapor..."
        });
      }

      router.push(`/admin/report-cards/preview?id=${reportCardId}`);
    },
    onError: (error) => {
      toast({ title: "Gagal menyimpan nilai", description: getErrorMessage(error), variant: "destructive" });
    },
  });

  const isLoading = reportQuery.isLoading || subjectsQuery.isLoading || gradesQuery.isLoading;
  const isReadOnly = reportQuery.data?.status ? reportQuery.data.status !== "draft" : false;
  const completedCount = subjects.filter((subject) => {
    const grade = mergedGrades[subject.id];
    return grade?.knowledgeScore !== "" && grade?.skillScore !== "";
  }).length;
  const completionRate = subjects.length ? Math.round((completedCount / subjects.length) * 100) : 0;
  const canAnalyze = completionRate >= 50;



  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8 relative">
      {/* Full-Screen AI Processing Overlay */}
      {aiProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-violet-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Analisa AI Sedang Berjalan</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{aiProcessingMsg}</p>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
            </div>
          </div>
        </div>
      )}
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div className="flex items-start gap-3">
            <Button asChild variant="outline" size="icon" className="mt-1 bg-white">
              <Link href="/admin/report-cards"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Input Nilai Raport</h1>
              <p className="mt-2 text-sm text-slate-500">Predikat otomatis dihitung dari rata-rata nilai pengetahuan dan keterampilan.</p>
            </div>
          </div>
          {!isReadOnly && (
            <Button onClick={() => saveGrades.mutate()} disabled={saveGrades.isPending || isLoading} className="bg-slate-950 hover:bg-slate-800">
              {saveGrades.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Simpan Nilai
            </Button>
          )}
        </motion.div>

        {isReadOnly && (
          <motion.div variants={fadeInDown} className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex gap-3 items-start shadow-sm animate-pulse">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-blue-900">Rapor Telah Difinalisasi & Dikunci</h4>
              <p className="text-xs text-blue-700 mt-1">Rapor ini sudah dikunci karena statusnya sudah <strong>Final</strong> atau <strong>Terkirim</strong>. Nilai dan catatan tidak dapat diubah kembali.</p>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div className="grid gap-4 md:grid-cols-3" variants={staggerContainer}>
          {[
            { title: "Siswa", description: reportQuery.data?.students?.nisn ?? "-", value: reportQuery.data?.students?.full_name ?? "Memuat...", valueClass: "text-slate-950" },
            { title: "Periode", description: reportQuery.data?.academic_years?.year_name ?? "-", value: `Semester ${reportQuery.data?.semester ?? "-"}`, valueClass: "text-cyan-700" },
            { title: "Progress Nilai", description: `${completedCount} dari ${subjects.length} mapel lengkap`, value: `${completionRate}%`, valueClass: completionRate >= 50 ? "text-emerald-700" : "text-amber-600" },
          ].map((item) => (
            <motion.div key={item.title} variants={staggerItem} whileHover={{ y: -2 }}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader><CardTitle className="text-base">{item.title}</CardTitle><CardDescription>{item.description}</CardDescription></CardHeader>
                <CardContent className={cn("text-xl font-bold", item.valueClass)}>{item.value}</CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Table Card */}
        <motion.div variants={fadeInUp}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Nilai Mata Pelajaran</CardTitle>
              <CardDescription>Isi nilai 0-100. Predikat: A ≥ 90, B ≥ 80, C ≥ 70, D &lt; 70.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(7)].map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full" />
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
                            className="border-b transition-colors hover:bg-muted/50"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell><div className="font-medium text-slate-950">{subject.name}</div><div className="text-xs text-slate-500">{subject.code} · {subject.category ?? "Umum"}</div></TableCell>
                            <TableCell><Input type="number" min={0} max={100} value={grade.knowledgeScore} disabled={isReadOnly} onChange={(event) => updateGrade(subject.id, "knowledgeScore", event.target.value)} /></TableCell>
                            <TableCell><Input type="number" min={0} max={100} value={grade.skillScore} disabled={isReadOnly} onChange={(event) => updateGrade(subject.id, "skillScore", event.target.value)} /></TableCell>
                            <TableCell>{predicate ? <Badge variant="outline" className={cn("font-semibold", predicateClasses[predicate])}>{predicate}</Badge> : <span className="text-xs text-slate-400">-</span>}</TableCell>
                            <TableCell><Textarea className="min-w-[260px]" placeholder="Deskripsi capaian kompetensi..." value={grade.description} disabled={isReadOnly} onChange={(event) => updateGrade(subject.id, "description", event.target.value)} /></TableCell>
                          </motion.tr>
                      );
                    })}
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
