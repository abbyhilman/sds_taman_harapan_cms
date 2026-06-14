"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Sparkles, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from "@/components/ui/animated";
import { KEPRIBADIAN_OPTIONS } from "@/lib/semester-utils";

type Predicate = "A" | "B" | "C" | "D";

interface Subject { id: string; name: string; code: string; category: string | null; order_position: number; }
interface ReportCardDetail {
  id: string; semester: string; class_name: string; status: string;
  students: { full_name: string; nisn: string } | null;
  academic_years: { year_name: string } | null;
}
interface ExistingGrade {
  id: string; subject_id: string;
  knowledge_score: number | null; skill_score: number | null;
  predicate: string | null; description: string | null;
}
type GradeDraft = { subjectId: string; knowledgeScore: string; skillScore: string; description: string; };

const predicateClasses: Record<Predicate, string> = {
  A: "border-emerald-200 bg-emerald-50 text-emerald-700",
  B: "border-blue-200 bg-blue-50 text-blue-700",
  C: "border-amber-200 bg-amber-50 text-amber-700",
  D: "border-rose-200 bg-rose-50 text-rose-700",
};

const getErrorMessage = (e: unknown) => e instanceof Error ? e.message : "Terjadi kesalahan.";
const calculatePredicate = (score: number): Predicate => score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D";
const toNumberOrNull = (v: string) => { const n = Number(v); return v === "" || Number.isNaN(n) ? null : n; };

