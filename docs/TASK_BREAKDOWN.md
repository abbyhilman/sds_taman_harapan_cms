# TASK BREAKDOWN - Sistem Manajemen Siswa dan Raport Digital

> **Project**: SDS Taman Harapan CMS  
> **Version**: 1.0  
> **Last Updated**: 2026-05-21

---

## Task Estimation Guide

| Size | Hours | Description |
|------|-------|-------------|
| XS | 1-2h | Simple change, single file |
| S | 2-4h | Small feature, few files |
| M | 4-8h | Medium feature, multiple files |
| L | 8-16h | Large feature, complex logic |
| XL | 16-24h | Very large, multiple components |

---

## B-001: Database Schema untuk Raport System

**Story Points**: 3  
**Sprint**: 1  
**Total Estimated Hours**: 8-12h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 1.1 | Create migration file structure | XS | 1h | Backend | ⬜ |
| 1.2 | Define `academic_years` table | XS | 1h | Backend | ⬜ |
| 1.3 | Define `subjects` table dengan default data | S | 2h | Backend | ⬜ |
| 1.4 | Define `extracurriculars` table | XS | 1h | Backend | ⬜ |
| 1.5 | Define `report_cards` table | S | 2h | Backend | ⬜ |
| 1.6 | Define `report_card_grades` table | S | 2h | Backend | ⬜ |
| 1.7 | Define `report_card_extracurriculars` table | XS | 1h | Backend | ⬜ |
| 1.8 | Define `report_card_send_logs` table | XS | 1h | Backend | ⬜ |
| 1.9 | Setup RLS policies untuk semua tabel | S | 2h | Backend | ⬜ |
| 1.10 | Create indexes untuk performance | XS | 1h | Backend | ⬜ |
| 1.11 | Test migration di local | S | 2h | Backend | ⬜ |

### Technical Details

```sql
-- File: supabase/migrations/[timestamp]_create_raport_tables.sql

-- 1. academic_years
CREATE TABLE academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_name text NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. subjects (dengan default data)
-- 3. extracurriculars
-- 4. report_cards
-- 5. report_card_grades
-- 6. report_card_extracurriculars
-- 7. report_card_send_logs
-- 8. RLS policies
-- 9. Indexes
```

### Acceptance Criteria
- [ ] Migration file valid dan dapat dijalankan
- [ ] Semua tabel ter-create
- [ ] Default subjects ter-insert
- [ ] RLS policies aktif
- [ ] Indexes ter-create

---

## B-002: API Endpoints untuk Master Data

**Story Points**: 3  
**Sprint**: 1  
**Total Estimated Hours**: 10-14h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 2.1 | Create `/api/academic-years/route.ts` (GET, POST) | S | 3h | Backend | ⬜ |
| 2.2 | Create `/api/academic-years/[id]/route.ts` (GET, PUT, DELETE) | S | 3h | Backend | ⬜ |
| 2.3 | Create `/api/subjects/route.ts` (GET, POST) | S | 2h | Backend | ⬜ |
| 2.4 | Create `/api/subjects/[id]/route.ts` (GET, PUT, DELETE) | S | 2h | Backend | ⬜ |
| 2.5 | Create `/api/extracurriculars/route.ts` (GET, POST) | S | 2h | Backend | ⬜ |
| 2.6 | Create `/api/extracurriculars/[id]/route.ts` (GET, PUT, DELETE) | S | 2h | Backend | ⬜ |
| 2.7 | Add input validation dengan Zod | S | 2h | Backend | ⬜ |
| 2.8 | Test semua endpoints | S | 2h | Backend | ⬜ |

### File Structure
```
app/api/
├── academic-years/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE
├── subjects/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
└── extracurriculars/
    ├── route.ts
    └── [id]/
        └── route.ts
```

### Acceptance Criteria
- [ ] Semua CRUD endpoints berfungsi
- [ ] Input validation dengan error messages
- [ ] Proper HTTP status codes
- [ ] Error handling

---

## B-003: CRUD Tahun Ajaran

