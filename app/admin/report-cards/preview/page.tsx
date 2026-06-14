"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Sparkles, Loader2, Save, Undo2, TrendingUp, TrendingDown, BookOpen, AlertCircle, Edit, FileText, Check, AlertTriangle, Target, Lightbulb, Star, ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { PageLoading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReportData {
  id: string;
  semester: string;
  class_name: string;
  status: string;
  homeroom_notes: string | null;
  students: { full_name: string; nisn: string; current_class: string; gender: string; birth_place: string | null; birth_date: string | null; parent_name: string; address: string | null } | null;
  academic_years: { year_name: string } | null;
}

interface GradeData {
  knowledge_score: number | null;
  skill_score: number | null;
  predicate: string | null;
  description: string | null;
  subjects: { name: string; code: string; category: string } | null;
}

interface FocusArea {
  subject: string;
  current_score: number;
  target_score: number;
  priority: string;
  strategies: string[];
  daily_tip: string;
}

interface SemesterComparison {
  previous_average: number | null;
  trend: 'naik' | 'turun' | 'stabil';
  note: string;
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  tinggi:  { label: 'Prioritas Tinggi',  className: 'border-red-200 bg-red-50 text-red-700' },
  sedang:  { label: 'Prioritas Sedang',  className: 'border-amber-200 bg-amber-50 text-amber-700' },
  rendah:  { label: 'Prioritas Rendah',  className: 'border-blue-200 bg-blue-50 text-blue-700' },
};

