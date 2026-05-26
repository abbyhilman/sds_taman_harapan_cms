'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PageLoading } from '@/components/ui/loading';
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from '@/components/ui/animated';

interface Photo { id: string; image_url: string; title?: string; subtitle?: string; order_position: number; is_active?: boolean; }

export default function WelcomePhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({ image_url: '', title: '', subtitle: '', order_position: 0 });

  useEffect(() => { fetchPhotos(); }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase.from('welcome_photos').select('*').order('order_position', { ascending: true });
      if (error) throw error;
      setPhotos(data || []);
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Gagal memuat foto', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `welcome-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(`welcome/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`welcome/${fileName}`);
      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: 'Berhasil', description: isEdit ? 'Gambar akan diperbarui setelah disimpan.' : 'Gambar berhasil diunggah' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Upload gagal', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    try {
      if (editingPhoto) {
        const { error } = await supabase.from('welcome_photos').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', editingPhoto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('welcome_photos').insert([formData]);
        if (error) throw error;
      }
      toast({ title: 'Berhasil', description: `Foto berhasil ${editingPhoto ? 'diperbarui' : 'ditambahkan'}` });
      setDialogOpen(false);
      resetForm();
      fetchPhotos();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Gagal menyimpan', variant: 'destructive' });
    }
  };

  const handleEdit = (photo: Photo) => { setEditingPhoto(photo); setFormData({ image_url: photo.image_url, title: photo.title || '', subtitle: photo.subtitle || '', order_position: photo.order_position }); setDialogOpen(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus foto ini?')) return;
    try {
      const { error } = await supabase.from('welcome_photos').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Foto berhasil dihapus' });
      fetchPhotos();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Gagal menghapus', variant: 'destructive' });
    }
  };

  const resetForm = () => { setFormData({ image_url: '', title: '', subtitle: '', order_position: 0 }); setEditingPhoto(null); };

  if (loading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat foto welcome..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2"><ImageIcon className="h-7 w-7 text-cyan-600" /> Foto Welcome</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola foto banner atau slider halaman depan ({photos.length} foto)</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button className="bg-slate-950 hover:bg-slate-800"><Plus className="mr-2 h-4 w-4" /> Tambah Foto</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editingPhoto ? 'Edit Foto' : 'Tambah Foto Baru'}</DialogTitle><DialogDescription>Isi informasi foto di bawah ini</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <div><Label>Judul</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Misal: Selamat Datang" className="mt-2" /></div>
                <div><Label>Subjudul</Label><Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} placeholder="Deskripsi singkat" className="mt-2" /></div>
                <div><Label>Urutan</Label><Input type="number" value={formData.order_position} onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) || 0 })} className="mt-2" /></div>
                <div>
                  <Label>{editingPhoto ? 'Ganti Foto (opsional)' : 'Upload Foto'}</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, !!editingPhoto)} disabled={uploading} className="mt-2" />
                  {formData.image_url && <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />}
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={!formData.image_url && !editingPhoto}>{editingPhoto ? 'Perbarui' : 'Tambah'} Foto</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {photos.length === 0 ? (
          <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center">
            <ImageIcon className="h-12 w-12 text-slate-300 mb-4" /><h3 className="text-lg font-semibold">Belum ada foto</h3><p className="text-sm text-muted-foreground mt-1">Upload foto untuk memulai</p>
          </motion.div>
        ) : (
          <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" variants={staggerContainer}>
            {photos.map((photo) => (
              <motion.div key={photo.id} variants={staggerItem} whileHover={{ y: -4 }}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow">
                  <div className="relative group">
                    <img src={photo.image_url} alt={photo.title || 'Welcome photo'} className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(photo)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="secondary" size="sm" onClick={() => handleDelete(photo.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </div>
                  {(photo.title || photo.subtitle) && (
                    <CardContent className="p-3">
                      <p className="text-sm font-semibold">{photo.title}</p>
                      {photo.subtitle && <p className="text-xs text-muted-foreground line-clamp-2">{photo.subtitle}</p>}
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
