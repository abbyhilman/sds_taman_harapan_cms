'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Newspaper, Image as ImageIcon, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PageLoading } from '@/components/ui/loading';
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from '@/components/ui/animated';
import { format } from 'date-fns';

interface News { id: string; title: string; content: string; thumbnail_url: string; published_date: string; author: string; }

export default function NewsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ title: '', content: '', thumbnail_url: '', published_date: format(new Date(), 'yyyy-MM-dd'), author: '' });

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: async () => { const { data, error } = await supabase.from('news').select('*').order('published_date', { ascending: false }); if (error) throw error; return data as News[]; },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (editingNews) {
        const { error } = await supabase.from('news').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', editingNews.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('news').insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['news'] }); toast({ title: 'Berhasil', description: `Berita berhasil ${editingNews ? 'diperbarui' : 'ditambahkan'}` }); setDialogOpen(false); resetForm(); },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('news').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['news'] }); toast({ title: 'Berhasil', description: 'Berita berhasil dihapus' }); },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `news-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(`news/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`news/${fileName}`);
      setFormData({ ...formData, thumbnail_url: publicUrl });
      toast({ title: 'Berhasil', description: 'Gambar berhasil diunggah' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Upload gagal', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const handleEdit = (newsItem: News) => { setEditingNews(newsItem); setFormData({ title: newsItem.title, content: newsItem.content, thumbnail_url: newsItem.thumbnail_url, published_date: newsItem.published_date, author: newsItem.author }); setDialogOpen(true); };
  const resetForm = () => { setFormData({ title: '', content: '', thumbnail_url: '', published_date: format(new Date(), 'yyyy-MM-dd'), author: '' }); setEditingNews(null); };

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat berita..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2"><Newspaper className="h-7 w-7 text-cyan-600" /> Berita</h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola berita dan artikel sekolah ({news.length} berita)</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button className="bg-slate-950 hover:bg-slate-800"><Plus className="mr-2 h-4 w-4" /> Tambah Berita</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingNews ? 'Edit Berita' : 'Tambah Berita Baru'}</DialogTitle><DialogDescription>Isi detail berita atau artikel</DialogDescription></DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div><Label>Judul</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Judul berita..." className="mt-2" /></div>
                <div><Label>Konten</Label><Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Isi berita..." className="mt-2" rows={6} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tanggal Publikasi</Label><Input type="date" value={formData.published_date} onChange={(e) => setFormData({ ...formData, published_date: e.target.value })} className="mt-2" /></div>
                  <div><Label>Penulis</Label><Input value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} placeholder="Nama penulis..." className="mt-2" /></div>
                </div>
                <div>
                  <Label>Thumbnail</Label>
                  {formData.thumbnail_url ? (
                    <div className="relative mt-2"><img src={formData.thumbnail_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" /><Button size="sm" variant="secondary" className="absolute bottom-2 right-2" onClick={() => setFormData({ ...formData, thumbnail_url: '' })}>Ganti</Button></div>
                  ) : (
                    <div className="mt-2">
                      <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50"><ImageIcon className="w-6 h-6 text-slate-400" /><span className="mt-1 text-xs text-slate-500">{uploading ? 'Mengunggah...' : 'Upload thumbnail'}</span></Label>
                      <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </div>
                  )}
                </div>
                <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !formData.title} className="w-full">{submitMutation.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {news.length === 0 ? (
          <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center">
            <Newspaper className="h-12 w-12 text-slate-300 mb-4" /><h3 className="text-lg font-semibold">Belum ada berita</h3><p className="text-sm text-muted-foreground mt-1">Tambahkan berita pertama</p>
          </motion.div>
        ) : (
          <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {news.map((item) => (
              <motion.div key={item.id} variants={staggerItem} whileHover={{ y: -4 }}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow h-full flex flex-col">
                  <div className="relative h-40 bg-slate-100">
                    {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Newspaper className="h-12 w-12 text-slate-300" /></div>}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Calendar className="h-3 w-3" />{format(new Date(item.published_date), 'dd MMM yyyy')}{item.author && <Badge variant="secondary" className="text-xs">{item.author}</Badge>}</div>
                    <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{item.content}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(item)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="h-3 w-3" /></Button>
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
