'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  image_url: string;
  title?: string;
  caption?: string;
  order_position: number;
  is_active: boolean;
}

export default function TentangKamiPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    image_url: '',
    title: '',
    caption: '',
    order_position: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('tentang_kami_photos')
        .select('*')
        .order('order_position', { ascending: true });

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

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `tentang-kami-${Date.now()}.${fileExt}`;
    const filePath = `tentang_kami/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadImage(file);
      setFormData({ ...formData, image_url: publicUrl });
      toast({
        title: 'Berhasil',
        description: isEdit
          ? 'Gambar akan diperbarui setelah disimpan.'
          : 'Gambar berhasil diunggah.',
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
          .from('tentang_kami_photos')
          .update({
            image_url: formData.image_url,
            title: formData.title,
            caption: formData.caption,
            order_position: formData.order_position,
            is_active: formData.is_active,
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
          .from('tentang_kami_photos')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Foto baru berhasil ditambahkan',
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
      title: photo.title || '',
      caption: photo.caption || '',
      order_position: photo.order_position,
      is_active: photo.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;

    try {
      const { error } = await supabase
        .from('tentang_kami_photos')
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

  const handleToggleActive = async (photo: Photo) => {
    try {
      const { error } = await supabase
        .from('tentang_kami_photos')
        .update({ is_active: !photo.is_active })
        .eq('id', photo.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: `Foto ${photo.is_active ? 'dinonaktifkan' : 'diaktifkan'}`,
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
      title: '',
      caption: '',
      order_position: 0,
      is_active: true,
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
          <h1 className="text-3xl font-bold mb-2">Foto Tentang Kami</h1>
          <p className="text-muted-foreground">
            Kelola foto untuk halaman "Tentang Kami"
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
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
                <Label>Judul</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Judul foto (opsional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi / Caption</Label>
                <Input
                  value={formData.caption}
                  onChange={(e) =>
                    setFormData({ ...formData, caption: e.target.value })
                  }
                  placeholder="Keterangan foto"
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
                <Label>Upload Foto</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, !!editingPhoto)}
                  disabled={uploading}
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded"
                  />
                )}
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={!formData.image_url && !editingPhoto}
              >
                {editingPhoto ? 'Perbarui' : 'Tambah'} Foto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <div className="relative group">
              <img
                src={photo.image_url}
                alt={photo.title || 'Tentang Kami Photo'}
                className={`w-full h-48 object-cover ${
                  !photo.is_active ? 'opacity-50 grayscale' : ''
                }`}
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
                  onClick={() => handleToggleActive(photo)}
                >
                  {photo.is_active ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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
            {(photo.title || photo.caption) && (
              <CardContent className="p-3">
                <p className="text-sm font-semibold">{photo.title}</p>
                {photo.caption && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {photo.caption}
                  </p>
                )}
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
              Belum ada foto di halaman Tentang Kami. Tambahkan foto untuk mulai.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