**Story Points**: 3  
**Sprint**: 2  
**Total Estimated Hours**: 10-14h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 3.1 | Create page `/admin/master-data/academic-years/page.tsx` | M | 4h | Frontend | ⬜ |
| 3.2 | Create AcademicYearForm component | S | 3h | Frontend | ⬜ |
| 3.3 | Implement list dengan TanStack Query | S | 2h | Frontend | ⬜ |
| 3.4 | Implement create mutation | S | 2h | Frontend | ⬜ |
| 3.5 | Implement update mutation | S | 2h | Frontend | ⬜ |
| 3.6 | Implement delete dengan confirmation | S | 2h | Frontend | ⬜ |
| 3.7 | Implement toggle active status | S | 2h | Frontend | ⬜ |
| 3.8 | Add date range validation | S | 2h | Frontend | ⬜ |

### Component Structure
```tsx
// page.tsx
- Header dengan tombol "Tambah Tahun Ajaran"
- Table: Nama, Periode, Status, Actions
- Dialog form untuk create/edit
- AlertDialog untuk delete confirmation

// AcademicYearForm.tsx
- Input: year_name (text)
- Input: start_date (date picker)
- Input: end_date (date picker)
- Switch: is_active
- Validation: end_date > start_date
```

### Acceptance Criteria
- [ ] List tahun ajaran ditampilkan
- [ ] Create berfungsi dengan validasi
- [ ] Edit berfungsi
- [ ] Delete dengan confirmation
- [ ] Toggle active berfungsi
- [ ] Hanya 1 tahun ajaran aktif

---

## B-004: CRUD Mata Pelajaran

**Story Points**: 2  
**Sprint**: 2  
**Total Estimated Hours**: 6-10h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 4.1 | Create page `/admin/master-data/subjects/page.tsx` | M | 4h | Frontend | ⬜ |
| 4.2 | Create SubjectForm component | S | 2h | Frontend | ⬜ |
| 4.3 | Implement CRUD operations | S | 3h | Frontend | ⬜ |
| 4.4 | Group by category (Wajib/Muatan Lokal) | S | 2h | Frontend | ⬜ |

### Acceptance Criteria
- [ ] List mata pelajaran dengan kategori
- [ ] CRUD berfungsi
- [ ] Default subjects tersedia
- [ ] Urutan tampilan sesuai order_position

---

## B-005: Membuat Raport Baru

**Story Points**: 3  
**Sprint**: 3  
**Total Estimated Hours**: 10-14h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 5.1 | Create page `/admin/report-cards/new/page.tsx` | M | 4h | Frontend | ⬜ |
| 5.2 | Create StudentSelector component dengan search | M | 4h | Frontend | ⬜ |
| 5.3 | Create SemesterSelector component | S | 2h | Frontend | ⬜ |
| 5.4 | Create AcademicYearSelector component | S | 2h | Frontend | ⬜ |
| 5.5 | Create API `/api/report-cards/route.ts` (POST) | S | 3h | Backend | ⬜ |
| 5.6 | Add duplicate validation | S | 2h | Backend | ⬜ |
| 5.7 | Redirect ke edit page setelah create | XS | 1h | Frontend | ⬜ |

### Component Structure
```tsx
// page.tsx - Create Report Card
<Card>
  <CardHeader>Buat Raport Baru</CardHeader>
  <CardContent>
    <StudentSelector /> // Combobox dengan search
    <SemesterSelector /> // Radio: Ganjil/Genap
    <AcademicYearSelector /> // Select dari active years
    <Button>Buat Raport</Button>
  </CardContent>
</Card>
```

### Acceptance Criteria
- [ ] Dapat memilih siswa dengan search
- [ ] Dapat memilih semester
- [ ] Dapat memilih tahun ajaran
- [ ] Validasi duplikasi
- [ ] Redirect ke edit setelah create

---

## B-006: Input Nilai Mata Pelajaran

