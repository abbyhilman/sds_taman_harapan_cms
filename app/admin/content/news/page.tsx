'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface News {
  id: string;
  title: string;
  content: string;
  thumbnail_url: string;
  published_date: string;
  author: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    thumbnail_url: '',
    published_date: format(new Date(), 'yyyy-MM-dd'),
    author: '',
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_date', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `news-${Date.now()}.${fileExt}`;
      const filePath = `news/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, thumbnail_url: publicUrl });

      toast({
        title: 'Berhasil',
        description: 'Gambar berhasil diunggah',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingNews) {
        const { error } = await supabase
          .from('news')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNews.id);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Berita berhasil diperbarui',
        });
      } else {
        const { error } = await supabase
          .from('news')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Berita berhasil ditambahkan',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchNews();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      thumbnail_url: newsItem.thumbnail_url,
      published_date: newsItem.published_date,
      author: newsItem.author,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus berita ini?')) return;

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Berita berhasil dihapus',
      });

      fetchNews();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      thumbnail_url: '',
      published_date: format(new Date(), 'yyyy-MM-dd'),
      author: '',
    });
    setEditingNews(null);
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
          <h1 className="text-3xl font-bold mb-2">Berita</h1>
          <p className="text-muted-foreground">
            Kelola berita dan artikel sekolah
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Berita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNews ? 'Edit Berita' : 'Tambah Berita Baru'}
              </DialogTitle>
              <DialogDescription>
                Isi informasi berita di bawah ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Berita</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Judul berita"
                />
              </div>
              <div className="space-y-2">
                <Label>Konten</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Isi berita lengkap"
                  rows={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Penulis</Label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Nama penulis"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Publikasi</Label>
                <Input
                  type="date"
                  value={formData.published_date}
                  onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {formData.thumbnail_url && (
                  <img src={formData.thumbnail_url} alt="Preview" className="w-full h-48 object-cover rounded" />
                )}
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingNews ? 'Perbarui' : 'Tambah'} Berita
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((newsItem) => (
          <Card key={newsItem.id}>
            <CardHeader>
              {newsItem.thumbnail_url && (
                <img
                  src={newsItem.thumbnail_url}
                  alt={newsItem.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <CardTitle className="text-lg line-clamp-2">{newsItem.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs">
                <Calendar className="w-3 h-3" />
                {format(new Date(newsItem.published_date), 'dd MMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {newsItem.content}
              </p>
              {newsItem.author && (
                <p className="text-xs text-muted-foreground mb-4">
                  Oleh: {newsItem.author}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(newsItem)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(newsItem.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {news.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              Belum ada berita. Klik tombol Tambah Berita untuk memulai.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
