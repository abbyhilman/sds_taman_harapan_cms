"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Plus, Trash2, Check, Settings, Eye, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from "@/components/ui/animated";
import { PageLoading } from "@/components/ui/loading";

interface RaportTemplate {
  id: string;
  name: string;
  description: string;
  file_url: string;
  file_name: string;
  page_count: number;
  status: "draft" | "configured" | "active" | "archived";
  is_default: boolean;
  created_at: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "border-slate-200 bg-slate-50 text-slate-700" },
  configured: { label: "Terkonfigurasi", className: "border-blue-200 bg-blue-50 text-blue-700" },
  active: { label: "Aktif", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  archived: { label: "Diarsipkan", className: "border-amber-200 bg-amber-50 text-amber-700" },
};

export default function RaportTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["raport-templates"],
    queryFn: async () => {
      const res = await fetch("/api/raport-templates");
      if (!res.ok) throw new Error("Gagal memuat template");
      const json = await res.json();
      return json.data as RaportTemplate[];
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/raport-templates/${id}/activate`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengaktifkan template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raport-templates"] });
      toast({ title: "Template diaktifkan", description: "Template kini aktif untuk generate raport." });
    },
    onError: (err: Error) => toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/raport-templates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raport-templates"] });
      toast({ title: "Template dihapus", description: "Template berhasil dihapus." });
    },
    onError: (err: Error) => toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  const handleUpload = async () => {
    if (!selectedFile || !templateName.trim()) {
      toast({ title: "Error", description: "Nama dan file template wajib diisi", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", templateName.trim());
      formData.append("description", templateDesc.trim());

      const res = await fetch("/api/raport-templates", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal upload template");
      }

      await queryClient.invalidateQueries({ queryKey: ["raport-templates"] });
      toast({ title: "Berhasil", description: "Template berhasil diupload." });
      setDialogOpen(false);
      setTemplateName("");
      setTemplateDesc("");
      setSelectedFile(null);
    } catch (err: any) {
      toast({ title: "Gagal Upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat template raport..." /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Manajemen Template Raport</h1>
            <p className="mt-2 text-sm text-slate-500">Upload dan kelola template PDF untuk generate raport digital.</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-950 hover:bg-slate-800">
                <Plus className="mr-2 h-4 w-4" /> Upload Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Template Raport</DialogTitle>
                <DialogDescription>Upload file PDF template raport baru (maksimal 10MB).</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Template</Label>
                  <Input placeholder="Contoh: Template Raport 2026" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi (opsional)</Label>
                  <Textarea placeholder="Deskripsi singkat tentang template ini..." value={templateDesc} onChange={(e) => setTemplateDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>File PDF Template</Label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      selectedFile ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                    )}
                    onClick={() => document.getElementById("template-file-input")?.click()}
                  >
                    <input
                      id="template-file-input"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    {selectedFile ? (
                      <div className="space-y-1">
                        <FileText className="mx-auto h-8 w-8 text-emerald-600" />
                        <p className="text-sm font-medium text-emerald-700">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="text-sm text-slate-500">Klik untuk pilih file PDF</p>
                        <p className="text-xs text-slate-400">Maksimal 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                <Button onClick={handleUpload} disabled={uploading || !selectedFile || !templateName.trim()}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Template Grid */}
        <motion.div variants={fadeInUp}>
          {templates.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50 p-8 text-center">
                <FileText className="mb-3 h-10 w-10 text-cyan-700" />
                <h2 className="text-lg font-semibold text-slate-950">Belum ada template</h2>
                <p className="mt-2 max-w-md text-sm text-slate-500">Upload template PDF raport pertama Anda untuk mulai menggunakannya.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template, index) => {
                const cfg = statusConfig[template.status] || statusConfig.draft;
                return (
                  <motion.div
                    key={template.id}
                    variants={staggerItem}
                    whileHover={{ y: -2 }}
                    className="transition-shadow"
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50">
                              <FileText className="h-5 w-5 text-cyan-700" />
                            </div>
                            <div>
                              <CardTitle className="text-base leading-tight">{template.name}</CardTitle>
                              <CardDescription className="mt-0.5">{template.page_count} halaman</CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn("text-xs font-medium shrink-0", cfg.className)}>
                            {cfg.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {template.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">{template.description}</p>
                        )}
                        {template.is_default && (
                          <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700 text-xs">
                            Default
                          </Badge>
                        )}
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.location.href = `/admin/raport-templates/configure?id=${template.id}`}
                          >
                            <Settings className="h-3.5 w-3.5 mr-1" />
                            Konfigurasi
                          </Button>
                          {template.status !== "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => activateMutation.mutate(template.id)}
                              disabled={activateMutation.isPending}
                            >
                              {activateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                              Aktifkan
                            </Button>
                          )}
                          {template.status !== "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                if (confirm(`Hapus template "${template.name}"?`)) {
                                  deleteMutation.mutate(template.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