**Story Points**: 5  
**Sprint**: 3-4  
**Total Estimated Hours**: 16-24h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 6.1 | Create page `/admin/report-cards/[id]/edit/page.tsx` | L | 8h | Frontend | ⬜ |
| 6.2 | Create GradeInputTable component | M | 6h | Frontend | ⬜ |
| 6.3 | Create GradeInputRow component | M | 4h | Frontend | ⬜ |
| 6.4 | Implement auto-calculate predikat | S | 2h | Frontend | ⬜ |
| 6.5 | Create API `/api/report-cards/[id]/route.ts` (GET, PUT) | M | 4h | Backend | ⬜ |
| 6.6 | Create API `/api/report-cards/[id]/grades/route.ts` | M | 4h | Backend | ⬜ |
| 6.7 | Add input validation (0-100) | S | 2h | Frontend | ⬜ |

### Component Structure
```tsx
// GradeInputTable.tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>No</TableHead>
      <TableHead>Mata Pelajaran</TableHead>
      <TableHead>Pengetahuan</TableHead>
      <TableHead>Keterampilan</TableHead>
      <TableHead>Predikat</TableHead>
      <TableHead>Deskripsi</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {subjects.map(subject => (
      <GradeInputRow key={subject.id} subject={subject} />
    ))}
  </TableBody>
</Table>

// GradeInputRow.tsx
<TableRow>
  <TableCell>{index + 1}</TableCell>
  <TableCell>{subject.name}</TableCell>
  <TableCell>
    <Input type="number" min={0} max={100} />
  </TableCell>
  <TableCell>
    <Input type="number" min={0} max={100} />
  </TableCell>
  <TableCell>
    <Badge>{calculatePredicate(avg)}</Badge>
  </TableCell>
  <TableCell>
    <Textarea placeholder="Deskripsi capaian..." />
  </TableCell>
</TableRow>
```

### Predikat Calculation
```typescript
function calculatePredicate(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}
```

### Acceptance Criteria
- [ ] Form input nilai per mata pelajaran
- [ ] Input pengetahuan & keterampilan (0-100)
- [ ] Predikat auto-calculated
- [ ] Deskripsi opsional
- [ ] Validasi nilai

---

## B-007: Input Data Kehadiran

**Story Points**: 2  
**Sprint**: 4  
**Total Estimated Hours**: 6-8h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 7.1 | Create AttendanceSection component | S | 3h | Frontend | ⬜ |
| 7.2 | Add to edit page | XS | 1h | Frontend | ⬜ |
| 7.3 | Implement save logic | S | 2h | Frontend | ⬜ |
| 7.4 | Add validation (positive numbers) | XS | 1h | Frontend | ⬜ |

### Component Structure
```tsx
// AttendanceSection.tsx
<Card>
  <CardHeader>Data Kehadiran</CardHeader>
  <CardContent className="grid grid-cols-3 gap-4">
    <div>
      <Label>Sakit (hari)</Label>
      <Input type="number" min={0} />
    </div>
    <div>
      <Label>Izin (hari)</Label>
      <Input type="number" min={0} />
    </div>
    <div>
      <Label>Tanpa Keterangan (hari)</Label>
      <Input type="number" min={0} />
    </div>
  </CardContent>
</Card>
```

### Acceptance Criteria
- [ ] Input kehadiran berfungsi
- [ ] Validasi angka positif
- [ ] Data tersimpan

---

## B-008: Input Catatan Wali Kelas

**Story Points**: 2  
**Sprint**: 4  
**Total Estimated Hours**: 6-8h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 8.1 | Create HomeroomNotesSection component | S | 3h | Frontend | ⬜ |
| 8.2 | Add character counter | XS | 1h | Frontend | ⬜ |
| 8.3 | Add teacher name input | XS | 1h | Frontend | ⬜ |
| 8.4 | Implement save logic | S | 2h | Frontend | ⬜ |

### Component Structure
```tsx
// HomeroomNotesSection.tsx
<Card>
  <CardHeader>Catatan Wali Kelas</CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label>Nama Wali Kelas</Label>
      <Input placeholder="Nama lengkap wali kelas" />
    </div>
    <div>
      <Label>Catatan</Label>
      <Textarea 
        maxLength={500}
        placeholder="Catatan untuk siswa..."
      />
      <p className="text-sm text-muted-foreground">
        {notes.length}/500 karakter
      </p>
    </div>
  </CardContent>
</Card>
```

