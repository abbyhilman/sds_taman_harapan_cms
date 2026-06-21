"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ExternalLink, Instagram, Video, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { PageLoading } from "@/components/ui/loading";
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from "@/components/ui/animated";

interface SocialMediaPost {
  id: string;
  source: "instagram" | "tiktok";
  post_url: string;
  embed_code: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export default function SocialMediaPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    source: "instagram" as "instagram" | "tiktok",
    post_url: "",
    embed_code: "",
    thumbnail_url: "",
    caption: "",
    display_order: 0,
    is_active: true,
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["social-media-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_media_posts")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as SocialMediaPost[];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (editingPost) {
        const { error } = await supabase
          .from("social_media_posts")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("social_media_posts")
          .insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-media-posts"] });
      toast({
        title: "Berhasil",
        description: `Postingan berhasil ${editingPost ? "diperbarui" : "ditambahkan"}`,
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) =>
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("social_media_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-media-posts"] });
      toast({
        title: "Berhasil",
        description: "Postingan berhasil dihapus",
      });
    },
    onError: (error: Error) =>
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("social_media_posts")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-media-posts"] });
    },
    onError: (error: Error) =>
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      }),
  });

  const fetchEmbedCode = async (url: string) => {
    if (!url) return;
    const isInstagram = url.includes("instagram.com");
    const isTikTok = url.includes("tiktok.com");

    if (isInstagram) {
      const match = url.match(/\/p\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const shortcode = match[1];
        setFormData({
          ...formData,
          embed_code: `<iframe src="https://www.instagram.com/p/${shortcode}/embed" width="400" height="480" frameborder="0" scrolling="no" style="border-radius:12px;"></iframe>`,
        });
      }
    } else if (isTikTok) {
      const match = url.match(/\/video\/(\d+)/);
      if (match) {
        const videoId = match[1];
        setFormData({
          ...formData,
          embed_code: `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}" style="max-width: 605px;min-width: 325px;" > <section> </section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>`,
        });
      }
    }
  };

  const handleEdit = (post: SocialMediaPost) => {
    setEditingPost(post);
    setFormData({
      source: post.source,
      post_url: post.post_url,
      embed_code: post.embed_code || "",
      thumbnail_url: post.thumbnail_url || "",
      caption: post.caption || "",
      display_order: post.display_order,
      is_active: post.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      source: "instagram",
      post_url: "",
      embed_code: "",
      thumbnail_url: "",
      caption: "",
      display_order: 0,
      is_active: true,
    });
    setEditingPost(null);
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#f8fbff] p-6">
        <PageLoading text="Memuat postingan..." />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div
        className="mx-auto max-w-7xl space-y-6"
        initial="hidden"
        animate="show"
        variants={staggerContainer}
      >
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          variants={fadeInDown}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
              <Instagram className="h-7 w-7 text-pink-600" />
              Sosial Media
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola postingan Instagram dan TikTok ({posts.length} postingan)
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
              <Button className="bg-slate-950 hover:bg-slate-800">
                <Plus className="mr-2 h-4 w-4" /> Tambah Postingan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingPost ? "Edit Postingan" : "Tambah Postingan Baru"}
                </DialogTitle>
                <DialogDescription>
                  Paste URL postingan Instagram atau TikTok
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <Label>Platform</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value: "instagram" | "tiktok") =>
                      setFormData({ ...formData, source: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>URL Postingan</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={formData.post_url}
                      onChange={(e) =>
                        setFormData({ ...formData, post_url: e.target.value })
                      }
                      placeholder="https://www.instagram.com/p/..."
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fetchEmbedCode(formData.post_url)}
                    >
                      Embed
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Embed Code (opsional)</Label>
                  <Textarea
                    value={formData.embed_code}
                    onChange={(e) =>
                      setFormData({ ...formData, embed_code: e.target.value })
                    }
                    placeholder="Auto-generated atau paste manual..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Caption (opsional)</Label>
                  <Textarea
                    value={formData.caption}
                    onChange={(e) =>
                      setFormData({ ...formData, caption: e.target.value })
                    }
                    placeholder="Caption..."
                    className="mt-2"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Urutan</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending || !formData.post_url}
                  className="w-full"
                >
                  {submitMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {posts.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center"
          >
            <Instagram className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold">Belum ada postingan</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tambahkan postingan Instagram atau TikTok pertama
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
          >
            {posts.map((post) => (
              <motion.div key={post.id} variants={staggerItem} whileHover={{ y: -4 }}>
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow h-full flex flex-col">
                  <div className="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    {post.source === "instagram" ? (
                      <Instagram className="h-16 w-16 text-pink-400" />
                    ) : (
                      <Video className="h-16 w-16 text-gray-600" />
                    )}
                    <Badge
                      className={`absolute top-3 right-3 ${
                        post.source === "instagram"
                          ? "bg-pink-500"
                          : "bg-gray-800"
                      }`}
                    >
                      {post.source === "instagram" ? "Instagram" : "TikTok"}
                    </Badge>
                    {!post.is_active && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-sm">
                          Tersembunyi
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    {post.caption && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">
                        {post.caption}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{post.post_url}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(post)}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={post.is_active ? "secondary" : "default"}
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: post.id,
                            is_active: !post.is_active,
                          })
                        }
                      >
                        {post.is_active ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(post.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
