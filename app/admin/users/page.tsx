"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { PageLoading } from "@/components/ui/loading";
import { staggerContainer, staggerItem, fadeInDown } from "@/components/ui/animated";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import axios from "axios";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "super_admin", label: "Super Admin", description: "Akses penuh ke semua fitur" },
  { value: "admin", label: "Admin", description: "Kelola konten dan data" },
  { value: "editor", label: "Editor", description: "Edit konten website" },
  { value: "viewer", label: "Viewer", description: "Hanya melihat data" },
];

const emptyCreateForm = {
  email: "",
  password: "",
  full_name: "",
  role: "viewer" as UserRole,
};

const emptyEditForm = {
  full_name: "",
  role: "viewer" as UserRole,
  is_active: true,
  password: "",
};

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    return axiosError.response?.data?.error || "Terjadi kesalahan.";
  }
  return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi.";
};

const getRoleBadge = (role: UserRole) => {
  switch (role) {
    case "super_admin":
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Super Admin</Badge>;
    case "admin":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Admin</Badge>;
    case "editor":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Editor</Badge>;
    case "viewer":
      return <Badge variant="outline">Viewer</Badge>;
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function UserManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile: currentProfile, isSuperAdmin } = useAuth();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data.data as Profile[];
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      if (!createForm.email.trim() || !createForm.password) {
        throw new Error("Email dan password wajib diisi.");
      }
      const res = await axios.post("/api/users", {
        email: createForm.email.trim(),
        password: createForm.password,
        full_name: createForm.full_name.trim(),
        role: createForm.role,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Pengguna berhasil dibuat" });
      setCreateForm(emptyCreateForm);
      setCreateDialogOpen(false);
      setShowPassword(false);
    },
    onError: (error) => {
      toast({
        title: "Gagal membuat pengguna",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async () => {
      if (!editingUser) throw new Error("User tidak ditemukan.");

      const payload: Record<string, unknown> = {
        full_name: editForm.full_name.trim(),
        role: editForm.role,
        is_active: editForm.is_active,
      };

      if (editForm.password) {
        payload.password = editForm.password;
      }

      const res = await axios.patch(`/api/users/${editingUser.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Pengguna berhasil diperbarui" });
      resetEditDialog();
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui pengguna",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (user: Profile) => {
      await axios.delete(`/api/users/${user.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Pengguna berhasil dihapus" });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({
        title: "Gagal menghapus pengguna",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const resetEditDialog = () => {
    setEditingUser(null);
    setEditForm(emptyEditForm);
    setEditDialogOpen(false);
    setShowEditPassword(false);
  };

  const openEditDialog = (user: Profile) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      password: "",
    });
    setEditDialogOpen(true);
  };

  const canDelete = (user: Profile) => {
    if (user.id === currentProfile?.id) return false;
    if (!isSuperAdmin && user.role === "super_admin") return false;
    return true;
  };

  const canEdit = (user: Profile) => {
    if (!isSuperAdmin && user.role === "super_admin") return false;
    return true;
  };

  const users = usersQuery.data ?? [];
  const activeUsers = users.filter((u) => u.is_active).length;

  if (usersQuery.isLoading) {
    return <div className="min-h-screen bg-[#f8fbff] p-6"><PageLoading text="Memuat data pengguna..." /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] p-4 sm:p-6 lg:p-8">
      <motion.div className="space-y-6" initial="hidden" animate="show" variants={staggerContainer}>
        <motion.div variants={fadeInDown}>
          <p className="text-sm font-medium text-cyan-700">Pengaturan</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Manajemen Pengguna
          </h1>
          <p className="mt-2 text-muted-foreground">
            Kelola akun pengguna dan hak akses untuk sistem admin CMS.
          </p>
        </motion.div>

        <motion.div className="grid gap-4 md:grid-cols-3" variants={staggerItem}>
          <SummaryCard title="Total Pengguna" value={users.length} icon={Users} />
          <SummaryCard title="Aktif" value={activeUsers} icon={UserCheck} />
          <SummaryCard title="Nonaktif" value={users.length - activeUsers} icon={UserX} />
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card>
            <CardHeader className="gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Daftar Pengguna</CardTitle>
                <CardDescription>
                  Buat dan kelola akun untuk staf sekolah.
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  setCreateForm(emptyCreateForm);
                  setShowPassword(false);
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pengguna
              </Button>
            </CardHeader>
            <CardContent>
              {usersQuery.error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <div className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <p>{getErrorMessage(usersQuery.error)}</p>
                  </div>
                </div>
              )}
              <div className="rounded-lg border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersQuery.isFetching ? (
                      <LoadingRow colSpan={6} />
                    ) : users.length ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-2">
                              {user.full_name || "-"}
                              {user.id === currentProfile?.id && (
                                <Badge variant="outline" className="text-xs">Anda</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                Nonaktif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => canEdit(user) && openEditDialog(user)}
                                  disabled={!canEdit(user)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => canEdit(user) && openEditDialog(user)}
                                  disabled={!canEdit(user)}
                                >
                                  <KeyRound className="mr-2 h-4 w-4" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => canDelete(user) && setDeleteTarget(user)}
                                  disabled={!canDelete(user)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <EmptyRow colSpan={6} label="Belum ada pengguna terdaftar." />
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Buat akun baru untuk staf yang akan mengakses admin panel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nama Lengkap" id="create_full_name">
              <Input
                id="create_full_name"
                placeholder="Nama lengkap"
                value={createForm.full_name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))}
              />
            </Field>
            <Field label="Email *" id="create_email">
              <Input
                id="create_email"
                type="email"
                placeholder="email@sdstamanharapan.sch.id"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </Field>
            <Field label="Password *" id="create_password">
              <div className="relative">
                <Input
                  id="create_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Role *" id="create_role">
              <Select
                value={createForm.role}
                onValueChange={(value) => setCreateForm((prev) => ({ ...prev, role: value as UserRole }))}
              >
                <SelectTrigger id="create_role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">— {opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateForm(emptyCreateForm); setCreateDialogOpen(false); }}>
              Batal
            </Button>
            <Button onClick={() => createUser.mutate()} disabled={createUser.isPending}>
              {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nama Lengkap" id="edit_full_name">
              <Input
                id="edit_full_name"
                placeholder="Nama lengkap"
                value={editForm.full_name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
              />
            </Field>
            <Field label="Role" id="edit_role">
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, role: value as UserRole }))}
              >
                <SelectTrigger id="edit_role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">— {opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Status Aktif</p>
                <p className="text-sm text-muted-foreground">
                  Pengguna nonaktif tidak bisa login.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={editForm.is_active}
                onClick={() => setEditForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  editForm.is_active ? "bg-emerald-500" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    editForm.is_active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <Field label="Password Baru (opsional)" id="edit_password">
              <div className="relative">
                <Input
                  id="edit_password"
                  type={showEditPassword ? "text" : "password"}
                  placeholder="Kosongkan jika tidak diubah"
                  value={editForm.password}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetEditDialog}>
              Batal
            </Button>
            <Button onClick={() => updateUser.mutate()} disabled={updateUser.isPending}>
              {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong> akan dihapus
              secara permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteUser.mutate(deleteTarget)}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-28 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-cyan-600" />
        <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
      </TableCell>
    </TableRow>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-28 text-center text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