### Acceptance Criteria
- [ ] Input catatan berfungsi
- [ ] Character limit 500
- [ ] Character counter ditampilkan
- [ ] Nama wali kelas tersimpan

---

## B-009: Preview Raport (HTML)

**Story Points**: 3  
**Sprint**: 5  
**Total Estimated Hours**: 10-14h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 9.1 | Create page `/admin/report-cards/[id]/preview/page.tsx` | M | 4h | Frontend | ⬜ |
| 9.2 | Create ReportCardPreview component | L | 6h | Frontend | ⬜ |
| 9.3 | Style to match PDF output | M | 4h | Frontend | ⬜ |
| 9.4 | Add action buttons (Edit, Finalize, Generate PDF) | S | 2h | Frontend | ⬜ |

### Component Structure
```tsx
// ReportCardPreview.tsx
<div className="bg-white p-8 max-w-4xl mx-auto">
  {/* Header */}
  <div className="text-center border-b pb-4">
    <img src="/logo_tamhar.png" className="h-16 mx-auto" />
    <h1>SDS TAMAN HARAPAN</h1>
    <p>Alamat sekolah...</p>
  </div>
  
  {/* Title */}
  <h2 className="text-center my-4">
    LAPORAN HASIL BELAJAR SISWA
  </h2>
  
  {/* Student Info */}
  <div className="grid grid-cols-2 gap-4">
    <div>Nama: {student.full_name}</div>
    <div>NISN: {student.nisn}</div>
    <div>Kelas: {reportCard.class_name}</div>
    <div>Semester: {reportCard.semester}</div>
  </div>
  
  {/* Grades Table */}
  <GradesTable grades={grades} />
  
  {/* Extracurriculars */}
  <ExtracurricularsTable extracurriculars={extracurriculars} />
  
  {/* Attendance */}
  <AttendanceSummary attendance={attendance} />
  
  {/* Notes */}
  <HomeroomNotes notes={reportCard.homeroom_notes} />
  
  {/* Signatures */}
  <SignatureSection />
</div>
```

### Acceptance Criteria
- [ ] Preview menampilkan semua data
- [ ] Layout mirip PDF
- [ ] Action buttons berfungsi

---

## B-010: Generate PDF Raport

**Story Points**: 5  
**Sprint**: 5-6  
**Total Estimated Hours**: 16-24h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 10.1 | Install @react-pdf/renderer | XS | 1h | Backend | ⬜ |
| 10.2 | Create PDF template components | L | 8h | Frontend | ⬜ |
| 10.3 | Add school logo dan watermark | M | 4h | Frontend | ⬜ |
| 10.4 | Create API `/api/report-cards/[id]/generate-pdf` | M | 4h | Backend | ⬜ |
| 10.5 | Upload PDF ke Supabase Storage | S | 3h | Backend | ⬜ |
| 10.6 | Save PDF URL ke database | S | 2h | Backend | ⬜ |
| 10.7 | Add download button | S | 2h | Frontend | ⬜ |

### PDF Template Structure
```tsx
// components/pdf/ReportCardPDF.tsx
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const ReportCardPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with logo */}
      <View style={styles.header}>
        <Image src="/logo_tamhar.png" style={styles.logo} />
        <Text style={styles.schoolName}>SDS TAMAN HARAPAN</Text>
      </View>
      
      {/* Student info */}
      <View style={styles.studentInfo}>...</View>
      
      {/* Grades table */}
      <View style={styles.gradesTable}>...</View>
      
      {/* Signatures */}
      <View style={styles.signatures}>...</View>
      
      {/* Watermark */}
      <Text style={styles.watermark}>SDS Taman Harapan</Text>
    </Page>
  </Document>
);
```

### Acceptance Criteria
- [ ] PDF ter-generate dengan benar
- [ ] Template sesuai standar
- [ ] Logo dan watermark ada
- [ ] PDF tersimpan di storage
- [ ] Download berfungsi

---

## B-011: Kirim Raport ke Orang Tua (Single)

