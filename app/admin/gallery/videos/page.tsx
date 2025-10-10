'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Pencil, Trash2, Video as VideoIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'embed'>('embed');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    embed_url: '',
    thumbnail_url: '',
    order_position: 0,
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_videos')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `video-${Date.now()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, video_url: publicUrl });

      toast({
        title: 'Berhasil',
        description: 'Video berhasil diunggah',
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

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `thumbnail-${Date.now()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

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
        description: 'Thumbnail berhasil diunggah',
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
      if (editingVideo) {
        const { error } = await supabase
          .from('gallery_videos')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingVideo.id);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Video berhasil diperbarui',
        });
      } else {
        const { error } = await supabase
          .from('gallery_videos')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Video berhasil ditambahkan',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      video_url: video.video_url,
      embed_url: video.embed_url,
      thumbnail_url: video.thumbnail_url,
      order_position: video.order_position,
    });
    setUploadType(video.embed_url ? 'embed' : 'file');
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus video ini?')) return;

    try {
      const { error } = await supabase
        .from('gallery_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Video berhasil dihapus',
      });

      fetchVideos();
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
      description: '',
      video_url: '',
      embed_url: '',
      thumbnail_url: '',
      order_position: 0,
    });
    setEditingVideo(null);
    setUploadType('embed');
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
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
          <h1 className="text-3xl font-bold mb-2">Galeri Video</h1>
          <p className="text-muted-foreground">
            Kelola koleksi video sekolah
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Edit Video' : 'Tambah Video Baru'}
              </DialogTitle>
              <DialogDescription>
                Isi informasi video di bawah ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Video</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Judul video"
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi video"
                  rows={3}
                />
              </div>

              {!editingVideo && (
                <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as 'file' | 'embed')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="embed">Link Embed</TabsTrigger>
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                  </TabsList>
                  <TabsContent value="embed" className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL YouTube/Embed</Label>
                      <Input
                        value={formData.embed_url}
                        onChange={(e) => setFormData({ ...formData, embed_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Masukkan link YouTube atau video embed lainnya
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="file" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Video</Label>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        disabled={uploading}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              <div className="space-y-2">
                <Label>Thumbnail (Opsional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={uploading}
                />
                {formData.thumbnail_url && (
                  <img src={formData.thumbnail_url} alt="Thumbnail" className="w-full h-32 object-cover rounded" />
                )}
              </div>

              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  value={formData.order_position}
                  onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) })}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingVideo ? 'Perbarui' : 'Tambah'} Video
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id}>
            <CardHeader>
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-4">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : video.embed_url && video.embed_url.includes('youtube') ? (
                  <img
                    src={getYouTubeThumbnail(video.embed_url)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <VideoIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <VideoIcon className="w-12 h-12 text-white" />
                </div>
              </div>
              <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {video.description}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(video)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(video.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <VideoIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Belum ada video di galeri. Tambah video untuk memulai.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
