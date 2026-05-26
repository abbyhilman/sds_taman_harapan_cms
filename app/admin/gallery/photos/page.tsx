'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PageLoading } from '@/components/ui/loading';
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from '@/components/ui/animated';

interface Photo {
  id: string;
  image_url: string;
  caption: string;
  order_position: number;
}

export default function PhotosPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ image_url: '', caption: '', order_position: 0 });

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['gallery_photos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gallery_photos').select('*').order('order_position', { ascending: true });
      if (error) throw error;
      return data as Photo[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (editingPhoto) {
        const { error } = await supabase.from('gallery_photos').update({ caption: formData.caption, order_position: formData.order_position, updated_at: new Date().toISOString() }).eq('id', editingPhoto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('gallery_photos').insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_photos'] });
      toast({ title: 'Berhasil', description: `Foto berhasil ${editingPhoto ? 'diperbarui' : 'ditambahkan'}` });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const multiUploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery-${Date.now()}-${i}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(`gallery/${fileName}`, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`gallery/${fileName}`);
        await supabase.from('gallery_photos').insert([{ image_url: publicUrl, caption: '', order_position: photos.length + i }]);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gallery_photos'] });
      toast({ title: 'Berhasil', description: `${variables.length} foto berhasil diunggah` });
      setUploading(false);
    },
    onError: (error: Error) => { toast({ title: 'Error', description: error.message, variant: 'destructive' }); setUploading(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_photos'] });
      toast({ title: 'Berhasil', description: 'Foto berhasil dihapus' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    multiUploadMutation.mutate(files);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(`gallery/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`gallery/${fileName}`);
      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: 'Berhasil', description: 'Gambar berhasil diunggah' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Upload gagal', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setFormData({ image_url: photo.image_url, caption: photo.caption, order_position: photo.order_position });
    setDialogOpen(true);
  };

  const resetForm = () => { setFormData({ image_url: '', caption: '', order_position: 0 }); setEditingPhoto(null); };

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat galeri foto..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
              <Camera className="h-7 w-7 text-cyan-600" /> Galeri Foto
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola koleksi foto sekolah ({photos.length} foto)</p>
          </div>
          <div className="flex gap-2">
            <Label htmlFor="multi-upload" className="cursor-pointer">
              <Button variant="outline" asChild disabled={uploading}>
                <span><Upload className="mr-2 h-4 w-4" /> {uploading ? 'Mengunggah...' : 'Upload Banyak'}</span>
              </Button>
            </Label>
            <Input id="multi-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleMultipleImageUpload} disabled={uploading} />
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-slate-950 hover:bg-slate-800"><Plus className="mr-2 h-4 w-4" /> Tambah Foto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPhoto ? 'Edit Foto' : 'Tambah Foto Baru'}</DialogTitle>
                  <DialogDescription>Upload foto dan tambahkan caption</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Gambar</Label>
                    {formData.image_url ? (
                      <div className="relative mt-2">
                        <img src={formData.image_url} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                        <Button size="sm" variant="secondary" className="absolute bottom-2 right-2" onClick={() => setFormData({ ...formData, image_url: '' })}>Ganti</Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                          <span className="mt-2 text-sm text-slate-500">Klik untuk upload</span>
                        </Label>
                        <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Caption</Label>
                    <Input value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} placeholder="Deskripsi foto..." className="mt-2" />
                  </div>
                  <div>
                    <Label>Urutan</Label>
                    <Input type="number" value={formData.order_position} onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) || 0 })} className="mt-2" />
                  </div>
                  <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !formData.image_url} className="w-full">
                    {submitMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center">
            <Camera className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold">Belum ada foto</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload foto pertama untuk memulai galeri</p>
          </motion.div>
        ) : (
          <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" variants={staggerContainer}>
            {photos.map((photo, index) => (
              <motion.div key={photo.id} variants={staggerItem} whileHover={{ y: -4 }}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow">
                  <div className="relative aspect-square">
                    <img src={photo.image_url} alt={photo.caption || 'Gallery photo'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
                        <span className="text-white text-sm truncate flex-1">{photo.caption || 'Tanpa caption'}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleEdit(photo)}><Pencil className="h-3 w-3" /></Button>
                          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteMutation.mutate(photo.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
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