**Story Points**: 5  
**Sprint**: 7  
**Total Estimated Hours**: 16-20h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 11.1 | Setup Resend account | XS | 1h | Backend | ⬜ |
| 11.2 | Add RESEND_API_KEY to env | XS | 0.5h | Backend | ⬜ |
| 11.3 | Create email template HTML | M | 4h | Frontend | ⬜ |
| 11.4 | Create API `/api/report-cards/[id]/send` | M | 6h | Backend | ⬜ |
| 11.5 | Implement PDF attachment | S | 3h | Backend | ⬜ |
| 11.6 | Create send log record | S | 2h | Backend | ⬜ |
| 11.7 | Update raport status | S | 2h | Backend | ⬜ |
| 11.8 | Add UI button dan confirmation | S | 3h | Frontend | ⬜ |

### Email Template
```html
<!-- emails/report-card.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #1e40af; color: white; padding: 20px; }
    .content { padding: 20px; }
    .footer { background: #f3f4f6; padding: 20px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SDS Taman Harapan</h1>
  </div>
  <div class="content">
    <p>Yth. Bapak/Ibu {{parent_name}},</p>
    <p>Bersama email ini kami sampaikan Laporan Hasil Belajar (Raport) 
       putra/putri Bapak/Ibu:</p>
    <ul>
      <li>Nama: {{student_name}}</li>
      <li>Kelas: {{class_name}}</li>
      <li>Semester: {{semester}}</li>
      <li>Tahun Ajaran: {{academic_year}}</li>
    </ul>
    <p>Raport terlampir dalam format PDF.</p>
    <p>Hormat kami,<br>SDS Taman Harapan</p>
  </div>
  <div class="footer">
    <p>SDS Taman Harapan | Alamat | Telp: xxx</p>
  </div>
</body>
</html>
```

### Acceptance Criteria
- [ ] Email terkirim dengan attachment
- [ ] Template profesional
- [ ] Log tercatat
- [ ] Status updated ke "sent"
- [ ] Error handling

---

## B-012: Daftar Raport dengan Filter

**Story Points**: 3  
**Sprint**: 6  
**Total Estimated Hours**: 10-14h

### Tasks

| # | Task | Size | Hours | Owner | Status |
|---|------|------|-------|-------|--------|
| 12.1 | Create page `/admin/report-cards/page.tsx` | M | 6h | Frontend | ⬜ |
| 12.2 | Create ReportCardFilters component | S | 3h | Frontend | ⬜ |
| 12.3 | Create ReportCardTable component | M | 4h | Frontend | ⬜ |
| 12.4 | Implement pagination | S | 2h | Frontend | ⬜ |
| 12.5 | Add quick actions | S | 2h | Frontend | ⬜ |

### Component Structure
```tsx
// page.tsx
<div className="space-y-4">
  <div className="flex justify-between">
    <h1>Daftar Raport</h1>
    <Button>Buat Raport Baru</Button>
  </div>
  
  <ReportCardFilters 
    onFilterChange={handleFilterChange}
  />
  
  <ReportCardTable 
    data={reportCards}
    onView={handleView}
    onEdit={handleEdit}
    onDownload={handleDownload}
    onSend={handleSend}
  />
  
  <Pagination 
    currentPage={page}
    totalPages={totalPages}
    onPageChange={setPage}
  />
</div>
```

### Acceptance Criteria
- [ ] List raport ditampilkan
- [ ] Filter berfungsi (Kelas, Semester, Tahun, Status)
- [ ] Search by nama siswa
- [ ] Pagination berfungsi
- [ ] Quick actions berfungsi

---

## Summary

| Backlog Item | Total Tasks | Total Hours |
|--------------|-------------|-------------|
| B-001 | 11 | 8-12h |
| B-002 | 8 | 10-14h |
| B-003 | 8 | 10-14h |
| B-004 | 4 | 6-10h |
| B-005 | 7 | 10-14h |
| B-006 | 7 | 16-24h |
| B-007 | 4 | 6-8h |
| B-008 | 4 | 6-8h |
| B-009 | 4 | 10-14h |
| B-010 | 7 | 16-24h |
| B-011 | 8 | 16-20h |
| B-012 | 5 | 10-14h |
| **Total** | **77** | **124-176h** |

**Estimated Total**: ~150 hours (19 working days @ 8h/day)
