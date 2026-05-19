'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    images: [] as { image_url: string }[],
  });

  // Fetch Section Data
  const { data: section, isLoading } = useQuery({
    queryKey: ['learning_section'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_section')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data as LearningSection;
    },
  });

  // Sync local state
  useEffect(() => {
    if (section) {
      setFormData(section);
    }
  }, [section]);

  // Mutation for saving
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (section) {
        const { error } = await supabase
          .from('learning_section')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', section.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('learning_section').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning_section'] });
      toast({ title: 'Berhasil', description: 'Data disimpan.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Mutation for deleting
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!section) return;
      const { error } = await supabase.from('learning_section').delete().eq('id', section.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning_section'] });
      toast({ title: 'Dihapus', description: 'Data berhasil dihapus.' });
      setFormData({ title: '', description: '', tags: [], images: [] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `learning-${Date.now()}.${fileExt}`;
    const filePath = `learning/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.images.length >= 2) {
      toast({
        title: 'Batas Gambar Tercapai',
        description: 'Anda hanya dapat mengunggah maksimal 2 gambar.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, { image_url: publicUrl }],
      }));
      toast({ title: 'Berhasil', description: 'Gambar berhasil ditambahkan.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleTagAdd = (tag: string) => {
    if (!tag.trim()) return;

    if (formData.tags.length >= 4) {
      toast({
        title: 'Batas Tag Tercapai',
        description: 'Anda hanya dapat menambahkan maksimal 4 tag.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.tags.includes(tag.trim())) {
      toast({
        title: 'Duplikat Tag',
        description: 'Tag ini sudah ditambahkan.',
        variant: 'destructive',
      });
      return;
    }

    setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
  };

  const handleTagRemove = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleImageRemove = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.image_url !== url),
    }));
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  return (
    <div className="p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Pembelajaran yang Menyenangkan & Bermakna</CardTitle>
          {section && (
            <Button 
              variant="destructive" 
              onClick={() => confirm('Yakin ingin menghapus data ini?') && deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Hapus
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Masukkan judul section..."
            />
          </div>

          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tuliskan deskripsi..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (maks. 4)</Label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {formData.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <Trash2 className="w-3 h-3 cursor-pointer" onClick={() => handleTagRemove(tag)} />
                </span>
              ))}
            </div>
            <Input
              placeholder="Tambah tag (tekan Enter)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              disabled={formData.tags.length >= 4}
            />
          </div>

          <div className="space-y-3">
            <Label>Gambar (maks. 2)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((img, i) => (
                <div key={i} className="relative">
                  <img
                    src={img.image_url}
                    alt={`Gambar pembelajaran ${i + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleImageRemove(img.image_url)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {formData.images.length < 2 && (
                <label className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-gray-50">
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-sm">{uploading ? 'Mengunggah...' : 'Upload Gambar'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          <Button 
            onClick={() => saveMutation.mutate(formData)} 
            className="w-full" 
            disabled={saveMutation.isPending || uploading}
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {section ? 'Perbarui' : 'Simpan'} Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
