"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Award, Loader2, Trophy, Medal, TrendingUp, Users, Search, X, FileDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { staggerContainer, staggerItem, fadeInDown } from "@/components/ui/animated";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { semesterLabel } from "@/lib/semester-utils";

interface RankingEntry {
  report_card_id: string;
  student_id: string;
  full_name: string;
  nisn: string;
  gender: string;
  class_name: string;
  semester: string;
  academic_year_id: string;
  academic_year_name: string;
  average_score: number;
  rank_position: number;
  rank_total: number;
}

interface AcademicYear {
  id: string;
  year_name: string;
  is_active: boolean;
}

const PAGE_SIZE = 10;

const getRankStyle = (position: number) => {
  if (position === 1) return {
    icon: Trophy,
    badge: "bg-gradient-to-br from-amber-400 to-yellow-500 text-white border-0 shadow-md shadow-amber-200",
    podium: "from-amber-50 to-yellow-50 border-amber-200 shadow-lg shadow-amber-100/50",
    bar: "bg-amber-400",
  };
  if (position === 2) return {
    icon: Medal,
    badge: "bg-gradient-to-br from-slate-300 to-gray-400 text-white border-0 shadow-md shadow-slate-200",
    podium: "from-slate-50 to-gray-50 border-slate-200 shadow-lg shadow-slate-100/50",
    bar: "bg-slate-400",
  };
  if (position === 3) return {
    icon: Medal,
    badge: "bg-gradient-to-br from-orange-300 to-amber-500 text-white border-0 shadow-md shadow-orange-200",
    podium: "from-orange-50 to-amber-50 border-orange-200 shadow-lg shadow-orange-100/50",
    bar: "bg-orange-400",
  };
  return {
    icon: Award,
    badge: "bg-slate-50 text-slate-600 border-slate-200",
    podium: "",
    bar: "bg-slate-300",
  };
};

