"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Save, Eye, Loader2, Plus, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PageConfig, FieldPositions, FieldPosition } from "@/lib/raport-pdf-config";

const PAGE_ROLES = [
  { value: "none", label: "Tidak Digunakan" },
  { value: "cover", label: "Cover (Halaman Depan)" },
  { value: "profile", label: "Profil Siswa" },
  { value: "kelas_1_ganjil", label: "Nilai - Kelas 1 Ganjil" },
  { value: "kelas_1_genap", label: "Nilai - Kelas 1 Genap" },
  { value: "kelas_2_ganjil", label: "Nilai - Kelas 2 Ganjil" },
  { value: "kelas_2_genap", label: "Nilai - Kelas 2 Genap" },
  { value: "kelas_3_ganjil", label: "Nilai - Kelas 3 Ganjil" },
  { value: "kelas_3_genap", label: "Nilai - Kelas 3 Genap" },
  { value: "kelas_4_ganjil", label: "Nilai - Kelas 4 Ganjil" },
  { value: "kelas_4_genap", label: "Nilai - Kelas 4 Genap" },
  { value: "kelas_5_ganjil", label: "Nilai - Kelas 5 Ganjil" },
  { value: "kelas_5_genap", label: "Nilai - Kelas 5 Genap" },
  { value: "kelas_6_ganjil", label: "Nilai - Kelas 6 Ganjil" },
  { value: "kelas_6_genap", label: "Nilai - Kelas 6 Genap" },
  { value: "prestasi", label: "Prestasi" },
];

function getRoleForPage(pageIndex: number, pageConfig: PageConfig): string {
  if (pageIndex === pageConfig.cover_page) return "cover";
  if (pageIndex === pageConfig.profile_page) return "profile";
  if (pageIndex === pageConfig.prestasi_page) return "prestasi";
  for (const [key, idx] of Object.entries(pageConfig.grade_pages)) {
    if (idx === pageIndex) return key;
  }
  return "none";
}

function FieldPositionEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { x: number; y: number; font_size?: number; font_style?: 'regular' | 'bold' };
  onChange: (v: { x: number; y: number; font_size?: number; font_style?: 'regular' | 'bold' }) => void;
}) {
  return (
    <div className="space-y-1.5 py-2 border-b border-slate-100 last:border-0">
      <Label className="text-xs font-medium text-slate-600">{label}</Label>
      <div className="grid grid-cols-4 gap-1.5">
        <div>
          <Label className="text-[10px] text-slate-400">X</Label>
          <Input
            type="number"
            value={value.x}
            onChange={(e) => onChange({ ...value, x: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-slate-400">Y</Label>
          <Input
            type="number"
            step="0.1"
            value={value.y}
            onChange={(e) => onChange({ ...value, y: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-slate-400">Size</Label>
          <Input
            type="number"
            step="0.5"
            value={value.font_size ?? 9.5}
            onChange={(e) => onChange({ ...value, font_size: Number(e.target.value) })}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-slate-400">Style</Label>
          <Select
            value={value.font_style || "regular"}
            onValueChange={(v) => onChange({ ...value, font_style: v as 'regular' | 'bold' })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export default function ConfigureTemplatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const templateId = searchParams.get("id");

  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [fieldPositions, setFieldPositions] = useState<FieldPositions | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const { data: template, isLoading } = useQuery({
    queryKey: ["raport-template", templateId],
    queryFn: async () => {
      const res = await fetch(`/api/raport-templates/${templateId}`);
      if (!res.ok) throw new Error("Gagal memuat template");
      return res.json();
    },
    enabled: !!templateId,
  });

  const initConfig = useCallback(() => {
    if (!template?.data) return;
    const t = template.data;
    setPageConfig(t.page_config || { cover_page: 0, profile_page: 4, grade_pages: {}, prestasi_page: 21 });
    setFieldPositions(t.field_positions || null);
  }, [template]);

  if (template?.data && !pageConfig) {
    initConfig();
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/raport-templates/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_config: pageConfig, field_positions: fieldPositions }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan");
      }
      return res.json();
    },
    onSuccess: () => toast({ title: "Tersimpan", description: "Konfigurasi template berhasil disimpan." }),
    onError: (err: Error) => toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  const handlePageRoleChange = (pageIndex: number, newRole: string) => {
    if (!pageConfig) return;
    const updated = { ...pageConfig, grade_pages: { ...pageConfig.grade_pages } };

    if (newRole === "cover") updated.cover_page = pageIndex;
    else if (newRole === "profile") updated.profile_page = pageIndex;
    else if (newRole === "prestasi") updated.prestasi_page = pageIndex;
    else if (newRole !== "none") {
      updated.grade_pages[newRole] = pageIndex;
    }

    setPageConfig(updated);
  };

  const addSubjectRow = () => {
    if (!fieldPositions) return;
    const code = `NEW_${Date.now().toString(36).toUpperCase()}`;
    setFieldPositions({
      ...fieldPositions,
      grade_page: {
        ...fieldPositions.grade_page,
        subjects: {
          ...fieldPositions.grade_page.subjects,
          [code]: { row_y: 400 },
        },
      },
    });
  };

  const removeSubjectRow = (code: string) => {
    if (!fieldPositions) return;
    const subjects = { ...fieldPositions.grade_page.subjects };
    delete subjects[code];
    setFieldPositions({
      ...fieldPositions,
      grade_page: { ...fieldPositions.grade_page, subjects },
    });
  };

  const updateFieldPosition = (
    section: keyof FieldPositions,
    fieldKey: string,
    value: Partial<FieldPosition>
  ) => {
    if (!fieldPositions) return;
    const sectionData = fieldPositions[section] as any;
    setFieldPositions({
      ...fieldPositions,
      [section]: {
        ...sectionData,
        [fieldKey]: { ...sectionData[fieldKey], ...value },
      },
    });
  };

  if (!templateId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-500">Template ID tidak ditemukan di URL.</p>
      </div>
    );
  }

  if (isLoading || !template?.data || !pageConfig || !fieldPositions) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const t = template.data;
  const pageCount = t.page_count || 22;
  const pages = Array.from({ length: pageCount }, (_, i) => i);

  return (
    <div className="h-screen flex flex-col bg-[#f8fbff]">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/raport-templates")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-700" />
            <h1 className="font-semibold text-slate-950">{t.name}</h1>
            <Badge variant="outline" className="text-xs">{t.page_count} halaman</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPreviewKey((k) => k + 1);
              window.open(`/api/raport-templates/${templateId}/preview`, "_blank");
            }}
          >
            <Eye className="h-4 w-4 mr-1" /> Test Generate
          </Button>
          <Button
            size="sm"
            className="bg-slate-950 hover:bg-slate-800"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Simpan
          </Button>
        </div>
      </div>

      {/* Main Content - 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Page List */}
        <div className="w-60 border-r bg-white overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b bg-slate-50">
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Daftar Halaman</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {pages.map((pageIdx) => {
                const role = getRoleForPage(pageIdx, pageConfig);
                const isAssigned = role !== "none";
                return (
                  <div
                    key={pageIdx}
                    className={cn(
                      "rounded-lg border p-2 transition-colors",
                      isAssigned ? "border-cyan-200 bg-cyan-50/50" : "border-slate-100 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 h-4",
                          isAssigned ? "border-cyan-300 bg-cyan-100 text-cyan-700" : "text-slate-400"
                        )}
                      >
                        P.{pageIdx + 1}
                      </Badge>
                    </div>
                    <Select
                      value={role}
                      onValueChange={(v) => handlePageRoleChange(pageIdx, v)}
                    >
                      <SelectTrigger className="h-6 text-[11px] px-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value} className="text-xs">
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Center - PDF Preview */}
        <div className="flex-1 bg-slate-100 overflow-hidden">
          <iframe
            key={previewKey}
            src={`/api/raport-templates/${templateId}/preview`}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        </div>

        {/* Right Panel - Field Mapping */}
        <div className="w-80 border-l bg-white overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b bg-slate-50">
            <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Mapping Field</h2>
          </div>
          <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={["grade-header", "subjects"]} className="px-3">
              {/* Cover Page Fields */}
              <AccordionItem value="cover">
                <AccordionTrigger className="text-sm font-medium py-2">Cover Page</AccordionTrigger>
                <AccordionContent className="space-y-0">
                  <FieldPositionEditor
                    label="Nama Siswa"
                    value={fieldPositions.cover_page.student_name}
                    onChange={(v) => updateFieldPosition("cover_page", "student_name", v)}
                  />
                  <FieldPositionEditor
                    label="NIS"
                    value={fieldPositions.cover_page.nis}
                    onChange={(v) => updateFieldPosition("cover_page", "nis", v)}
                  />
                  <FieldPositionEditor
                    label="NISN"
                    value={fieldPositions.cover_page.nisn}
                    onChange={(v) => updateFieldPosition("cover_page", "nisn", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Grade Page - Header */}
              <AccordionItem value="grade-header">
                <AccordionTrigger className="text-sm font-medium py-2">Nilai - Header</AccordionTrigger>
                <AccordionContent className="space-y-0">
                  <FieldPositionEditor
                    label="Nama Siswa"
                    value={fieldPositions.grade_page.student_name}
                    onChange={(v) => updateFieldPosition("grade_page", "student_name", v)}
                  />
                  <FieldPositionEditor
                    label="Kelas"
                    value={fieldPositions.grade_page.class_name}
                    onChange={(v) => updateFieldPosition("grade_page", "class_name", v)}
                  />
                  <FieldPositionEditor
                    label="NISN"
                    value={fieldPositions.grade_page.nisn}
                    onChange={(v) => updateFieldPosition("grade_page", "nisn", v)}
                  />
                  <FieldPositionEditor
                    label="Semester"
                    value={fieldPositions.grade_page.semester}
                    onChange={(v) => updateFieldPosition("grade_page", "semester", v)}
                  />
                  <FieldPositionEditor
                    label="Nama Sekolah"
                    value={fieldPositions.grade_page.school_name}
                    onChange={(v) => updateFieldPosition("grade_page", "school_name", v)}
                  />
                  <FieldPositionEditor
                    label="Alamat Sekolah"
                    value={fieldPositions.grade_page.school_address}
                    onChange={(v) => updateFieldPosition("grade_page", "school_address", v)}
                  />
                  <FieldPositionEditor
                    label="Tahun Ajaran"
                    value={fieldPositions.grade_page.academic_year}
                    onChange={(v) => updateFieldPosition("grade_page", "academic_year", v)}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Grade Page - Subjects */}
              <AccordionItem value="subjects">
                <AccordionTrigger className="text-sm font-medium py-2">
                  Nilai - Mata Pelajaran
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {Object.entries(fieldPositions.grade_page.subjects).map(([code, pos]) => (
                      <div key={code} className="flex items-center gap-1 py-1 border-b border-slate-100">
                        <div className="flex-1">
                          <Label className="text-[10px] text-slate-500 font-mono">{code}</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={pos.row_y}
                            onChange={(e) => {
                              const subjects = { ...fieldPositions.grade_page.subjects };
                              subjects[code] = { row_y: Number(e.target.value) };
                              setFieldPositions({
                                ...fieldPositions,
                                grade_page: { ...fieldPositions.grade_page, subjects },
                              });
                            }}
                            className="h-6 text-xs mt-0.5"
                            placeholder="Y position"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-rose-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                          onClick={() => removeSubjectRow(code)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs mt-2"
                      onClick={addSubjectRow}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Tambah Mapel
                    </Button>
                  </div>

                  {/* KKM and Mulok settings */}
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div>
                      <Label className="text-[10px] text-slate-500">KKM</Label>
                      <Input
                        type="number"
                        value={fieldPositions.grade_page.kkm}
                        onChange={(e) =>
                          setFieldPositions({
                            ...fieldPositions,
                            grade_page: { ...fieldPositions.grade_page, kkm: Number(e.target.value) },
                          })
                        }
                        className="h-6 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500">Mulok Start Y</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={fieldPositions.grade_page.mulok_start_y}
                          onChange={(e) =>
                            setFieldPositions({
                              ...fieldPositions,
                              grade_page: { ...fieldPositions.grade_page, mulok_start_y: Number(e.target.value) },
                            })
                          }
                          className="h-6 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Mulok Spacing</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={fieldPositions.grade_page.mulok_row_spacing}
                          onChange={(e) =>
                            setFieldPositions({
                              ...fieldPositions,
                              grade_page: { ...fieldPositions.grade_page, mulok_row_spacing: Number(e.target.value) },
                            })
                          }
                          className="h-6 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-slate-500">Max Mulok Rows</Label>
                      <Input
                        type="number"
                        value={fieldPositions.grade_page.max_mulok_rows}
                        onChange={(e) =>
                          setFieldPositions({
                            ...fieldPositions,
                            grade_page: { ...fieldPositions.grade_page, max_mulok_rows: Number(e.target.value) },
                          })
                        }
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Grade Page - Other */}
              <AccordionItem value="grade-other">
                <AccordionTrigger className="text-sm font-medium py-2">Nilai - Lainnya</AccordionTrigger>
                <AccordionContent className="space-y-0">
                  <FieldPositionEditor
                    label="Rata-rata"
                    value={fieldPositions.grade_page.average_y ? { x: 402, y: fieldPositions.grade_page.average_y, font_size: 9.5, font_style: "bold" } : { x: 402, y: 493.6, font_size: 9.5, font_style: "bold" }}
                    onChange={(v) => setFieldPositions({ ...fieldPositions, grade_page: { ...fieldPositions.grade_page, average_y: v.y } })}
                  />
                  <div className="grid grid-cols-3 gap-1.5 py-2 border-b border-slate-100">
                    <div>
                      <Label className="text-[10px] text-slate-400">Rank X</Label>
                      <Input
                        type="number"
                        value={fieldPositions.grade_page.rank_position_x}
                        onChange={(e) => setFieldPositions({ ...fieldPositions, grade_page: { ...fieldPositions.grade_page, rank_position_x: Number(e.target.value) } })}
                        className="h-6 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-slate-400">Total X</Label>
                      <Input
                        type="number"
                        value={fieldPositions.grade_page.rank_total_x}
                        onChange={(e) => setFieldPositions({ ...fieldPositions, grade_page: { ...fieldPositions.grade_page, rank_total_x: Number(e.target.value) } })}
                        className="h-6 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-slate-400">Rank Y</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={fieldPositions.grade_page.rank_y}
                        onChange={(e) => setFieldPositions({ ...fieldPositions, grade_page: { ...fieldPositions.grade_page, rank_y: Number(e.target.value) } })}
                        className="h-6 text-xs"
                      />
                    </div>
                  </div>
                  <FieldPositionEditor
                    label="Tanggal"
                    value={fieldPositions.grade_page.date}
                    onChange={(v) => updateFieldPosition("grade_page", "date", v)}
                  />
                  <FieldPositionEditor
                    label="Nama Ortu"
                    value={fieldPositions.grade_page.parent_name}
                    onChange={(v) => updateFieldPosition("grade_page", "parent_name", v)}
                  />
                  <FieldPositionEditor
                    label="Wali Kelas"
                    value={fieldPositions.grade_page.homeroom_label}
                    onChange={(v) => updateFieldPosition("grade_page", "homeroom_label", v)}
                  />
                  {/* Personality Values */}
                  <div className="pt-2 border-t border-slate-100 mt-2 space-y-1.5">
                    <Label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Kepribadian</Label>
                    {fieldPositions.grade_page.personality.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Label className="text-[10px] text-slate-400 w-24 shrink-0 truncate">{p.label}</Label>
                        <Input
                          value={p.value}
                          onChange={(e) => {
                            const personality = [...fieldPositions.grade_page.personality];
                            personality[idx] = { ...personality[idx], value: e.target.value };
                            setFieldPositions({ ...fieldPositions, grade_page: { ...fieldPositions.grade_page, personality } });
                          }}
                          className="h-6 text-xs flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Profile Page */}
              <AccordionItem value="profile">
                <AccordionTrigger className="text-sm font-medium py-2">Profil Siswa</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {fieldPositions.profile_page.fields.map((field, idx) => (
                      <div key={idx} className="py-1.5 border-b border-slate-100 last:border-0">
                        <Label className="text-[10px] text-slate-500 font-mono">{field.key}</Label>
                        <div className="grid grid-cols-4 gap-1 mt-0.5">
                          <Input
                            type="number"
                            value={field.x}
                            onChange={(e) => {
                              const fields = [...fieldPositions.profile_page.fields];
                              fields[idx] = { ...field, x: Number(e.target.value) };
                              setFieldPositions({
                                ...fieldPositions,
                                profile_page: { ...fieldPositions.profile_page, fields },
                              });
                            }}
                            className="h-6 text-xs"
                            placeholder="X"
                          />
                          <Input
                            type="number"
                            step="0.1"
                            value={field.y}
                            onChange={(e) => {
                              const fields = [...fieldPositions.profile_page.fields];
                              fields[idx] = { ...field, y: Number(e.target.value) };
                              setFieldPositions({
                                ...fieldPositions,
                                profile_page: { ...fieldPositions.profile_page, fields },
                              });
                            }}
                            className="h-6 text-xs"
                            placeholder="Y"
                          />
                          <Input
                            type="number"
                            step="0.5"
                            value={field.font_size}
                            onChange={(e) => {
                              const fields = [...fieldPositions.profile_page.fields];
                              fields[idx] = { ...field, font_size: Number(e.target.value) };
                              setFieldPositions({
                                ...fieldPositions,
                                profile_page: { ...fieldPositions.profile_page, fields },
                              });
                            }}
                            className="h-6 text-xs"
                            placeholder="Size"
                          />
                          <Select
                            value={field.font_style}
                            onValueChange={(v) => {
                              const fields = [...fieldPositions.profile_page.fields];
                              fields[idx] = { ...field, font_style: v };
                              setFieldPositions({
                                ...fieldPositions,
                                profile_page: { ...fieldPositions.profile_page, fields },
                              });
                            }}
                          >
                            <SelectTrigger className="h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regular">R</SelectItem>
                              <SelectItem value="bold">B</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Prestasi Page */}
              <AccordionItem value="prestasi">
                <AccordionTrigger className="text-sm font-medium py-2">Prestasi</AccordionTrigger>
                <AccordionContent className="space-y-0">
                  <FieldPositionEditor
                    label="Nama Siswa"
                    value={fieldPositions.prestasi_page.student_name}
                    onChange={(v) => updateFieldPosition("prestasi_page", "student_name", v)}
                  />
                  <FieldPositionEditor
                    label="Nama Sekolah"
                    value={fieldPositions.prestasi_page.school_name}
                    onChange={(v) => updateFieldPosition("prestasi_page", "school_name", v)}
                  />
                  <FieldPositionEditor
                    label="NISN"
                    value={fieldPositions.prestasi_page.nisn}
                    onChange={(v) => updateFieldPosition("prestasi_page", "nisn", v)}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
