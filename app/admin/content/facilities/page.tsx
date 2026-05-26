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
import { Plus, Pencil, Trash2, Building2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { PageLoading } from "@/components/ui/loading";
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from "@/components/ui/animated";

interface Facility { id: string; name: string; description: string; image_url: string; icon: string; order_position: number; }

export default function FacilitiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", description: "", image_url: "", icon: "", order_position: 0 });

  const { data: facilities = [], isLoading } = useQuery({
    queryKey: ["facilities"],
    queryFn: async () => { const { data, error } = await supabase.from("facilities").select("*").order("order_position", { ascending: true }); if (error) throw error; return data as Facility[]; },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (editingFacility) {
        const { error } = await supabase.from("facilities").update({ ...formData, updated_at: new Date().toISOString() }).eq("id", editingFacility.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("facilities").insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["facilities"] }); toast({ title: "Berhasil", description: `Fasilitas berhasil ${editingFacility ? "diperbarui" : "ditambahkan"}` }); setDialogOpen(false); resetForm(); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("facilities").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["facilities"] }); toast({ title: "Berhasil", description: "Fasilitas berhasil dihapus" }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `facility-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("images").upload(`facilities/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(`facilities/${fileName}`);
      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: "Berhasil", description: "Gambar berhasil diunggah" });
    } catch (error: unknown) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Upload gagal", variant: "destructive" });
    } finally { setUploading(false); }
  };

  const handleEdit = (facility: Facility) => { setEditingFacility(facility); setFormData({ name: facility.name, description: facility.description, image_url: facility.image_url, icon: facility.icon, order_position: facility.order_position }); setDialogOpen(true); };
  const resetForm = () => { setFormData({ name: "", description: "", image_url: "", icon: "", order_position: 0 }); setEditingFacility(null); };

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat fasilitas..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2"><Building2 className="h-7 w-7 text-cyan-600" /> Fasilitas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola fasilitas sekolah ({facilities.length} fasilitas)</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button className="bg-slate-950 hover:bg-slate-800"><Plus className="mr-2 h-4 w-4" /> Tambah Fasilitas</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingFacility ? "Edit Fasilitas" : "Tambah Fasilitas Baru"}</DialogTitle><DialogDescription>Isi detail fasilitas sekolah</DialogDescription></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div><Label>Nama Fasilitas</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama fasilitas..." className="mt-2" /></div>
                <div><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi fasilitas..." className="mt-2" rows={3} /></div>
                <div>
                  <Label>Gambar</Label>
                  {formData.image_url ? (
                    <div className="relative mt-2"><img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" /><Button size="sm" variant="secondary" className="absolute bottom-2 right-2" onClick={() => setFormData({ ...formData, image_url: "" })}>Ganti</Button></div>
                  ) : (
                    <div className="mt-2">
                      <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50"><ImageIcon className="w-6 h-6 text-slate-400" /><span className="mt-1 text-xs text-slate-500">{uploading ? "Mengunggah..." : "Upload gambar"}</span></Label>
                      <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </div>
                  )}
                </div>
                <div><Label>Urutan</Label><Input type="number" value={formData.order_position} onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) || 0 })} className="mt-2" /></div>
                <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !formData.name} className="w-full">{submitMutation.isPending ? "Menyimpan..." : "Simpan"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {facilities.length === 0 ? (
          <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-300 mb-4" /><h3 className="text-lg font-semibold">Belum ada fasilitas</h3><p className="text-sm text-muted-foreground mt-1">Tambahkan fasilitas pertama</p>
          </motion.div>
        ) : (
          <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {facilities.map((facility) => (
              <motion.div key={facility.id} variants={staggerItem} whileHover={{ y: -4 }}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow h-full flex flex-col">
                  <div className="relative h-40 bg-slate-100">
                    {facility.image_url ? <img src={facility.image_url} alt={facility.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Building2 className="h-12 w-12 text-slate-300" /></div>}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold">{facility.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{facility.description || "Tanpa deskripsi"}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(facility)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(facility.id)}><Trash2 className="h-3 w-3" /></Button>
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
