'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/admin/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw, Loader2,
  Plus, Pencil, Trash2, Search, CheckCircle2, Clock, AlertCircle,
  ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem, fadeInUp, fadeInDown } from '@/components/ui/animated';

const RechartsChart = dynamic(() => import('@/components/admin/CashFlowChart'), {
  loading: () => <Skeleton className="h-80 w-full" />,
  ssr: false,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusBayar = 'pending' | 'paid' | 'overdue';

interface Student { id: string; full_name: string; nisn: string; current_class: string; }
interface Invoice {
  id: string;
  amount: number;
  status_bayar: StatusBayar;
  due_date: string;
  payment_date: string | null;
  description: string;
  created_at: string;
  students: Student | null;
}
interface InvoiceForm {
  student_id: string;
  amount: string;
  due_date: string;
  description: string;
  status_bayar: StatusBayar;
}
interface ChartData { month: string; actual: number | null; forecast: number | null; }
interface ForecastSummary { total_collected: number; total_expected: number; overall_payment_rate: number; months_analyzed: number; }
interface ForecastItem { month: string; predicted_rate: number; predicted_amount: number; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const formatMonth = (s: string) => {
  const [year, month] = s.split('-');
  const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${names[parseInt(month) - 1]} ${year.slice(2)}`;
};

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<StatusBayar, { label: string; className: string; icon: React.ElementType }> = {
  paid:    { label: 'Lunas',   className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  pending: { label: 'Pending', className: 'border-amber-200 bg-amber-50 text-amber-700',       icon: Clock },
  overdue: { label: 'Terlambat', className: 'border-red-200 bg-red-50 text-red-700',           icon: AlertCircle },
};

const EMPTY_FORM: InvoiceForm = {
  student_id: '', amount: '', due_date: '', description: 'SPP Bulanan', status_bayar: 'pending',
};

// ─── Invoice Form Dialog ──────────────────────────────────────────────────────

function InvoiceFormDialog({
  open, onOpenChange, initial, students, onSave, isSaving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: InvoiceForm;
  students: Student[];
  onSave: (form: InvoiceForm) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<InvoiceForm>(initial);
  const [search, setSearch] = useState('');

  useEffect(() => { setForm(initial); setSearch(''); }, [initial, open]);

  const filtered = useMemo(() => {
    const kw = search.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(kw) ||
      s.nisn.includes(kw) ||
      s.current_class.toLowerCase().includes(kw)
    );
  }, [students, search]);

  const set = (k: keyof InvoiceForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!initial.student_id && initial.amount !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Invoice SPP' : 'Tambah Invoice SPP'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!isEdit && (
            <div className="space-y-2">
              <Label>Siswa</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input className="pl-9" placeholder="Cari nama, NISN, kelas..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={form.student_id} onValueChange={v => set('student_id', v)}>
                <SelectTrigger><SelectValue placeholder="Pilih siswa" /></SelectTrigger>
                <SelectContent>
                  {filtered.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} · {s.nisn} · {s.current_class}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <Input type="number" min={0} placeholder="500000" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Jatuh Tempo</Label>
              <Input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Keterangan</Label>
            <Input placeholder="SPP Bulanan" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status_bayar} onValueChange={v => set('status_bayar', v as StatusBayar)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="overdue">Terlambat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={() => onSave(form)} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ─── SPP Management Tab ───────────────────────────────────────────────────────

function SppManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [formInitial, setFormInitial] = useState<InvoiceForm>(EMPTY_FORM);

  const studentsQuery = useQuery({
    queryKey: ['spp-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, nisn, current_class')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('current_class')
        .order('full_name');
      if (error) throw error;
      return (data ?? []) as Student[];
    },
  });

  const invoicesQuery = useQuery({
    queryKey: ['invoices', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const res = await fetch(`/api/invoices?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return (json.data ?? []) as Invoice[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (form: InvoiceForm) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: form.student_id,
          amount: Number(form.amount),
          due_date: form.due_date,
          description: form.description,
          status_bayar: form.status_bayar,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDialogOpen(false);
      toast({ title: 'Invoice berhasil ditambahkan' });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: InvoiceForm }) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(form.amount),
          due_date: form.due_date,
          description: form.description,
          status_bayar: form.status_bayar,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDialogOpen(false);
      setEditTarget(null);
      toast({ title: 'Invoice berhasil diperbarui' });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteTarget(null);
      toast({ title: 'Invoice berhasil dihapus' });
    },
    onError: (e: Error) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const openAdd = () => {
    setEditTarget(null);
    setFormInitial(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditTarget(inv);
    setFormInitial({
      student_id: inv.students?.id ?? '',
      amount: String(inv.amount),
      due_date: inv.due_date.slice(0, 10),
      description: inv.description,
      status_bayar: inv.status_bayar,
    });
    setDialogOpen(true);
  };

  const handleSave = (form: InvoiceForm) => {
    if (!form.amount || !form.due_date) {
      toast({ title: 'Jumlah dan jatuh tempo wajib diisi', variant: 'destructive' });
      return;
    }
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, form });
    } else {
      if (!form.student_id) {
        toast({ title: 'Pilih siswa terlebih dahulu', variant: 'destructive' });
        return;
      }
      createMutation.mutate(form);
    }
  };

  const invoices = invoicesQuery.data ?? [];
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    const kw = filterSearch.toLowerCase();
    if (!kw) return invoices;
    return invoices.filter(inv =>
      inv.students?.full_name.toLowerCase().includes(kw) ||
      inv.students?.nisn.includes(kw) ||
      inv.description.toLowerCase().includes(kw)
    );
  }, [invoices, filterSearch]);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [filterSearch, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter(i => i.status_bayar === 'paid').length,
    pending: invoices.filter(i => i.status_bayar === 'pending').length,
    overdue: invoices.filter(i => i.status_bayar === 'overdue').length,
    totalAmount: invoices.reduce((s, i) => s + i.amount, 0),
    paidAmount: invoices.filter(i => i.status_bayar === 'paid').reduce((s, i) => s + i.amount, 0),
  }), [invoices]);

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const students = studentsQuery.data ?? [];
  const noActiveStudents = !studentsQuery.isLoading && students.length === 0;

  return (
    <div className="space-y-6">
      {/* Summary mini cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoice', value: stats.total, sub: formatCurrency(stats.totalAmount), color: 'text-slate-700' },
          { label: 'Lunas', value: stats.paid, sub: formatCurrency(stats.paidAmount), color: 'text-emerald-600' },
          { label: 'Pending', value: stats.pending, sub: '', color: 'text-amber-600' },
          { label: 'Terlambat', value: stats.overdue, sub: '', color: 'text-red-600' },
        ].map(c => (
          <Card key={c.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={cn('text-2xl font-bold', c.color)}>{c.value}</p>
              {c.sub && <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Active Students Warning */}
      {noActiveStudents && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-amber-900">Belum Ada Siswa Aktif</h4>
            <p className="text-xs text-amber-700 mt-1">
              Tidak ada siswa aktif yang bisa dibuatkan invoice. Tambahkan atau aktifkan siswa terlebih dahulu di halaman{' '}
              <Link href="/admin/students" className="underline font-semibold hover:text-amber-900">Data Siswa</Link>.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="pl-9 w-56" placeholder="Cari siswa / keterangan..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="overdue">Terlambat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd} disabled={noActiveStudents} className="bg-slate-950 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-2" /> Tambah Invoice
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {invoicesQuery.isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <DollarSign className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Belum ada invoice</p>
              <p className="text-sm text-slate-400 mt-1">Klik "Tambah Invoice" untuk membuat tagihan SPP baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Siswa</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Tgl Bayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((inv, idx) => {
                    const cfg = STATUS_CONFIG[inv.status_bayar];
                    return (
                      <motion.tr
                        key={inv.id}
                        className="border-b transition-colors hover:bg-muted/50"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.02 }}
                      >
                        <TableCell>
                          <div className="font-medium text-slate-900">{inv.students?.full_name ?? '-'}</div>
                          <div className="text-xs text-slate-500">{inv.students?.current_class} · {inv.students?.nisn}</div>
                        </TableCell>
                        <TableCell className="text-sm">{inv.description}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(inv.amount)}</TableCell>
                        <TableCell className="text-sm">{formatDate(inv.due_date)}</TableCell>
                        <TableCell className="text-sm">{inv.payment_date ? formatDate(inv.payment_date) : <span className="text-slate-400">-</span>}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('gap-1', cfg.className)}>
                            <cfg.icon className="h-3 w-3" />{cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(inv)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setDeleteTarget(inv)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-slate-500">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} invoice
                  </p>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | '...')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) => p === '...'
                        ? <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
                        : <Button key={p} size="icon" variant={page === p ? 'default' : 'outline'} className="h-7 w-7 text-xs" onClick={() => setPage(p as number)}>{p}</Button>
                      )}
                    <Button size="icon" variant="outline" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <InvoiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={formInitial}
        students={students}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Invoice <strong>{deleteTarget?.description}</strong> untuk{' '}
              <strong>{deleteTarget?.students?.full_name}</strong> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinancialDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [summary, setSummary] = useState<ForecastSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const { toast } = useToast();

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/forecast-cashflow?months=6&forecast=3');
      const data = await res.json();
      if (data.success) {
        setChartData(data.chart_data || []);
        setSummary(data.summary);
        setForecast(data.forecast || []);
      } else {
        toast({ title: 'Gagal memuat data', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Terjadi kesalahan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchForecast(); }, [fetchForecast]);

  const trend = forecast.length >= 2
    ? forecast[forecast.length - 1].predicted_rate - (summary?.overall_payment_rate || 0)
    : 0;

  const statCards = [
    { label: 'Total Terkumpul', value: formatCurrency(summary?.total_collected || 0), icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Total Target', value: formatCurrency(summary?.total_expected || 0), icon: DollarSign, color: 'bg-blue-100 text-blue-600' },
    { label: 'Tingkat Pembayaran', value: `${summary?.overall_payment_rate?.toFixed(1) ?? '0'}%`, icon: TrendingUp, color: 'bg-cyan-100 text-cyan-600' },
    {
      label: 'Tren Proyeksi',
      value: `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`,
      icon: trend >= 0 ? TrendingUp : TrendingDown,
      color: trend >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
      valueColor: trend >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div
          className="max-w-6xl mx-auto space-y-6"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          {/* Header */}
          <motion.div
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            variants={fadeInDown}
          >
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                Financial Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Proyeksi Cash Flow & Manajemen SPP</p>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="dashboard">
            <TabsList className="mb-2">
              <TabsTrigger value="dashboard">Dashboard & Proyeksi</TabsTrigger>
              <TabsTrigger value="spp">Manajemen SPP</TabsTrigger>
            </TabsList>

            {/* ── Tab: Dashboard ── */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={fetchForecast} disabled={loading} variant="outline" size="sm">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh Data
                </Button>
              </div>

              {/* Summary Cards */}
              <motion.div className="grid gap-4 md:grid-cols-4" variants={staggerContainer}>
                {statCards.map((card) => (
                  <motion.div key={card.label} variants={staggerItem} whileHover={{ y: -2 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className={cn('p-2 rounded-full', card.color)}>
                            <card.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{card.label}</p>
                            {loading
                              ? <Skeleton className="h-7 w-24" />
                              : <p className={cn('text-xl font-bold', card.valueColor)}>{card.value}</p>
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {/* Chart */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" /> Grafik Tingkat Pembayaran SPP
                      </span>
                      <div className="flex gap-4 text-sm font-normal">
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Data Aktual</span>
                        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> Proyeksi AI</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? <Skeleton className="h-80 w-full" /> : <RechartsChart data={chartData} />}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Forecast Details */}
              <motion.div variants={fadeInUp}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detail Proyeksi 3 Bulan Ke Depan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <motion.div className="grid gap-4 md:grid-cols-3" variants={staggerContainer} initial="hidden" animate="show">
                      {loading
                        ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                        : forecast.map((f, i) => {
                          const rate = f.predicted_rate;
                          const status = rate >= 90
                            ? { label: 'Sangat Baik', color: 'text-emerald-600', bg: 'from-emerald-50', border: 'border-emerald-100', desc: 'Tingkat pembayaran diprediksi sangat tinggi. Kondisi keuangan sekolah diperkirakan sehat.' }
                            : rate >= 75
                            ? { label: 'Baik', color: 'text-blue-600', bg: 'from-blue-50', border: 'border-blue-100', desc: 'Sebagian besar siswa diprediksi membayar tepat waktu. Perlu sedikit follow-up untuk yang belum.' }
                            : rate >= 60
                            ? { label: 'Cukup', color: 'text-amber-600', bg: 'from-amber-50', border: 'border-amber-100', desc: 'Ada potensi tunggakan yang cukup signifikan. Disarankan kirim pengingat ke orang tua lebih awal.' }
                            : { label: 'Perlu Perhatian', color: 'text-red-600', bg: 'from-red-50', border: 'border-red-100', desc: 'Tingkat pembayaran diprediksi rendah. Segera lakukan tindakan preventif seperti notifikasi dan konsultasi.' };
                          return (
                            <motion.div
                              key={i}
                              className={`p-4 rounded-lg border ${status.border} bg-gradient-to-br ${status.bg} to-white hover:shadow-md transition-shadow`}
                              variants={staggerItem}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-muted-foreground">{formatMonth(f.month)}</p>
                                <Badge variant="outline" className={cn('text-xs', status.color)}>{status.label}</Badge>
                              </div>
                              <p className={`text-2xl font-bold mt-1 ${status.color}`}>{rate.toFixed(1)}%</p>
                              <p className="text-sm text-muted-foreground mt-0.5">Est. {formatCurrency(f.predicted_amount)}</p>
                              <p className="text-xs text-slate-500 mt-3 leading-relaxed border-t pt-2">{status.desc}</p>
                            </motion.div>
                          );
                        })
                      }
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ── Tab: SPP Management ── */}
            <TabsContent value="spp">
              <SppManagementTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