function AIFocusPanel({ focusAreas, strengthNote }: { focusAreas: FocusArea[]; strengthNote: string }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  if (focusAreas.length === 0 && !strengthNote) return null;
  return (
    <div className="space-y-3">
      {strengthNote && (
        <div className="rounded-lg border bg-blue-50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Kekuatan Siswa</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{strengthNote}</p>
        </div>
      )}
      {focusAreas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fokus Belajar</span>
          </div>
          {focusAreas.map((area, idx) => {
            const pCfg = priorityConfig[area.priority] ?? priorityConfig.sedang;
            const isOpen = expandedIdx === idx;
            return (
              <div key={idx} className="rounded-lg border bg-white overflow-hidden shadow-sm">
                <button
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedIdx(isOpen ? null : idx)}
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{area.subject}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Nilai: <span className="text-amber-600 font-medium">{area.current_score}</span>
                      {' → '}Target: <span className="text-emerald-600 font-medium">{area.target_score}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", pCfg.className)}>{pCfg.label}</Badge>
                    {isOpen ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-2 border-t bg-slate-50">
                        <ul className="space-y-1 pt-2">
                          {area.strategies.map((s, si) => (
                            <li key={si} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-700">{si + 1}</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                        {area.daily_tip && (
                          <div className="flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 p-2">
                            <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-800 leading-relaxed">{area.daily_tip}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReportCardPreviewPage() {
  const searchParams = useSearchParams();
  const reportCardId = searchParams.get("id") || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAppreciation, setAiAppreciation] = useState("");
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [savingAi, setSavingAi] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  const handleFinalize = async () => {
    setFinalizeLoading(true);
    try {
      const { error } = await supabase
        .from("report_cards")
        .update({
          status: "finalized",
          finalized_at: new Date().toISOString(),
        })
        .eq("id", reportCardId);

      if (error) throw error;

      toast({
        title: "Rapor Berhasil Difinalisasi",
        description: "Status rapor kini 'Final' dan data nilai telah dikunci.",
      });

      await queryClient.invalidateQueries({ queryKey: ["report-preview", reportCardId] });
      await queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      setPdfKey((prev) => prev + 1);
      setFinalizeDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Gagal Memfinalisasi Rapor",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setFinalizeLoading(false);
    }
  };

  // 1. Fetch Report Card Details
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["report-preview", reportCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_cards")
        .select(`*, students(*), academic_years(year_name)`)
        .eq("id", reportCardId)
        .single();
      if (error) throw error;
      return data as ReportData;
    },
    enabled: !!reportCardId,
  });

  // 2. Fetch Grades Details
  const { data: grades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ["report-preview-grades", reportCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_card_grades")
        .select(`*, subjects(name, code, category, order_position)`)
        .eq("report_card_id", reportCardId)
        .order("subjects(order_position)");
      if (error) throw error;
      return (data || []) as GradeData[];
    },
    enabled: !!reportCardId,
  });

  // Derive appreciation, recommendation, focus_areas, strength_note from homeroom_notes JSON
  const { appreciation, recommendation, focusAreas, strengthNote, attendanceNote, semesterComparison } = useMemo(() => {
    let appreciationText = "";
    let recommendationText = "";
    let focusAreasData: FocusArea[] = [];
    let strengthNoteText = "";
    let attendanceNoteText = "";
    let semesterComparisonData: SemesterComparison | null = null;
    const notesRaw = report?.homeroom_notes || "";
    if (notesRaw.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(notesRaw);
        appreciationText = parsed.appreciation || "";
        recommendationText = parsed.recommendation || "";
        focusAreasData = parsed.focus_areas || [];
        strengthNoteText = parsed.strength_note || "";
        attendanceNoteText = parsed.attendance_note || "";
        semesterComparisonData = parsed.semester_comparison || null;
      } catch {
        appreciationText = notesRaw;
      }
    } else {
      appreciationText = notesRaw;
    }
    return { appreciation: appreciationText, recommendation: recommendationText, focusAreas: focusAreasData, strengthNote: strengthNoteText, attendanceNote: attendanceNoteText, semesterComparison: semesterComparisonData };
  }, [report?.homeroom_notes]);

  // Sync notes state with DB data when loaded
  useEffect(() => {
    if (report) {
      const notesRaw = report.homeroom_notes || "";
      if (notesRaw.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(notesRaw);
          setAiAppreciation(parsed.appreciation || "");
          setAiRecommendation(parsed.recommendation || "");
        } catch {
          setAiAppreciation(notesRaw);
        }
      } else {
        setAiAppreciation(notesRaw);
      }
    }
  }, [report]);

  // 3. Dynamically calculate stats on the frontend for the AI modal dashboard
  const stats = useMemo(() => {
    if (!grades || grades.length === 0) return null;
    const completedGrades = grades.filter(g => g.knowledge_score !== null && g.skill_score !== null);
    if (completedGrades.length === 0) return null;
    
    const subjectScores = completedGrades.map(g => {
      const avg = (Number(g.knowledge_score) + Number(g.skill_score)) / 2;
      return {
        name: g.subjects?.name || 'Unknown',
        average: avg,
        predicate: g.predicate || (avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : 'D')
      };
    });
    
    const avgKnowledge = completedGrades.reduce((sum, g) => sum + Number(g.knowledge_score), 0) / completedGrades.length;
    const avgSkill = completedGrades.reduce((sum, g) => sum + Number(g.skill_score), 0) / completedGrades.length;
    const overallAvg = (avgKnowledge + avgSkill) / 2;
    
    const sorted = [...subjectScores].sort((a, b) => b.average - a.average);
    const topSubjects = sorted.slice(0, 3);
    const weakSubjects = sorted.filter(s => s.average < 80);
    
    return {
      overallAverage: Math.round(overallAvg * 10) / 10,
      topSubjects,
      weakSubjects,
      completedCount: completedGrades.length,
      totalCount: grades.length,
      completionRate: Math.round((completedGrades.length / grades.length) * 100)
    };
  }, [grades]);

  if (reportLoading || gradesLoading) {
    return <div className="min-h-screen bg-white p-6"><PageLoading text="Memuat rapor..." /></div>;
  }

  if (!report) {
    return <div className="min-h-screen flex items-center justify-center"><p>Rapor tidak ditemukan</p></div>;
  }

  const student = report.students;

  const hasGrades = grades && grades.length > 0 && grades.some(
    (g) => g.knowledge_score !== null || g.skill_score !== null
  );

  if (!hasGrades) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-lg bg-white p-6 text-center">
          <CardHeader className="pb-2">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-3 animate-bounce">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-800">Nilai Rapor Belum Diisi</CardTitle>
            <CardDescription className="text-sm text-slate-500 mt-2 leading-relaxed">
              Rapor untuk <strong>{student?.full_name}</strong> belum memiliki input nilai mata pelajaran. Anda harus mengisi nilai terlebih dahulu sebelum dapat melihat pratinjau rapor.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3">
            <Button asChild className="bg-slate-950 hover:bg-slate-800 w-full shadow-md font-medium">
              <Link href={`/admin/report-cards/edit?id=${reportCardId}`}>
                <FileText className="mr-2 h-4 w-4" /> Input Nilai Sekarang
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-slate-200 text-slate-600 font-medium">
              <Link href="/admin/report-cards">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Rapor
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Open the PDF generator directly in a new tab
  const handleDownloadPDF = () => {
    window.open(`/api/report-cards/${reportCardId}/pdf?download=true`, '_blank');
  };

  // Triggers/re-triggers backend AI generation
  const handleRegenerateAI = async () => {
    if (stats && stats.completionRate < 50) {
      toast({ title: "Gagal Menjalankan AI", description: `Minimal 50% nilai harus diinput. Saat ini baru ${stats.completionRate}% lengkap.`, variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch(`/api/report-cards/${reportCardId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan analisa AI");
      setAiAppreciation(data.ai_report.appreciation || "");
      setAiRecommendation(data.ai_report.recommendation || "");
      // Save full AI report (including focus_areas) to DB immediately
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
      toast({ title: "Analisa AI Selesai", description: "Catatan dan fokus belajar berhasil diperbarui." });
    } catch (error: any) {
      toast({ title: "Analisa AI Gagal", description: error.message || "Terjadi kesalahan koneksi", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  // Auto-generate AI notes on first preview load if grades exist but no AI notes yet
  const autoAiTriggered = useRef(false);
  useEffect(() => {
    if (
      !autoAiTriggered.current &&
      report &&
      hasGrades &&
      !report.homeroom_notes &&
      stats &&
      stats.completionRate >= 50 &&
      !aiLoading
    ) {
      autoAiTriggered.current = true;
      handleRegenerateAI();
    }
  }, [report, hasGrades, stats, aiLoading]);

  // Save the modified notes back to the Supabase database
  const handleSaveAI = async () => {
    setSavingAi(true);
    try {
      const combinedNotes = JSON.stringify({
        appreciation: aiAppreciation,
        recommendation: aiRecommendation,
        focus_areas: focusAreas,
        strength_note: strengthNote,
        attendance_note: attendanceNote,
        semester_comparison: semesterComparison,
      });

      const { error } = await supabase
        .from("report_cards")
        .update({
          homeroom_notes: combinedNotes,
        })
        .eq("id", reportCardId);

      if (error) throw error;

      toast({
        title: "Catatan Rapor Berhasil Disimpan",
        description: "Catatan apresiasi dan rekomendasi telah disimpan ke rapor.",
      });

      // Refetch the preview info
      await queryClient.invalidateQueries({ queryKey: ["report-preview", reportCardId] });
      await queryClient.invalidateQueries({ queryKey: ["report-card", reportCardId] });
      
      // Increment pdfKey to force reload the iframe PDF
      setIframeLoaded(false);
      setPdfKey((prev) => prev + 1);
    } catch (error: any) {
      toast({
        title: "Gagal Menyimpan Catatan",
        description: error.message || "Terjadi kesalahan saat menyimpan",
        variant: "destructive",
      });
    } finally {
      setSavingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="icon" className="h-9 w-9">
              <Link href="/admin/report-cards"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-800 text-lg">Review & Cetak Rapor</h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5",
                    report.status === "draft"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : report.status === "finalized"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  )}
                >
                  {report.status === "draft" ? "Draft" : report.status === "finalized" ? "Final" : "Terkirim"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {student?.full_name} · Kelas {report.class_name} · Semester {report.semester}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9">
              <Link href={`/admin/report-cards/edit?id=${reportCardId}`}>
                <FileText className="mr-2 h-4 w-4" /> {report.status === "draft" ? "Edit Nilai" : "Lihat Nilai"}
              </Link>
            </Button>

            {report.status === "draft" && (
              <Button
                onClick={() => setFinalizeDialogOpen(true)}
                disabled={finalizeLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-200 h-9"
              >
                {finalizeLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Finalisasi
              </Button>
            )}
            
            <Button onClick={handleDownloadPDF} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9">
              <Download className="mr-2 h-4 w-4" /> Unduh PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: PDF Preview Iframe (2/3 width on desktop) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 flex flex-col min-h-[850px] relative">
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10 bg-slate-50 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
                <p className="text-sm font-medium text-slate-500">Memuat pratinjau rapor...</p>
                <p className="text-xs text-slate-400">Harap tunggu, PDF sedang di-render.</p>
              </div>
            )}
            <iframe
              src={`/api/report-cards/${reportCardId}/pdf?key=${pdfKey}`}
              className={cn("w-full flex-1 border-0 transition-opacity duration-500", iframeLoaded ? "opacity-100" : "opacity-0")}
              title={`Raport ${student?.full_name || 'Siswa'}`}
              onLoad={() => setIframeLoaded(true)}
            />
          </div>

          {/* Right Column: AI Analysis & Quick Stats (1/3 width on desktop) */}
          <div className="space-y-6">

            {/* 1. Quick Stats Card */}
            {stats && (
              <Card className="border-0 shadow-md bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-700">Statistik Belajar Siswa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Rata-rata Nilai</span>
                    <Badge variant="outline" className="font-bold text-violet-700 bg-violet-50 border-violet-200 text-sm">
                      {stats.overallAverage}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Progress Nilai</span>
                    <Badge variant="outline" className={cn(
                      "font-semibold text-xs",
                      stats.completionRate >= 50 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {stats.completedCount} / {stats.totalCount} Mapel ({stats.completionRate}%)
                    </Badge>
                  </div>

                  {/* Top Subjects */}
                  {stats.topSubjects.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                        Mata Pelajaran Terbaik
                      </span>
                      <div className="space-y-1.5">
                        {stats.topSubjects.map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-medium truncate max-w-[140px]">{s.name}</span>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px] px-1.5 py-0">
                              {s.average}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weak Subjects */}
                  {stats.weakSubjects.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                        <TrendingDown className="h-3 w-3 text-amber-600" />
                        Perlu Perhatian (&lt; 80)
                      </span>
                      <div className="space-y-1.5">
                        {stats.weakSubjects.slice(0, 3).map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-medium truncate max-w-[140px]">{s.name}</span>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px] px-1.5 py-0">
                              {s.average}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Good Notice */}
                  {stats.weakSubjects.length === 0 && stats.topSubjects.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
                        <span>🌟</span>
                        <span>Semua nilai di atas standar! Luar biasa!</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 2. AI Focus Areas Panel — actionable insights right after stats */}
            {(focusAreas.length > 0 || strengthNote) && (
              <Card className="border-0 shadow-md bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    Analisa AI — Fokus Belajar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AIFocusPanel focusAreas={focusAreas} strengthNote={strengthNote} />
                </CardContent>
              </Card>
            )}

            {/* 3. Semester Comparison Card */}
            {semesterComparison && (
              <Card className="border-0 shadow-md bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-cyan-600" />
                    Perbandingan Semester
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Semester Lalu</span>
                    <Badge variant="outline" className="font-bold text-slate-600 bg-slate-50 border-slate-200">
                      {semesterComparison.previous_average?.toFixed(1) ?? '-'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Trend</span>
                    <Badge variant="outline" className={cn(
                      "font-bold text-xs",
                      semesterComparison.trend === 'naik' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      semesterComparison.trend === 'turun' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    )}>
                      {semesterComparison.trend === 'naik' ? 'Naik' : semesterComparison.trend === 'turun' ? 'Turun' : 'Stabil'}
                    </Badge>
                  </div>
                  {semesterComparison.note && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                      {semesterComparison.note}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 4. Attendance Note Card */}
            {attendanceNote && (
              <Card className="border-0 shadow-md bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-amber-600" />
                    Catatan Kehadiran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">{attendanceNote}</p>
                </CardContent>
              </Card>
            )}

            {/* 5. Catatan Wali Kelas — textarea-first design, AI pre-fills content */}
            <Card className="border-0 shadow-md bg-white">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Edit className="h-4 w-4 text-slate-500" />
                  Catatan Wali Kelas
                </CardTitle>
                {report.status === "draft" && (
                  <Button
                    onClick={handleRegenerateAI}
                    disabled={aiLoading}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 font-semibold flex items-center gap-1"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {aiAppreciation || aiRecommendation ? "Regenerasi AI" : "Generate AI"}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {aiLoading && (
                  <div className="flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 p-3">
                    <Loader2 className="h-4 w-4 text-violet-600 animate-spin shrink-0" />
                    <p className="text-xs text-violet-700">AI sedang menganalisa nilai siswa...</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Apresiasi
                  </Label>
                  <Textarea
                    value={aiAppreciation}
                    onChange={(e) => setAiAppreciation(e.target.value)}
                    placeholder="Klik 'Generate AI' untuk membuat catatan apresiasi otomatis berdasarkan nilai siswa..."
                    disabled={report.status !== "draft" || savingAi || aiLoading}
                    className="h-28 text-xs leading-relaxed border-slate-200 focus:border-violet-500 focus:ring-violet-500 resize-none font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Rekomendasi
                  </Label>
                  <Textarea
                    value={aiRecommendation}
                    onChange={(e) => setAiRecommendation(e.target.value)}
                    placeholder="Klik 'Generate AI' untuk membuat rekomendasi otomatis..."
                    disabled={report.status !== "draft" || savingAi || aiLoading}
                    className="h-28 text-xs leading-relaxed border-slate-200 focus:border-violet-500 focus:ring-violet-500 resize-none font-sans"
                  />
                </div>

                {report.status === "draft" && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <p className="text-[9px] text-slate-400">
                      {aiAppreciation || aiRecommendation
                        ? "Hasil AI bisa diedit sebelum disimpan."
                        : "AI akan generate otomatis saat nilai minimal 50% terisi."}
                    </p>
                    <Button
                      onClick={() => handleSaveAI()}
                      disabled={savingAi || aiLoading}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs h-8 px-4"
                    >
                      {savingAi ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Simpan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>



      {/* Finalization Confirmation Dialog */}
      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-xl shadow-2xl p-6 border border-slate-100">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-800">Konfirmasi Finalisasi Rapor</DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Mengunci data rapor sehingga tidak dapat diubah kembali.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="my-4 text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin memfinalisasi rapor untuk <strong>{student?.full_name}</strong>?
            <br /><br />
            Setelah difinalisasi, status rapor akan berubah menjadi <strong className="text-blue-700 font-semibold">Final</strong> dan nilai pelajaran serta catatan wali kelas tidak dapat diubah atau diedit kembali.
          </div>

          {stats && stats.completionRate < 100 && (
            <div className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5 items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800">Peringatan: Nilai Belum Lengkap</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Saat ini progress nilai baru <strong>{stats.completionRate}%</strong> ({stats.completedCount} dari {stats.totalCount} mapel). Anda tetap dapat melanjutkan finalisasi, namun disarankan untuk melengkapi semua nilai terlebih dahulu.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setFinalizeDialogOpen(false)}
              disabled={finalizeLoading}
              className="text-slate-600 border-slate-200 font-medium"
            >
              Batal
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={finalizeLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-200"
            >
              {finalizeLoading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-4 w-4" />
              )}
              Ya, Finalisasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
