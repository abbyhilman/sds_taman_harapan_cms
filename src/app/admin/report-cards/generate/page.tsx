'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Student = {
  id: string;
  nisn: string;
  full_name: string;
  current_class: string;
};

export default function GenerateReportCardsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const classes = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  const fetchAcademicYears = async () => {
    const { data } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false });
    setAcademicYears(data || []);
    const active = data?.find(y => y.is_active);
    if (active) setSelectedYear(active.id);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('id, nisn, full_name, current_class')
      .eq('current_class', selectedClass)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('full_name');
    setStudents(data || []);
  };

  const toggleStudent = (id: string) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedStudents(newSet);
  };

  const toggleAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleGenerate = async () => {
    if (!selectedYear || !selectedSemester || selectedStudents.size === 0) {
      toast({ title: 'Error', description: 'Pilih tahun ajaran, semester, dan minimal 1 siswa', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const reportCards = Array.from(selectedStudents).map(studentId => ({
      student_id: studentId,
      academic_year_id: selectedYear,
      semester: parseInt(selectedSemester),
      class_name: selectedClass,
      status: 'draft'
    }));

    const { error } = await supabase.from('report_cards').insert(reportCards);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    toast({ title: 'Sukses', description: `${reportCards.length} raport berhasil dibuat` });
    router.push('/admin/report-cards');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/report-cards">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Generate Raport Baru</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Tahun Ajaran & Semester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
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
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pilih Siswa ({selectedStudents.size}/{students.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedStudents.size === students.length ? 'Batal Semua' : 'Pilih Semua'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada siswa aktif di kelas ini
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map(student => (
                  <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <label className="flex-1 cursor-pointer">
                      <span className="font-medium">{student.full_name}</span>
                      <span className="text-sm text-muted-foreground ml-2">({student.nisn})</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Link href="/admin/report-cards">
          <Button variant="outline">Batal</Button>
        </Link>
        <Button onClick={handleGenerate} disabled={loading || selectedStudents.size === 0}>
          {loading ? 'Membuat...' : `Generate ${selectedStudents.size} Raport`}
        </Button>
      </div>
    </div>
  );
}
