"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Program {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  image_url: string;
  category: string;
  order_position: number;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon_url: "",
    image_url: "",
    category: "academic",
    order_position: 0,
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("order_position", { ascending: true });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "icon_url" | "image_url"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `program-${Date.now()}.${fileExt}`;
      const filePath = `programs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      setFormData({ ...formData, [field]: publicUrl });

      toast({
        title: "Berhasil",
        description: "Gambar berhasil diunggah",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProgram) {
        const { error } = await supabase
          .from("programs")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingProgram.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Program berhasil diperbarui",
        });
      } else {
        const { error } = await supabase.from("programs").insert([formData]);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Program berhasil ditambahkan",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchPrograms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description,
      icon_url: program.icon_url,
      image_url: program.image_url,
      category: program.category,
      order_position: program.order_position,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus program ini?")) return;

    try {
      const { error } = await supabase.from("programs").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Program berhasil dihapus",
      });

      fetchPrograms();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon_url: "",
      image_url: "",
      category: "academic",
      order_position: 0,
    });
    setEditingProgram(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Program Unggulan</h1>
          <p className="text-muted-foreground">
            Kelola program akademik dan ekstrakurikuler
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (open && programs.length >= 4) {
              toast({
                title: "Batas Tercapai",
                description: "Maksimal hanya boleh 4 program unggulan.",
                variant: "destructive",
              });
              return; // batalkan pembukaan dialog
            }
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={programs.length >= 4}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProgram ? "Edit Program" : "Tambah Program Baru"}
              </DialogTitle>
              <DialogDescription>
                Isi informasi program di bawah ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Program</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Contoh: Program Akademik Unggulan"
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Akademik</SelectItem>
                    <SelectItem value="extracurricular">
                      Ekstrakurikuler
                    </SelectItem>
                    <SelectItem value="character">Karakter</SelectItem>
                    <SelectItem value="tour">Study Tour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi program"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={formData.order_position}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order_position: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Gambar Program</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "image_url")}
                  disabled={uploading}
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded"
                  />
                )}
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingProgram ? "Perbarui" : "Tambah"} Program
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Card key={program.id}>
            <CardHeader>
              {program.image_url && (
                <img
                  src={program.image_url}
                  alt={program.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              <CardTitle className="text-lg">{program.name}</CardTitle>
              <CardDescription className="text-xs">
                {program.category}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {program.description}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(program)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(program.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {programs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Belum ada program. Klik tombol Tambah Program untuk memulai.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
