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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Video as VideoIcon, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PageLoading } from '@/components/ui/loading';
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from '@/components/ui/animated';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  embed_url: string;
  thumbnail_url: string;
  order_position: number;
}

export default function VideosPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'embed'>('embed');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({ title: '', description: '', video_url: '', embed_url: '', thumbnail_url: '', order_position: 0 });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['gallery_videos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('gallery_videos').select('*').order('order_position', { ascending: true });
      if (error) throw error;
      return data as Video[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (editingVideo) {
        const { error } = await supabase.from('gallery_videos').update({ ...formData, updated_at: new Date().toISOString() }).eq('id', editingVideo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('gallery_videos').insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_videos'] });
      toast({ title: 'Berhasil', description: `Video berhasil ${editingVideo ? 'diperbarui' : 'ditambahkan'}` });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gallery_videos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery_videos'] });
      toast({ title: 'Berhasil', description: 'Video berhasil dihapus' });
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `thumbnail-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(`thumbnails/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`thumbnails/${fileName}`);
      setFormData({ ...formData, thumbnail_url: publicUrl });
      toast({ title: 'Berhasil', description: 'Thumbnail berhasil diunggah' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Upload gagal', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `video-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(`videos/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`videos/${fileName}`);
      setFormData({ ...formData, video_url: publicUrl });
      toast({ title: 'Berhasil', description: 'Video berhasil diunggah' });
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Upload gagal', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({ title: video.title, description: video.description, video_url: video.video_url, embed_url: video.embed_url, thumbnail_url: video.thumbnail_url, order_position: video.order_position });
    setUploadType(video.embed_url ? 'embed' : 'file');
    setDialogOpen(true);
  };

  const resetForm = () => { setFormData({ title: '', description: '', video_url: '', embed_url: '', thumbnail_url: '', order_position: 0 }); setEditingVideo(null); };

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
  };

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat galeri video..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInDown}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
              <VideoIcon className="h-7 w-7 text-cyan-600" /> Galeri Video
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Kelola koleksi video sekolah ({videos.length} video)</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-950 hover:bg-slate-800"><Plus className="mr-2 h-4 w-4" /> Tambah Video</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingVideo ? 'Edit Video' : 'Tambah Video Baru'}</DialogTitle>
                <DialogDescription>Upload video atau embed dari YouTube</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Judul Video</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Judul video..." className="mt-2" />
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Deskripsi video..." className="mt-2" rows={3} />
                </div>
                <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'file' | 'embed')}>
                  <TabsList className="w-full">
                    <TabsTrigger value="embed" className="flex-1">YouTube Embed</TabsTrigger>
                    <TabsTrigger value="file" className="flex-1">Upload File</TabsTrigger>
                  </TabsList>
                  <TabsContent value="embed" className="mt-4">
                    <Label>URL YouTube</Label>
                    <Input value={formData.embed_url} onChange={(e) => setFormData({ ...formData, embed_url: e.target.value, thumbnail_url: getYouTubeThumbnail(e.target.value) })} placeholder="https://youtube.com/watch?v=..." className="mt-2" />
                  </TabsContent>
                  <TabsContent value="file" className="mt-4 space-y-4">
                    <div>
                      <Label>File Video</Label>
                      <Input type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploading} className="mt-2" />
                    </div>
                    <div>
                      <Label>Thumbnail</Label>
                      <Input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} className="mt-2" />
                    </div>
                  </TabsContent>
                </Tabs>
                <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !formData.title} className="w-full">
                  {submitMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Video Grid */}
        {videos.length === 0 ? (
          <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center">
            <VideoIcon className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold">Belum ada video</h3>
            <p className="text-sm text-muted-foreground mt-1">Tambahkan video pertama untuk memulai galeri</p>
          </motion.div>
        ) : (
          <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" variants={staggerContainer}>
            {videos.map((video) => (
              <motion.div key={video.id} variants={staggerItem} whileHover={{ y: -4 }}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow">
                  <div className="relative aspect-video bg-slate-100">
                    {video.thumbnail_url || video.embed_url ? (
                      <img src={video.thumbnail_url || getYouTubeThumbnail(video.embed_url)} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><VideoIcon className="h-12 w-12 text-slate-300" /></div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                      <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center"><Play className="h-6 w-6 text-slate-900 ml-1" /></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{video.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{video.description || 'Tanpa deskripsi'}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(video)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(video.id)}><Trash2 className="h-3 w-3" /></Button>
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
