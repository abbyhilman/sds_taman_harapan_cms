"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
  BookOpen,
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { staggerContainer, staggerItem, fadeInDown } from "@/components/ui/animated";

const POSITIONS = [
  "Kepala Sekolah",
  "Wakil Kepala Sekolah",
  "Wali Kelas",
  "Guru Mata Pelajaran",
  "Guru Pendamping",
  "Guru Ekstrakurikuler",
] as const;

interface Teacher {
  id: string;
  photo_url: string;
  full_name: string;
  nip: string;
  position: string;
  education: string;
  alma_mater: string;
  bio: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string | null;
}

interface TeacherWithRelations extends Teacher {
  subjects: { id: string; name: string }[];
  classrooms: { id: string; display_name: string }[];
  expertise: { id: string; expertise: string }[];
}

export default function TeachersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithRelations | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    photo_url: "",
    full_name: "",
    nip: "",
    position: "Guru Mata Pelajaran",
    education: "",
    alma_mater: "",
    bio: "",
    is_active: true,
    display_order: 0,
  });
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState("");

  // Fetch teachers with relations
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ["teachers", "with-relations"],
    queryFn: async () => {
      // Fetch teachers
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .order("display_order", { ascending: true });
      if (teacherError) throw teacherError;

      if (!teacherData || teacherData.length === 0) return [];

      const teacherIds = teacherData.map((t) => t.id);

      // Fetch subjects for each teacher
      const { data: subjectLinks } = await supabase
        .from("teacher_subjects")
        .select("teacher_id, subject_id, subjects(name)")
        .in("teacher_id", teacherIds);

      // Fetch classrooms for each teacher
      const { data: classroomLinks } = await supabase
        .from("teacher_classrooms")
        .select("teacher_id, classroom_id, classrooms(display_name)")
        .in("teacher_id", teacherIds);

      // Fetch expertise for each teacher
      const { data: expertiseLinks } = await supabase
        .from("teacher_expertise")
        .select("id, teacher_id, expertise")
        .in("teacher_id", teacherIds);

      const subjectsMap = new Map<string, { id: string; name: string }[]>();
      subjectLinks?.forEach((link) => {
        const arr = subjectsMap.get(link.teacher_id) || [];
        arr.push({ id: link.subject_id, name: (link as any).subjects?.name || "" });
        subjectsMap.set(link.teacher_id, arr);
      });

      const classroomsMap = new Map<string, { id: string; display_name: string }[]>();
      classroomLinks?.forEach((link) => {
        const arr = classroomsMap.get(link.teacher_id) || [];
        arr.push({ id: link.classroom_id, display_name: (link as any).classrooms?.display_name || "" });
        classroomsMap.set(link.teacher_id, arr);
      });

      const expertiseMap = new Map<string, { id: string; expertise: string }[]>();
      expertiseLinks?.forEach((link) => {
        const arr = expertiseMap.get(link.teacher_id) || [];
        arr.push({ id: link.id, expertise: link.expertise });
        expertiseMap.set(link.teacher_id, arr);
      });

      return teacherData.map((t) => ({
        ...t,
        subjects: subjectsMap.get(t.id) || [],
        classrooms: classroomsMap.get(t.id) || [],
        expertise: expertiseMap.get(t.id) || [],
      })) as TeacherWithRelations[];
    },
  });

  // Fetch subjects for multi-select
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  // Fetch classrooms for multi-select
  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classrooms")
        .select("id, display_name")
        .order("display_name");
      if (error) throw error;
      return data as { id: string; display_name: string }[];
    },
  });

  const filteredTeachers = useMemo(() => {
    if (!searchQuery) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter(
      (t) =>
        t.full_name.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q) ||
        t.nip.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (editingTeacher) {
        const { error } = await supabase
          .from("teachers")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTeacher.id);
        if (error) throw error;

        // Update subjects
        await supabase.from("teacher_subjects").delete().eq("teacher_id", editingTeacher.id);
        if (selectedSubjectIds.length > 0) {
          const { error: subError } = await supabase
            .from("teacher_subjects")
            .insert(selectedSubjectIds.map((sid) => ({ teacher_id: editingTeacher.id, subject_id: sid })));
          if (subError) throw subError;
        }

        // Update classrooms
        await supabase.from("teacher_classrooms").delete().eq("teacher_id", editingTeacher.id);
        if (selectedClassroomIds.length > 0) {
          const { error: clsError } = await supabase
            .from("teacher_classrooms")
            .insert(selectedClassroomIds.map((cid) => ({ teacher_id: editingTeacher.id, classroom_id: cid })));
          if (clsError) throw clsError;
        }

        // Update expertise
        await supabase.from("teacher_expertise").delete().eq("teacher_id", editingTeacher.id);
        if (expertiseTags.length > 0) {
          const { error: expError } = await supabase
            .from("teacher_expertise")
            .insert(expertiseTags.map((exp) => ({ teacher_id: editingTeacher.id, expertise: exp })));
          if (expError) throw expError;
        }
      } else {
        const { data, error } = await supabase
          .from("teachers")
          .insert([formData])
          .select()
          .single();
        if (error) throw error;

        const teacherId = data.id;

        // Insert subjects
        if (selectedSubjectIds.length > 0) {
          await supabase
            .from("teacher_subjects")
            .insert(selectedSubjectIds.map((sid) => ({ teacher_id: teacherId, subject_id: sid })));
        }

        // Insert classrooms
        if (selectedClassroomIds.length > 0) {
          await supabase
            .from("teacher_classrooms")
            .insert(selectedClassroomIds.map((cid) => ({ teacher_id: teacherId, classroom_id: cid })));
        }

        // Insert expertise
        if (expertiseTags.length > 0) {
          await supabase
            .from("teacher_expertise")
            .insert(expertiseTags.map((exp) => ({ teacher_id: teacherId, expertise: exp })));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers", "with-relations"] });
      toast({
        title: "Berhasil",
        description: `Data guru berhasil ${editingTeacher ? "diperbarui" : "ditambahkan"}`,
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers", "with-relations"] });
      toast({ title: "Berhasil", description: "Data guru berhasil dihapus" });
      setDeleteTarget(null);
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `teacher-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("teacher-photos")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("teacher-photos").getPublicUrl(fileName);
      setFormData({ ...formData, photo_url: publicUrl });
      toast({ title: "Berhasil", description: "Foto berhasil diunggah" });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Upload gagal",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (teacher: TeacherWithRelations) => {
    setEditingTeacher(teacher);
    setFormData({
      photo_url: teacher.photo_url,
      full_name: teacher.full_name,
      nip: teacher.nip,
      position: teacher.position,
      education: teacher.education,
      alma_mater: teacher.alma_mater,
      bio: teacher.bio,
      is_active: teacher.is_active,
      display_order: teacher.display_order,
    });
    setSelectedSubjectIds(teacher.subjects.map((s) => s.id));
    setSelectedClassroomIds(teacher.classrooms.map((c) => c.id));
    setExpertiseTags(teacher.expertise.map((e) => e.expertise));
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      photo_url: "",
      full_name: "",
      nip: "",
      position: "Guru Mata Pelajaran",
      education: "",
      alma_mater: "",
      bio: "",
      is_active: true,
      display_order: 0,
    });
    setSelectedSubjectIds([]);
    setSelectedClassroomIds([]);
    setExpertiseTags([]);
    setNewExpertise("");
    setEditingTeacher(null);
  };

  const addExpertiseTag = () => {
    const tag = newExpertise.trim();
    if (tag && !expertiseTags.includes(tag)) {
      setExpertiseTags([...expertiseTags, tag]);
      setNewExpertise("");
    }
  };

  const removeExpertiseTag = (tag: string) => {
    setExpertiseTags(expertiseTags.filter((t) => t !== tag));
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleClassroom = (id: string) => {
    setSelectedClassroomIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (teachersLoading)
    return (
      <div className="min-h-screen bg-[#f8fbff] p-6">
        <PageLoading text="Memuat data guru..." />
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
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          variants={fadeInDown}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-cyan-600" />
              Manajemen Guru
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola data guru dan pengajar ({teachers.length} guru)
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari guru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
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
                  <Plus className="mr-2 h-4 w-4" /> Tambah Guru
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTeacher ? "Edit Data Guru" : "Tambah Guru Baru"}
                  </DialogTitle>
                  <DialogDescription>
                    Isi detail data guru dan pengajar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  {/* Photo Upload */}
                  <div>
                    <Label>Foto Guru</Label>
                    {formData.photo_url ? (
                      <div className="relative mt-2 flex items-center gap-4">
                        <img
                          src={formData.photo_url}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-full border-2 border-cyan-200"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setFormData({ ...formData, photo_url: "" })}
                        >
                          Ganti Foto
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <Label
                          htmlFor="photo-upload"
                          className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50"
                        >
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                          <span className="mt-1 text-xs text-slate-500">
                            {uploading ? "Mengunggah..." : "Upload foto"}
                          </span>
                        </Label>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </div>
                    )}
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nama Lengkap *</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                        placeholder="Nama lengkap..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>NIP</Label>
                      <Input
                        value={formData.nip}
                        onChange={(e) =>
                          setFormData({ ...formData, nip: e.target.value })
                        }
                        placeholder="NIP (opsional)..."
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <Label>Jabatan *</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(v) =>
                        setFormData({ ...formData, position: v })
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Education */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Pendidikan Terakhir</Label>
                      <Input
                        value={formData.education}
                        onChange={(e) =>
                          setFormData({ ...formData, education: e.target.value })
                        }
                        placeholder="S1 Pendidikan Matematika..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Asal Sekolah/Universitas</Label>
                      <Input
                        value={formData.alma_mater}
                        onChange={(e) =>
                          setFormData({ ...formData, alma_mater: e.target.value })
                        }
                        placeholder="Universitas Negeri Jakarta..."
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label>Bio/Deskripsi</Label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Deskripsi singkat tentang guru..."
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Subjects */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Mata Pelajaran yang Diajar
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                      {subjects.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => toggleSubject(sub.id)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            selectedSubjectIds.includes(sub.id)
                              ? "bg-cyan-100 border-cyan-300 text-cyan-800"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Classrooms */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Users className="w-4 h-4" /> Kelas yang Diajar
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                      {classrooms.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => toggleClassroom(cls.id)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            selectedClassroomIds.includes(cls.id)
                              ? "bg-cyan-100 border-cyan-300 text-cyan-800"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {cls.display_name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expertise Tags */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Keahlian/Spesialisasi
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {expertiseTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeExpertiseTag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newExpertise}
                        onChange={(e) => setNewExpertise(e.target.value)}
                        placeholder="Tambah keahlian..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addExpertiseTag();
                          }
                        }}
                      />
                      <Button type="button" size="sm" onClick={addExpertiseTag}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Status & Order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={formData.is_active ? "active" : "inactive"}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            is_active: v === "active",
                          })
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Nonaktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Urutan Tampil</Label>
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
                  </div>

                  <Button
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending || !formData.full_name}
                    className="w-full"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Table */}
        {filteredTeachers.length === 0 ? (
          <motion.div
            variants={staggerItem}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white p-12 text-center"
          >
            <Users className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold">
              {searchQuery ? "Tidak ditemukan" : "Belum ada data guru"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? "Coba kata kunci lain"
                : "Tambahkan guru pertama"}
            </p>
          </motion.div>
        ) : (
          <motion.div variants={staggerItem}>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Foto</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Mata Pelajaran
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Kelas
                      </TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-24 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          {teacher.photo_url ? (
                            <img
                              src={teacher.photo_url}
                              alt={teacher.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{teacher.full_name}</p>
                            {teacher.nip && (
                              <p className="text-xs text-muted-foreground">
                                NIP: {teacher.nip}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{teacher.position}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {teacher.subjects.map((s) => (
                              <Badge
                                key={s.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {s.name}
                              </Badge>
                            ))}
                            {teacher.subjects.length === 0 && (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {teacher.classrooms.map((c) => (
                              <Badge
                                key={c.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {c.display_name}
                              </Badge>
                            ))}
                            {teacher.classrooms.length === 0 && (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              teacher.is_active ? "default" : "secondary"
                            }
                            className={
                              teacher.is_active
                                ? "bg-green-100 text-green-800"
                                : ""
                            }
                          >
                            {teacher.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(teacher)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteTarget(teacher.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Guru?</AlertDialogTitle>
            <AlertDialogDescription>
              Data guru ini akan dihapus secara permanen. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
