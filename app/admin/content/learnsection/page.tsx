'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, X, GraduationCap, Image as ImageIcon } from 'lucide-react';
import { PageLoading } from '@/components/ui/loading';
import { staggerContainer, staggerItem, fadeInDown } from '@/components/ui/animated';

interface LearningSection {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: { image_url: string }[];
}

export default function LearningSectionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', tags: [] as string[], images: [] as { image_url: string }[] });

  const { data: section, isLoading } = useQuery({
    queryKey: ['learning_section'],
    queryFn: async () => {
      const { data, error } = await supabase.from('learning_section').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data as LearningSection;
    },
  });

  useEffect(() => { if (section) setFormData(section); }, [section]);

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      if (section) {
        const { error } = await supabase.from('learning_section').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', section.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('learning_section').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['learning_section'] }); toast({ title: 'Berhasil', description: 'Data disimpan.' }); },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => { if (!section) return; const { error } = await supabase.from('learning_section').delete().eq('id', section.id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['learning_section'] }); toast({ title: 'Dihapus', description: 'Data berhasil dihapus.' }); setFormData({ title: '', description: '', tags: [], images: [] }); },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formData.images.length >= 2) { toast({ title: 'Batas Tercapai', description: 'Maksimal 2 gambar.', variant: 'destructive' }); return; }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `learning-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(`learning/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`learning/${fileName}`);
      setFormData((prev) => ({ ...prev, images: [...prev.images, { image_url: publicUrl }] }));
      toast({ title: 'Berhasil', description: 'Gambar ditambahkan.' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Upload gagal', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const handleTagAdd = () => {
    if (!newTag.trim()) return;
    if (formData.tags.length >= 4) { toast({ title: 'Batas Tercapai', description: 'Maksimal 4 tag.', variant: 'destructive' }); return; }
    if (formData.tags.includes(newTag.trim())) { toast({ title: 'Duplikat', description: 'Tag sudah ada.', variant: 'destructive' }); return; }
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
    setNewTag('');
  };

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat data pembelajaran..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-4xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2"><GraduationCap className="h-7 w-7 text-cyan-600" /> Pembelajaran</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola konten pembelajaran yang menyenangkan</p>
          </div>
          {section && <Button variant="destructive" onClick={() => confirm('Yakin ingin menghapus?') && deleteMutation.mutate()} disabled={deleteMutation.isPending}><Trash2 className="w-4 h-4 mr-2" /> Hapus</Button>}
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Detail Konten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Judul</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Judul section..." className="mt-2" /></div>
              <div><Label>Deskripsi</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi pembelajaran..." rows={4} className="mt-2" /></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Tag ({formData.tags.length}/4)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">{formData.tags.map((tag) => (<Badge key={tag} variant="secondary" className="gap-1">{tag}<button onClick={() => setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))}><X className="w-3 h-3" /></button></Badge>))}</div>
              <div className="flex gap-2"><Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Tambah tag..." onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())} /><Button onClick={handleTagAdd} disabled={formData.tags.length >= 4}><Plus className="w-4 h-4" /></Button></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="border-0 shadow-md">
            <CardHeader><CardTitle>Gambar ({formData.images.length}/2)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img.image_url} alt={`Learning ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <button onClick={() => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              {formData.images.length < 2 && (
                <div>
                  <Label htmlFor="img-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50"><ImageIcon className="w-6 h-6 text-slate-400" /><span className="mt-1 text-xs text-slate-500">{uploading ? 'Mengunggah...' : 'Upload gambar'}</span></Label>
                  <Input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} className="flex justify-end">
          <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending || !formData.title} className="bg-slate-950 hover:bg-slate-800">{saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
