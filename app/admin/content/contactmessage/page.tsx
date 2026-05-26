"use client";

import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Mail, Phone, Trash2, Reply, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageLoading } from "@/components/ui/loading";
import { staggerContainer, staggerItem, fadeInDown, fadeInUp } from "@/components/ui/animated";
import Mailto from "@/components/ui/Mailto";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  replied: boolean;
  created_at: string;
}

export default function ContactMessagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["contact_messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("contact_messages").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contact_messages"] }); toast({ title: "Dihapus", description: "Pesan berhasil dihapus." }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const replyMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("contact_messages").update({ replied: true }).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contact_messages"] }); },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat pesan..." /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="mx-auto max-w-7xl space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div variants={fadeInDown}>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2"><MessageSquare className="h-7 w-7 text-cyan-600" /> Pesan Pengunjung</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola pesan dari pengunjung website ({messages.length} pesan)</p>
        </motion.div>

        {messages.length === 0 ? (
          <motion.div variants={fadeInUp} className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mb-4" /><h3 className="text-lg font-semibold">Belum ada pesan</h3><p className="text-sm text-muted-foreground mt-1">Pesan dari pengunjung akan muncul di sini</p>
          </motion.div>
        ) : (
          <motion.div className="grid gap-4 sm:grid-cols-2" variants={staggerContainer}>
            {messages.map((msg) => (
              <motion.div key={msg.id} variants={staggerItem} whileHover={{ y: -2 }}>
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{msg.name}</CardTitle>
                      <Badge variant={msg.replied ? "default" : "secondary"} className={msg.replied ? "bg-emerald-500" : "bg-amber-500"}>{msg.replied ? "Sudah Dibalas" : "Belum Dibalas"}</Badge>
                    </div>
                    <CardDescription className="text-xs">{new Date(msg.created_at).toLocaleString("id-ID")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-800 whitespace-pre-line line-clamp-4">{msg.message}</p>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{msg.email}</div>
                      {msg.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{msg.phone}</div>}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Mailto email={msg.email} subject="Balasan dari SDS Taman Harapan" body={`Halo ${msg.name},\n\nTerima kasih atas pesan Anda:\n"${msg.message}"\n\nBerikut tanggapan kami:\n\n`}>
                        <Button variant="outline" size="sm" onClick={() => replyMutation.mutate(msg.id)} disabled={replyMutation.isPending}><Reply className="w-4 h-4 mr-1" /> Balas</Button>
                      </Mailto>
                      {msg.phone && <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${msg.phone}`, "_blank")}><Phone className="w-4 h-4 mr-1" /> WA</Button>}
                      <Button variant="outline" size="sm" onClick={() => { if (confirm("Hapus pesan ini?")) deleteMutation.mutate(msg.id); }} disabled={deleteMutation.isPending}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
