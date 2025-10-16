"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface PPDBSettings {
  id: string;
  google_form_url: string;
}

export default function PPDBSettingsCMS() {
  const [settings, setSettings] = useState<PPDBSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("ppdb_settings")
          .select("*")
          .maybeSingle();

        if (error) throw error;
        if (data) setSettings(data);
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

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("ppdb_settings")
        .update({
          google_form_url: settings.google_form_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "URL Google Form PPDB berhasil disimpan",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Kelola Pendaftaran Siswa Baru</h1>
        <p className="text-muted-foreground">
          Perbarui URL Google Form untuk pendaftaran siswa baru
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>URL Google Form</CardTitle>
            <CardDescription>
              Masukkan URL Google Form untuk pendaftaran siswa baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="google_form_url">URL Google Form</Label>
            <Input
              id="google_form_url"
              value={settings?.google_form_url || ""}
              onChange={(e) =>
                setSettings(settings ? { ...settings, google_form_url: e.target.value } : null)
              }
              placeholder="Masukkan URL Google Form (contoh: https://forms.gle/xxx)"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}