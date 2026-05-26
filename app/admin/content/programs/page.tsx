"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, BookOpen, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { PageLoading } from "@/components/ui/loading";
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from "@/components/ui/animated";

interface Program {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  image_url: string;
  category: string;
  order_position: number;
}

const categoryLabels: Record<string, string> = {
  academic: "Akademik",
  extracurricular: "Ekstrakurikuler",
  character: "Karakter",
  study_tour: "Study Tour",
};

export default function ProgramsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ name: "", description: "", icon_url: "", image_url: "", category: "academic", order_position: 0 });

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").order("order_position", { ascending: true });
      if (error) throw error;
      return data as Program[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (editingProgram) {
        const { error } = await supabase.from("programs").update({ ...formData, updated_at: new Date().toISOString() }).eq("id", editingProgram.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("programs").insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast({ title: "Berhasil", description: `Program berhasil ${editingProgram ? "diperbarui" : "ditambahkan"}` });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast({ title: "Berhasil", description: "Program berhasil dihapus" });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "icon_url" | "image_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `program-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("images").upload(`programs/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(`programs/${fileName}`);
      setFormData({ ...formData, [field]: publicUrl });
      toast({ title: "Berhasil", description: "Gambar berhasil diunggah" });
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Upload gagal", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({ name: program.name, description: program.description, icon_url: program.icon_url, image_url: program.image_url, category: program.category, order_position: program.order_position });
    setDialogOpen(true);
  };

  const resetForm = () => { setFormData({ name: "", description: "", icon_url: "", image_url: "", category: "academic", order_position: 0 }); setEditingProgram(null); };

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat program unggulan..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-cyan-600" /> Program Unggulan
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola program akademik dan ekstrakurikuler ({programs.length}/4 program)</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            if (open && !editingProgram && programs.length >= 4) {
              toast({ title: "Batas Tercapai", description: "Maksimal hanya boleh 4 program unggulan.", variant: "destructive" });
              return;
            }
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-950 hover:bg-slate-800" disabled={programs.length >= 4}><Plus className="mr-2 h-4 w-4" /> Tambah Program</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingProgram ? "Edit Program" : "Tambah Program Baru"}</DialogTitle>
                <DialogDescription>Isi detail program unggulan sekolah</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <Label>Nama Program</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama program..." className="mt-2" />
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi program..." className="mt-2" rows={3} />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Akademik</SelectItem>
                      <SelectItem value="extracurricular">Ekstrakurikuler</SelectItem>
                      <SelectItem value="character">Karakter</SelectItem>
                      <SelectItem value="study_tour">Study Tour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gambar Program</Label>
                  {formData.image_url ? (
                    <div className="relative mt-2">
                      <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                      <Button size="sm" variant="secondary" className="absolute bottom-2 right-2" onClick={() => setFormData({ ...formData, image_url: "" })}>Ganti</Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                        <span className="mt-1 text-xs text-slate-500">Upload gambar</span>
                      </Label>
                      <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "image_url")} />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Urutan</Label>
                  <Input type="number" value={formData.order_position} onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) || 0 })} className="mt-2" />
                </div>
                <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !formData.name} className="w-full">
                  {submitMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Programs Grid */}
        {programs.length === 0 ? (
          <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold">Belum ada program</h3>
            <p className="text-sm text-muted-foreground mt-1">Tambahkan program unggulan pertama</p>
          </motion.div>
        ) : (
          <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" variants={staggerContainer}>
            {programs.map((program) => (
              <motion.div key={program.id} variants={staggerItem} whileHover={{ y: -4 }}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow h-full flex flex-col">
                  <div className="relative h-40 bg-slate-100">
                    {program.image_url ? (
                      <img src={program.image_url} alt={program.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-12 w-12 text-slate-300" /></div>
                    )}
                    <Badge className="absolute top-2 right-2" variant="secondary">{categoryLabels[program.category] || program.category}</Badge>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold">{program.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{program.description || "Tanpa deskripsi"}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(program)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(program.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
