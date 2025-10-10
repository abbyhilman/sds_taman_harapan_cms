'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  image_url: string;
  caption: string;
  order_position: number;
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    image_url: '',
    caption: '',
    order_position: 0,
  });

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('order_position', { ascending: true });

      console.log(data);

      if (error) throw error;
      setPhotos(data || []);
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

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery-${Date.now()}-${i}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        await supabase.from('gallery_photos').insert([{
          image_url: publicUrl,
          caption: '',
          order_position: photos.length + i,
        }]);
      }

      toast({
        title: 'Berhasil',
        description: `${files.length} foto berhasil diunggah`,
      });

      fetchPhotos();
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery-${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });

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
      if (editingPhoto) {
        const { error } = await supabase
          .from('gallery_photos')
          .update({
            caption: formData.caption,
            order_position: formData.order_position,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPhoto.id);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Foto berhasil diperbarui',
        });
      } else {
        const { error } = await supabase
          .from('gallery_photos')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Foto berhasil ditambahkan',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchPhotos();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setFormData({
      image_url: photo.image_url,
      caption: photo.caption,
      order_position: photo.order_position,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;

    try {
      const { error } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Foto berhasil dihapus',
      });

      fetchPhotos();
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
      image_url: '',
      caption: '',
      order_position: 0,
    });
    setEditingPhoto(null);
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
          <h1 className="text-3xl font-bold mb-2">Galeri Foto</h1>
          <p className="text-muted-foreground">
            Kelola koleksi foto sekolah
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultipleImageUpload}
            disabled={uploading}
            className="hidden"
            id="multi-upload"
          />
          <Label htmlFor="multi-upload">
            <Button
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById('multi-upload')?.click()}
              asChild
            >
              <span>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Banyak
                  </>
                )}
              </span>
            </Button>
          </Label>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Foto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPhoto ? 'Edit Foto' : 'Tambah Foto Baru'}
                </DialogTitle>
                <DialogDescription>
                  Isi informasi foto di bawah ini
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Input
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="Deskripsi foto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Urutan</Label>
                  <Input
                    type="number"
                    value={formData.order_position}
                    onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) })}
                  />
                </div>
                {!editingPhoto && (
                  <div className="space-y-2">
                    <Label>Upload Foto</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="w-full h-48 object-cover rounded" />
                    )}
                  </div>
                )}
                {editingPhoto && (
                  <img src={formData.image_url} alt="Current" className="w-full h-48 object-cover rounded" />
                )}
                <Button onClick={handleSubmit} className="w-full" disabled={!editingPhoto && !formData.image_url}>
                  {editingPhoto ? 'Perbarui' : 'Tambah'} Foto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <div className="relative group">
              <img
                src={photo.image_url}
                alt={photo.caption || 'Gallery photo'}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(photo)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDelete(photo.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
            {photo.caption && (
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {photo.caption}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {photos.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Belum ada foto di galeri. Upload foto untuk memulai.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
