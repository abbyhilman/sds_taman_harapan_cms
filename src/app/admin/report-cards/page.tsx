'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Eye, Edit, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type AcademicYear = {
  id: string;
  year_name: string;
  is_active: boolean;
};

type ReportCard = {
  id: string;
  student_id: string;
  academic_year_id: string;
  semester: number;
  class_name: string;
  status: 'draft' | 'finalized' | 'sent';
  pdf_url: string;
  students: {
    nisn: string;
    full_name: string;
    parent_email: string;
  };
};

export default function ReportCardsPage() {
  const { toast } = useToast();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const classes = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchReportCards();
    }
  }, [selectedYear, selectedSemester, selectedClass, searchQuery]);

  const fetchAcademicYears = async () => {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    setAcademicYears(data || []);
    const active = data?.find(y => y.is_active);
    if (active) setSelectedYear(active.id);
    setLoading(false);
  };

  const fetchReportCards = async () => {
    setLoading(true);
    let query = supabase
      .from('report_cards')
      .select('*, students(nisn, full_name, parent_email)')
      .eq('academic_year_id', selectedYear)
      .eq('semester', parseInt(selectedSemester));

    if (selectedClass) {
      query = query.eq('class_name', selectedClass);
    }

    const { data, error } = await query.order('class_name').order('students(full_name)');

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    let filtered = data || [];
    if (searchQuery) {
      filtered = filtered.filter(rc =>
        rc.students?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rc.students?.nisn.includes(searchQuery)
      );
    }

    setReportCards(filtered);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      draft: 'secondary',
      finalized: 'default',
      sent: 'default'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const stats = {
    total: reportCards.length,
    draft: reportCards.filter(r => r.status === 'draft').length,
    finalized: reportCards.filter(r => r.status === 'finalized').length,
    sent: reportCards.filter(r => r.status === 'sent').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Raport Digital</h1>
        <Link href="/admin/report-cards/generate">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Generate Raport Baru
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Raport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Finalized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.finalized}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terkirim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Raport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Tahun Ajaran" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(year => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.year_name} {year.is_active && '(Aktif)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Kelas</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Cari nama/NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Raport</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : reportCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada raport untuk filter yang dipilih
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NISN</TableHead>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email Ortu</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportCards.map(rc => (
                  <TableRow key={rc.id}>
                    <TableCell className="font-mono text-sm">{rc.students?.nisn}</TableCell>
                    <TableCell className="font-medium">{rc.students?.full_name}</TableCell>
                    <TableCell>{rc.class_name}</TableCell>
                    <TableCell>{getStatusBadge(rc.status)}</TableCell>
                    <TableCell className="text-sm">{rc.students?.parent_email || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/report-cards/${rc.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {rc.pdf_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={rc.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {rc.status === 'finalized' && rc.students?.parent_email && (
                          <Link href={`/admin/report-cards/${rc.id}/send`}>
                            <Button variant="default" size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