function downloadRankingPDF(
  className: string,
  entries: RankingEntry[],
  academicYearName: string,
  semesterStr: string
) {
  const rows = entries.map((e, i) => {
    const scoreColor =
      e.average_score >= 90 ? "#059669" :
      e.average_score >= 80 ? "#2563eb" :
      e.average_score >= 70 ? "#d97706" : "#dc2626";
    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="text-align:center; padding:8px; font-weight:600;">${e.rank_position}</td>
        <td style="padding:8px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${e.gender === "L" ? "#60a5fa" : "#f472b6"};display:inline-block;"></span>
            ${e.full_name}
          </div>
        </td>
        <td style="padding:8px; font-family:monospace; font-size:12px;">${e.nisn || "-"}</td>
        <td style="text-align:center; padding:8px; font-weight:700; color:${scoreColor};">${e.average_score}</td>
        <td style="text-align:center; padding:8px;">${e.rank_position} / ${e.rank_total}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Ranking ${className}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0891b2; padding-bottom: 20px; }
  .header h1 { font-size: 22px; margin: 0; }
  .header p { color: #64748b; margin: 4px 0; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #f8fafc; padding: 10px 8px; text-align: left; font-size: 13px; color: #475569; border-bottom: 2px solid #e2e8f0; }
  td { font-size: 14px; }
  .footer { margin-top: 30px; text-align: right; font-size: 12px; color: #94a3b8; }
  @media print { body { padding: 20px; } }
</style></head>
<body>
  <div class="header">
    <h1>Ranking Siswa - ${className}</h1>
    <p>${academicYearName} &bull; Semester ${semesterStr}</p>
    <p style="font-size:12px;">SDS Taman Harapan</p>
  </div>
  <table>
    <thead><tr>
      <th style="text-align:center;width:60px;">Rank</th>
      <th>Nama Siswa</th>
      <th style="width:120px;">NISN</th>
      <th style="text-align:center;width:100px;">Rata-rata</th>
      <th style="text-align:center;width:80px;">Posisi</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</div>
  <script>window.onload = () => window.print();</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export default function RankingsPage() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [pageMap, setPageMap] = useState<Record<string, number>>({});

  const academicYearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id, year_name, is_active")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AcademicYear[];
    },
    enabled: !!user,
  });

  const rankingsQuery = useQuery({
    queryKey: ["rankings", selectedClass, selectedSemester, selectedYear],
    queryFn: async () => {
      let query = supabase
        .from("class_rankings")
        .select("*")
        .order("class_name", { ascending: true })
        .order("rank_position", { ascending: true });

      if (selectedClass !== "all") {
        query = query.eq("class_name", selectedClass);
      }
      if (selectedSemester !== "all") {
        query = query.eq("semester", selectedSemester);
      }
      if (selectedYear !== "all") {
        query = query.eq("academic_year_id", selectedYear);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as RankingEntry[];
    },
    enabled: !!user,
  });

  const isInitialLoading = rankingsQuery.isLoading && academicYearsQuery.isLoading;

  const filteredRankings = useMemo(() => {
    const data = rankingsQuery.data ?? [];
    if (!searchQuery.trim()) return data;
    return data.filter((e) =>
      e.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rankingsQuery.data, searchQuery]);

  const classGroups = useMemo(() => {
    return filteredRankings.reduce((acc, entry) => {
      if (!acc[entry.class_name]) acc[entry.class_name] = [];
      acc[entry.class_name].push(entry);
      return acc;
    }, {} as Record<string, RankingEntry[]>);
  }, [filteredRankings]);

  const classOptions = useMemo(() => {
    const data = rankingsQuery.data ?? [];
    return Array.from(new Set(data.map((e) => e.class_name))).sort();
  }, [rankingsQuery.data]);

  const totalStudents = filteredRankings.length;
  const totalClasses = Object.keys(classGroups).length;
  const topScorer = filteredRankings.reduce(
    (best, e) => e.average_score > (best?.average_score ?? 0) ? e : best,
    null as RankingEntry | null
  );

  const activeFilters = [
    selectedClass !== "all" && { label: selectedClass, clear: () => setSelectedClass("all") },
    selectedSemester !== "all" && { label: selectedSemester, clear: () => setSelectedSemester("all") },
    selectedYear !== "all" && { label: academicYearsQuery.data?.find((y) => y.id === selectedYear)?.year_name ?? "", clear: () => setSelectedYear("all") },
    searchQuery && { label: `"${searchQuery}"`, clear: () => setSearchQuery("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const getPage = (className: string) => pageMap[className] ?? 1;
  const setPage = (className: string, page: number) => setPageMap((prev) => ({ ...prev, [className]: page }));

  const paginate = (entries: RankingEntry[], className: string) => {
    const page = getPage(className);
    const totalPages = Math.ceil(entries.length / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    return {
      items: entries.slice(start, start + PAGE_SIZE),
      page,
      totalPages,
    };
  };

  if (isInitialLoading) {
    return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat ranking..." /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        {/* Header */}
        <motion.div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" variants={fadeInDown}>
          <div>
            <p className="text-sm font-medium text-cyan-700">Akademik</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Ranking Siswa</h1>
            <p className="mt-2 text-muted-foreground">
              Peringkat siswa berdasarkan rata-rata nilai rapor per kelas dan semester.
            </p>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div className="grid gap-4 sm:grid-cols-3" variants={staggerItem}>
          <Card className="border-0 shadow-sm border-t-[3px] border-t-cyan-500">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Siswa</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">{totalStudents}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm border-t-[3px] border-t-emerald-500">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kelas Aktif</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">{totalClasses}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Award className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm border-t-[3px] border-t-amber-500">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nilai Tertinggi</p>
                <p className="mt-1 text-3xl font-bold text-slate-950">{topScorer?.average_score ?? "-"}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{topScorer?.full_name ?? "-"}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filter Bar */}
        <motion.div variants={staggerItem}>
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Semester Pill Toggle */}
                <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 shrink-0">
                  {[
                    { value: "all", label: "Semua" },
                    { value: "Ganjil", label: "Ganjil" },
                    { value: "Genap", label: "Genap" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedSemester(opt.value)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-md text-sm font-medium transition-all",
                        selectedSemester === opt.value
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                {/* Kelas Select — from actual ranking data */}
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[160px] shrink-0">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Tahun Select */}
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[160px] shrink-0">
                    <SelectValue placeholder="Semua Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {(academicYearsQuery.data ?? []).map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year_name}{year.is_active ? " (Aktif)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9 h-9"
                    placeholder="Cari nama siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filter Chips */}
              <AnimatePresence>
                {activeFilters.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-wrap gap-2 items-center overflow-hidden"
                  >
                    <span className="text-xs text-slate-400 font-medium">Filter aktif:</span>
                    {activeFilters.map((filter, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="gap-1 pr-1.5 bg-cyan-50 text-cyan-700 border-cyan-200 cursor-pointer hover:bg-cyan-100 transition-colors"
                        onClick={filter.clear}
                      >
                        {filter.label}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedClass("all");
                        setSelectedSemester("all");
                        setSelectedYear("all");
                        setSearchQuery("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 underline ml-1"
                    >
                      Reset semua
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rankings Display */}
        <motion.div variants={staggerItem} className="space-y-6">
          {rankingsQuery.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>Gagal memuat data ranking. Pastikan migration sudah dijalankan.</p>
            </div>
          )}

          {Object.keys(classGroups).length === 0 && !rankingsQuery.isLoading ? (
            <Card className="border-0 bg-white shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">Belum ada data ranking</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                  Ranking akan muncul otomatis setelah rapor siswa diisi dengan nilai dan difinalisasi.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(classGroups).map(([className, entries]) => {
              const top3 = entries.filter((e) => e.rank_position <= 3);
              const showPodium = selectedClass !== "all" && top3.length >= 2;
              const semLabel = semesterLabel(entries[0]?.semester);
              const yearName = entries[0]?.academic_year_name ?? "";
              const { items, page, totalPages } = paginate(entries, className);
              const showAll = totalPages <= 1;

              return (
                <Card key={className} className="border-0 bg-white shadow-sm overflow-hidden">
                  {/* Class Header */}
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 font-semibold">
                        {className}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {yearName} &middot; Semester {semLabel}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {entries.length} siswa
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto gap-1.5 text-xs"
                        onClick={() => downloadRankingPDF(className, entries, yearName, semLabel)}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Unduh PDF
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {/* Podium */}
                    {showPodium && top3.length > 0 && (
                      <div className="p-6 bg-gradient-to-b from-slate-50/50 to-white border-b border-slate-100">
                        <div className="flex items-end justify-center gap-3">
                          {top3.find((e) => e.rank_position === 2) && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                              className={cn("flex flex-col items-center p-4 rounded-xl border bg-gradient-to-b w-full max-w-[140px]", getRankStyle(2).podium)}>
                              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center mb-2", getRankStyle(2).badge)}>
                                <Medal className="h-4 w-4" />
                              </div>
                              <p className="text-xs text-slate-400 font-semibold">2</p>
                              <p className="font-semibold text-sm text-center truncate w-full">{top3.find((e) => e.rank_position === 2)?.full_name}</p>
                              <p className="text-lg font-bold text-slate-700 mt-1">{top3.find((e) => e.rank_position === 2)?.average_score}</p>
                            </motion.div>
                          )}
                          {top3.find((e) => e.rank_position === 1) && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                              className={cn("flex flex-col items-center p-5 rounded-xl border bg-gradient-to-b w-full max-w-[160px] scale-105", getRankStyle(1).podium)}>
                              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center mb-2", getRankStyle(1).badge)}>
                                <Trophy className="h-5 w-5" />
                              </div>
                              <p className="text-xs text-amber-500 font-semibold">JUARA 1</p>
                              <p className="font-bold text-base text-center truncate w-full">{top3.find((e) => e.rank_position === 1)?.full_name}</p>
                              <p className="text-2xl font-bold text-amber-600 mt-1">{top3.find((e) => e.rank_position === 1)?.average_score}</p>
                            </motion.div>
                          )}
                          {top3.find((e) => e.rank_position === 3) && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                              className={cn("flex flex-col items-center p-4 rounded-xl border bg-gradient-to-b w-full max-w-[140px]", getRankStyle(3).podium)}>
                              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center mb-2", getRankStyle(3).badge)}>
                                <Medal className="h-4 w-4" />
                              </div>
                              <p className="text-xs text-orange-400 font-semibold">3</p>
                              <p className="font-semibold text-sm text-center truncate w-full">{top3.find((e) => e.rank_position === 3)?.full_name}</p>
                              <p className="text-lg font-bold text-orange-600 mt-1">{top3.find((e) => e.rank_position === 3)?.average_score}</p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Table */}
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-16 text-center">Rank</TableHead>
                          <TableHead>Nama Siswa</TableHead>
                          <TableHead className="hidden sm:table-cell">NISN</TableHead>
                          <TableHead className="text-center w-36">Rata-rata</TableHead>
                          <TableHead className="text-center w-20">Posisi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankingsQuery.isLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-20 text-center">
                              <Loader2 className="mx-auto h-5 w-5 animate-spin text-cyan-600" />
                            </TableCell>
                          </TableRow>
                        ) : (
                          (showAll ? entries : items).map((entry, idx) => {
                            const style = getRankStyle(entry.rank_position);
                            const scoreWidth = Math.min((entry.average_score / 100) * 100, 100);
                            return (
                              <TableRow
                                key={entry.report_card_id}
                                className={cn(
                                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/50",
                                  entry.rank_position <= 3 && "!bg-amber-50/20"
                                )}
                              >
                                <TableCell className="text-center">
                                  <div className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold", style.badge)}>
                                    {entry.rank_position <= 3 ? <style.icon className="h-4 w-4" /> : entry.rank_position}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={cn("h-2 w-2 rounded-full shrink-0", entry.gender === "L" ? "bg-blue-400" : "bg-pink-400")} />
                                    <span className="font-semibold truncate">{entry.full_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">{entry.nisn}</TableCell>
                                <TableCell className="text-center">
                                  <div className="space-y-1">
                                    <span className={cn("font-bold text-lg",
                                      entry.average_score >= 90 ? "text-emerald-600" :
                                      entry.average_score >= 80 ? "text-blue-600" :
                                      entry.average_score >= 70 ? "text-amber-600" : "text-red-600"
                                    )}>{entry.average_score}</span>
                                    <div className="h-1 w-full max-w-[80px] mx-auto rounded-full bg-slate-100">
                                      <div className={cn("h-full rounded-full transition-all", style.bar)} style={{ width: `${scoreWidth}%` }} />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="font-semibold">{entry.rank_position}</span>
                                  <span className="text-muted-foreground text-sm"> / {entry.rank_total}</span>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {!showAll && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                        <p className="text-xs text-muted-foreground">
                          Menampilkan {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, entries.length)} dari {entries.length} siswa
                        </p>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage(className, page - 1)}>
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setPage(className, p)}>
                              {p}
                            </Button>
                          ))}
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage(className, page + 1)}>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
