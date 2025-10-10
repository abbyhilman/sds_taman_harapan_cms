"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, Phone, Trash2, Reply } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pesan ini secara permanen?")) return;
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Dihapus", description: "Pesan berhasil dihapus." });
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markAsReplied = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ replied: true })
        .eq("id", id);
      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">📬 Pesan Pengunjung</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {messages.map((msg) => (
          <Card key={msg.id}>
            <CardHeader>
              <CardTitle className="text-lg flex justify-between">
                <span>{msg.name}</span>
                {msg.replied ? (
                  <span className="text-green-600 text-sm">Sudah Dibalas</span>
                ) : (
                  <span className="text-orange-600 text-sm">Belum Dibalas</span>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {new Date(msg.created_at).toLocaleString("id-ID")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-800 text-sm whitespace-pre-line">
                {msg.message}
              </p>

              <div className="flex flex-col gap-2 mt-4">
                <div className="flex items-center text-sm text-gray-700">
                  <Mail className="w-4 h-4 mr-2" />
                  {msg.email}
                </div>
                {msg.phone && (
                  <div className="flex items-center text-sm text-gray-700">
                    <Phone className="w-4 h-4 mr-2" />
                    {msg.phone}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Mailto
                  email={msg.email}
                  subject={`Balasan dari SDS Taman Harapan`}
                  body={`Halo ${msg.name},\n\nTerima kasih atas pesan Anda:\n"${msg.message}"\n\nBerikut tanggapan kami:\n\n`}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsReplied(msg.id)}
                  >
                    <Reply className="w-4 h-4 mr-1" />
                    Balas via Email
                  </Button>
                </Mailto>

                {msg.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`https://wa.me/${msg.phone}`, "_blank")
                    }
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Hubungi via WA
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(msg.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {messages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            Belum ada pesan masuk.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