export default function EditReportCardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportCardId = searchParams.get("id") ?? "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [grades, setGrades] = useState<Record<string, GradeDraft>>({});
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [kepribadianSpiritual, setKepribadianSpiritual] = useState("Baik");
  const [kepribadianSosial, setKepribadianSosial] = useState("Baik");

  const reportQuery = useQuery({
    queryKey: ["report-card", reportCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_cards")
        .select("id, semester, class_name, status, kepribadian_spiritual, kepribadian_sosial, students(full_name, nisn), academic_years(year_name)")
        .eq("id", reportCardId).single();
      if (error) throw error;
      return data as unknown as ReportCardDetail & { kepribadian_spiritual?: string; kepribadian_sosial?: string };
    },
  });

  // Sync kepribadian from fetched data
  useEffect(() => {
    if (reportQuery.data) {
      const rd = reportQuery.data as any;
      if (rd.kepribadian_spiritual) setKepribadianSpiritual(rd.kepribadian_spiritual);
      if (rd.kepribadian_sosial) setKepribadianSosial(rd.kepribadian_sosial);
    }
  }, [reportQuery.data]);

  const subjectsQuery = useQuery({
    queryKey: ["report-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id, name, code, category, order_position").order("order_position");
      if (error) throw error;
      return (data ?? []) as Subject[];
    },
  });

  const gradesQuery = useQuery({
    queryKey: ["report-card-grades", reportCardId],
    queryFn: async () => {
      const { data, error } = await supabase.from("report_card_grades")
        .select("id, subject_id, knowledge_score, skill_score, predicate, description")
        .eq("report_card_id", reportCardId);
      if (error) throw error;
      return (data ?? []) as ExistingGrade[];
    },
  });

  useEffect(() => {
    if (gradesQuery.data) {
      setGrades(gradesQuery.data.reduce<Record<string, GradeDraft>>((acc, g) => {
        acc[g.subject_id] = { subjectId: g.subject_id, knowledgeScore: g.knowledge_score?.toString() ?? "", skillScore: g.skill_score?.toString() ?? "", description: g.description ?? "" };
        return acc;
      }, {}));
    }
  }, [gradesQuery.data]);

  const subjects = subjectsQuery.data ?? [];
  const mergedGrades = useMemo(() => subjects.reduce<Record<string, GradeDraft>>((acc, s) => {
    acc[s.id] = grades[s.id] ?? { subjectId: s.id, knowledgeScore: "", skillScore: "", description: "" };
    return acc;
  }, {}), [grades, subjects]);

  const updateGrade = (subjectId: string, field: keyof GradeDraft, value: string) =>
    setGrades(cur => ({ ...cur, [subjectId]: { ...(cur[subjectId] ?? { subjectId, knowledgeScore: "", skillScore: "", description: "" }), [field]: value } }));

  const completedCount = subjects.filter(s => mergedGrades[s.id]?.knowledgeScore !== "" && mergedGrades[s.id]?.skillScore !== "").length;
  const completionRate = subjects.length ? Math.round((completedCount / subjects.length) * 100) : 0;

  const saveGrades = useMutation({
    mutationFn: async () => {
      const payload = subjects.map(subject => {
        const g = mergedGrades[subject.id];
        const kn = toNumberOrNull(g.knowledgeScore);
        const sk = toNumberOrNull(g.skillScore);
        const avg = kn !== null && sk !== null ? (kn + sk) / 2 : null;
        return { report_card_id: reportCardId, subject_id: subject.id, knowledge_score: kn, skill_score: sk, predicate: avg === null ? null : calculatePredicate(avg), description: g.description.trim() || null };
      });
      const { error } = await supabase.from("report_card_grades").upsert(payload, { onConflict: "report_card_id,subject_id" });
      if (error) throw error;

      // Save kepribadian to report_cards
      const { error: kepError } = await supabase.from("report_cards").update({
        kepribadian_spiritual: kepribadianSpiritual,
        kepribadian_sosial: kepribadianSosial,
      }).eq("id", reportCardId);
      if (kepError) console.error("Failed to save kepribadian:", kepError);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["report-card-grades", reportCardId] });
      await queryClient.invalidateQueries({ queryKey: ["report-cards"] });

      // Run AI analysis in background if enough grades filled
      if (completionRate >= 50) {
        setAiProcessing(true);
        setAiMsg("Nilai disimpan. Menjalankan analisa AI...");
        try {
          const res = await fetch(`/api/report-cards/${reportCardId}/analyze`, { method: "POST" });
          const data = await res.json();
          if (res.ok && data.ai_report) {
            setAiMsg("Menyimpan catatan AI...");
            await supabase.from("report_cards").update({
              homeroom_notes: JSON.stringify({
                appreciation: data.ai_report.appreciation || "",
                recommendation: data.ai_report.recommendation || "",
                focus_areas: data.ai_report.focus_areas || [],
                strength_note: data.ai_report.strength_note || "",
                attendance_note: data.ai_report.attendance_note || "",
                semester_comparison: data.ai_report.semester_comparison || null,
              }),
            }).eq("id", reportCardId);
            await queryClient.invalidateQueries({ queryKey: ["report-preview", reportCardId] });
          }
        } catch {
          // AI failure is non-blocking
        } finally {
          setAiProcessing(false);
        }
      }

      router.push(`/admin/report-cards/preview?id=${reportCardId}`);
    },
    onError: (error) => toast({ title: "Gagal menyimpan nilai", description: getErrorMessage(error), variant: "destructive" }),
  });

  const isLoading = reportQuery.isLoading || subjectsQuery.isLoading || gradesQuery.isLoading;
  const isReadOnly = reportQuery.data?.status ? reportQuery.data.status !== "draft" : false;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8 relative">
      {aiProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-violet-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Analisa AI Sedang Berjalan</h3>
            <p className="text-sm text-slate-500">{aiMsg}</p>
            <Loader2 className="h-6 w-6 text-violet-600 animate-spin mx-auto" />
          </div>
        </div>
      )}

      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
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
              {saveGrades.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Nilai
            </Button>
          )}
        </motion.div>

        {isReadOnly && (
          <motion.div variants={fadeInDown} className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex gap-3 items-start shadow-sm">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-blue-900">Rapor Telah Difinalisasi & Dikunci</h4>
              <p className="text-xs text-blue-700 mt-1">Rapor ini sudah dikunci. Nilai dan catatan tidak dapat diubah kembali.</p>
            </div>
          </motion.div>
        )}

        <motion.div className="grid gap-4 md:grid-cols-3" variants={staggerContainer}>
          {[
            { title: "Siswa", description: reportQuery.data?.students?.nisn ?? "-", value: reportQuery.data?.students?.full_name ?? "Memuat...", valueClass: "text-slate-950" },
            { title: "Periode", description: reportQuery.data?.academic_years?.year_name ?? "-", value: `Semester ${reportQuery.data?.semester ?? "-"}`, valueClass: "text-cyan-700" },
            { title: "Progress Nilai", description: `${completedCount} dari ${subjects.length} mapel lengkap`, value: `${completionRate}%`, valueClass: completionRate >= 50 ? "text-emerald-700" : "text-amber-600" },
          ].map(item => (
            <motion.div key={item.title} variants={staggerItem} whileHover={{ y: -2 }}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader><CardTitle className="text-base">{item.title}</CardTitle><CardDescription>{item.description}</CardDescription></CardHeader>
                <CardContent className={cn("text-xl font-bold", item.valueClass)}>{item.value}</CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Kepribadian / Personality Assessment */}
        <motion.div variants={fadeInUp}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Penilaian Sikap (Kepribadian)</CardTitle>
              <CardDescription>Penilaian sikap spiritual dan sosial siswa. Default: Baik.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Sikap Spiritual</Label>
                  <Select value={kepribadianSpiritual} onValueChange={setKepribadianSpiritual} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KEPRIBADIAN_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">Meliputi: ketaatan beribadah, bersyukur, toleransi beragama.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Sikap Sosial</Label>
                  <Select value={kepribadianSosial} onValueChange={setKepribadianSosial} disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KEPRIBADIAN_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">Meliputi: jujur, disiplin, tanggung jawab, santun, percaya diri.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Nilai Mata Pelajaran</CardTitle>
              <CardDescription>Isi nilai 0-100. Predikat: A ≥ 90, B ≥ 80, C ≥ 70, D &lt; 70.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[...Array(7)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Belum Ada Mata Pelajaran</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">
                      Tambahkan mata pelajaran terlebih dahulu melalui Master Data agar bisa diisi nilainya.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50">
                    <Link href="/admin/master-data">Ke Master Data</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Mata Pelajaran</TableHead>
                        <TableHead className="w-36">Pengetahuan</TableHead>
                        <TableHead className="w-36">Keterampilan</TableHead>
                        <TableHead className="w-28">Predikat</TableHead>
                        <TableHead>Deskripsi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject, index) => {
                        const grade = mergedGrades[subject.id];
                        const kn = grade.knowledgeScore === "" ? null : Number(grade.knowledgeScore);
                        const sk = grade.skillScore === "" ? null : Number(grade.skillScore);
                        const avg = kn !== null && sk !== null ? (kn + sk) / 2 : null;
                        const predicate = avg === null ? null : calculatePredicate(avg);
                        return (
                          <motion.tr key={subject.id} className="border-b transition-colors hover:bg-muted/50"
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.03 }}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <div className="font-medium text-slate-950">{subject.name}</div>
                              <div className="text-xs text-slate-500">{subject.code} · {subject.category ?? "Umum"}</div>
                            </TableCell>
                            <TableCell><Input type="number" min={0} max={100} value={grade.knowledgeScore} disabled={isReadOnly} onChange={e => updateGrade(subject.id, "knowledgeScore", e.target.value)} /></TableCell>
                            <TableCell><Input type="number" min={0} max={100} value={grade.skillScore} disabled={isReadOnly} onChange={e => updateGrade(subject.id, "skillScore", e.target.value)} /></TableCell>
                            <TableCell>{predicate ? <Badge variant="outline" className={cn("font-semibold", predicateClasses[predicate])}>{predicate}</Badge> : <span className="text-xs text-slate-400">-</span>}</TableCell>
                            <TableCell><Textarea className="min-w-[260px]" placeholder="Deskripsi capaian kompetensi..." value={grade.description} disabled={isReadOnly} onChange={e => updateGrade(subject.id, "description", e.target.value)} /></TableCell>
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
