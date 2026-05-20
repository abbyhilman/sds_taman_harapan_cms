# PRD: Sistem Manajemen Siswa dan Raport Digital
## SDS Taman Harapan CMS

---

## 1. Executive Summary

Dokumen ini menjelaskan requirements untuk pengembangan fitur **Manajemen Siswa** dan **Raport Digital** pada CMS SDS Taman Harapan. Fitur ini akan memungkinkan admin sekolah untuk mengelola data siswa per kelas, menginput nilai raport, menghasilkan raport dalam format PDF, dan mengirimkan raport digital kepada orang tua/wali siswa.

### Tujuan Utama
- Digitalisasi manajemen data siswa
- Otomasi pembuatan dan distribusi raport
- Meningkatkan efisiensi administrasi sekolah
- Memberikan akses mudah bagi orang tua untuk menerima raport

---

## 2. Background & Problem Statement

### Kondisi Saat Ini
- CMS sudah memiliki fitur PPDB (Penerimaan Peserta Didik Baru)
- Belum ada sistem untuk mengelola siswa yang sudah diterima
- Proses pembuatan dan distribusi raport masih manual
- Tidak ada sistem untuk tracking siswa per kelas

### Masalah yang Perlu Diselesaikan
1. **Manajemen Siswa**: Tidak ada sistem untuk mengelola data siswa aktif per kelas
2. **Input Nilai**: Tidak ada interface untuk input nilai raport
3. **Distribusi Raport**: Proses distribusi raport masih manual dan memakan waktu
4. **Dokumentasi**: Tidak ada arsip digital raport siswa

---

## 3. Goals & Objectives

### Primary Goals
1. Membangun sistem manajemen siswa yang terorganisir per kelas
2. Menyediakan interface untuk input nilai raport
3. Mengotomasi pembuatan raport dalam format PDF
4. Memfasilitasi pengiriman raport digital ke orang tua/wali

### Success Metrics
- Admin dapat mengelola data siswa dengan mudah (CRUD operations)
- Waktu pembuatan raport berkurang 80%
- 100% orang tua dapat menerima raport digital
- Sistem dapat menangani minimal 500 siswa

---

## 4. Target Users

### 4.1 Admin Sekolah
- **Kebutuhan**: Mengelola data siswa, input nilai, generate raport
- **Pain Points**: Proses manual yang memakan waktu
- **Goals**: Efisiensi administrasi

### 4.2 Guru/Wali Kelas
- **Kebutuhan**: Input nilai siswa di kelasnya
- **Pain Points**: Tidak ada sistem digital untuk input nilai
- **Goals**: Kemudahan input dan tracking nilai

### 4.3 Orang Tua/Wali Siswa
- **Kebutuhan**: Menerima raport anak secara digital
- **Pain Points**: Harus datang ke sekolah untuk ambil raport
- **Goals**: Akses mudah ke raport anak

---

## 5. User Stories

### 5.1 Manajemen Siswa
\\\
As an Admin,
I want to add new students to a specific class,
So that I can organize students by their grade level.

As an Admin,
I want to edit student information,
So that I can keep student data up-to-date.

As an Admin,
I want to delete students (with confirmation),
So that I can remove students who have transferred or graduated.

As an Admin,
I want to view all students in a specific class,
So that I can see the class roster.

As an Admin,
I want to see student avatars based on their gender,
So that I can quickly identify students visually.
\\\

### 5.2 Manajemen Raport
\\\
As a Teacher,
I want to input grades for students in my class,
So that I can record their academic performance.

As an Admin,
I want to generate PDF report cards,
So that I can create official documents.

As an Admin,
I want to send report cards to parents via email,
So that parents can receive them digitally.

As a Parent,
I want to receive my child's report card via email,
So that I don't have to come to school to pick it up.
\\\

---

## 6. Functional Requirements

### 6.1 Manajemen Siswa

#### FR-1: Daftar Siswa Per Kelas
- **Priority**: P0 (Must Have)
- **Description**: Sistem harus menampilkan daftar siswa berdasarkan kelas
- **Acceptance Criteria**:
  - Admin dapat memilih kelas dari dropdown (Kelas 1-6)
  - Sistem menampilkan tabel siswa dengan kolom: Avatar, Nama, NISN, Jenis Kelamin, Tanggal Lahir, Nama Orang Tua, Kontak
  - Tabel mendukung sorting dan searching
  - Tabel menampilkan pagination (20 siswa per halaman)

#### FR-2: Tambah Siswa Baru
- **Priority**: P0 (Must Have)
- **Description**: Admin dapat menambahkan siswa baru ke kelas tertentu
- **Acceptance Criteria**:
  - Form input dengan fields: Nama Lengkap, Nama Panggilan, NISN, Jenis Kelamin, Tempat Lahir, Tanggal Lahir, Agama, Alamat, Kelas, Nama Orang Tua, No. HP Orang Tua, Email Orang Tua
  - Validasi semua field required
  - NISN harus unique
  - Avatar otomatis di-assign berdasarkan jenis kelamin
  - Success notification setelah berhasil menambah

#### FR-3: Edit Data Siswa
- **Priority**: P0 (Must Have)
- **Description**: Admin dapat mengubah data siswa yang sudah ada
- **Acceptance Criteria**:
  - Form pre-filled dengan data siswa saat ini
  - Dapat mengubah semua field kecuali NISN
  - Validasi data sebelum update
  - Confirmation dialog sebelum save
  - Success notification setelah berhasil update

#### FR-4: Hapus Siswa
- **Priority**: P0 (Must Have)
- **Description**: Admin dapat menghapus data siswa
- **Acceptance Criteria**:
  - Confirmation dialog dengan warning message
  - Soft delete (data tidak benar-benar dihapus, hanya di-flag)
  - Log aktivitas penghapusan
  - Success notification setelah berhasil hapus

#### FR-5: Avatar Berdasarkan Gender
- **Priority**: P1 (Should Have)
- **Description**: Sistem menampilkan avatar dummy sesuai jenis kelamin
- **Acceptance Criteria**:
  - Avatar laki-laki untuk siswa laki-laki
  - Avatar perempuan untuk siswa perempuan
  - Avatar ditampilkan di list dan detail siswa
  - Avatar dapat di-customize (future enhancement)

#### FR-6: Import Siswa dari PPDB
- **Priority**: P1 (Should Have)
- **Description**: Admin dapat mengimport siswa yang sudah diterima dari data PPDB
- **Acceptance Criteria**:
  - Tombol "Import dari PPDB"
  - Pilih registrasi PPDB dengan status "diterima"
  - Mapping otomatis data PPDB ke data siswa
  - Bulk import dengan progress indicator

### 6.2 Manajemen Raport

#### FR-7: Input Nilai Raport
- **Priority**: P0 (Must Have)
- **Description**: Guru/Admin dapat menginput nilai raport siswa
- **Acceptance Criteria**:
  - Pilih semester (Ganjil/Genap) dan tahun ajaran
  - Pilih kelas
  - Form input nilai per mata pelajaran
  - Mata pelajaran sesuai kurikulum SD: Pendidikan Agama, PKn, Bahasa Indonesia, Matematika, IPA, IPS, Seni Budaya, PJOK, Bahasa Inggris
  - Input nilai: Pengetahuan (0-100), Keterampilan (0-100), Predikat (A/B/C/D - auto calculated)
  - Input catatan/deskripsi per mata pelajaran
  - Auto-save draft
  - Validasi nilai harus 0-100

#### FR-8: Nilai Ekstrakurikuler
- **Priority**: P1 (Should Have)
- **Description**: Input nilai dan catatan ekstrakurikuler
- **Acceptance Criteria**:
  - List ekstrakurikuler yang diikuti siswa
  - Input predikat (A/B/C/D)
  - Input keterangan/catatan

#### FR-9: Catatan Wali Kelas
- **Priority**: P0 (Must Have)
- **Description**: Wali kelas dapat memberikan catatan umum
- **Acceptance Criteria**:
  - Text area untuk catatan wali kelas
  - Character limit 500 karakter
  - Preview sebelum finalize

#### FR-10: Generate PDF Raport
- **Priority**: P0 (Must Have)
- **Description**: Sistem dapat menghasilkan raport dalam format PDF
- **Acceptance Criteria**:
  - Template raport sesuai format standar sekolah
  - Include: Header sekolah, identitas siswa, nilai per mata pelajaran, ekstrakurikuler, catatan wali kelas, tanda tangan digital
  - PDF dapat di-download
  - PDF tersimpan di storage untuk arsip
  - Watermark "SDS Taman Harapan"

#### FR-11: Preview Raport
- **Priority**: P1 (Should Have)
- **Description**: Admin dapat preview raport sebelum finalize
- **Acceptance Criteria**:
  - Preview dalam format web (HTML)
  - Tombol "Generate PDF" setelah preview
  - Tombol "Edit" untuk kembali ke form input

#### FR-12: Kirim Raport ke Orang Tua
- **Priority**: P0 (Must Have)
- **Description**: Sistem dapat mengirim raport PDF ke email orang tua
- **Acceptance Criteria**:
  - Tombol "Kirim ke Orang Tua"
  - Confirmation dialog dengan preview email
  - Email template profesional
  - Attachment PDF raport
  - Email subject: "Raport [Nama Siswa] - Semester [X] Tahun Ajaran [XXXX/XXXX]"
  - Email body: Salam, informasi raport, kontak sekolah
  - Log pengiriman email
  - Status pengiriman (Terkirim/Gagal)
  - Retry mechanism jika gagal

#### FR-13: Bulk Send Raport
- **Priority**: P1 (Should Have)
- **Description**: Admin dapat mengirim raport ke semua orang tua dalam satu kelas sekaligus
- **Acceptance Criteria**:
  - Pilih kelas
  - Pilih semester dan tahun ajaran
  - Checkbox untuk select all atau select individual
  - Progress bar untuk tracking pengiriman
  - Summary report setelah selesai (berhasil/gagal)

#### FR-14: History Raport
- **Priority**: P1 (Should Have)
- **Description**: Sistem menyimpan history raport siswa
- **Acceptance Criteria**:
  - View history raport per siswa
  - Filter by semester dan tahun ajaran
  - Download PDF raport lama
  - Status pengiriman raport

---

## 7. Technical Requirements

### 7.1 Technology Stack
- **Frontend**: Next.js 13 (App Router), TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (untuk PDF dan avatar)
- **PDF Generation**: react-pdf atau jsPDF
- **Email Service**: Resend, SendGrid, atau Supabase Edge Functions dengan SMTP

### 7.2 Performance Requirements
- Page load time < 2 seconds
- PDF generation < 5 seconds per raport
- Email sending < 10 seconds per email
- Support concurrent users: 50+

### 7.3 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### 7.4 Mobile Responsiveness
- Responsive design untuk tablet dan mobile
- Touch-friendly UI elements

---

## 8. Database Schema Design

### 8.1 Table: students

\\\sql
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nisn text UNIQUE NOT NULL,
  full_name text NOT NULL,
  nickname text,
  gender text NOT NULL CHECK (gender IN ('Laki-laki', 'Perempuan')),
  birth_place text,
  birth_date date,
  religion text,
  address text,
  current_class text NOT NULL, -- 'Kelas 1', 'Kelas 2', etc.
  parent_name text NOT NULL,
  parent_phone text NOT NULL,
  parent_email text,
  avatar_url text, -- URL to avatar image
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
  enrollment_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz -- for soft delete
);

CREATE INDEX idx_students_class ON students(current_class) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_status ON students(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_nisn ON students(nisn);
\\\

### 8.2 Table: academic_years

\\\sql
CREATE TABLE academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_name text NOT NULL UNIQUE, -- '2025/2026'
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
\\\

### 8.3 Table: subjects

\\\sql
CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  category text, -- 'Wajib', 'Muatan Lokal'
  order_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default subjects
INSERT INTO subjects (name, code, category, order_position) VALUES
  ('Pendidikan Agama dan Budi Pekerti', 'PAI', 'Wajib', 1),
  ('Pendidikan Pancasila dan Kewarganegaraan', 'PKN', 'Wajib', 2),
  ('Bahasa Indonesia', 'BIND', 'Wajib', 3),
  ('Matematika', 'MTK', 'Wajib', 4),
  ('Ilmu Pengetahuan Alam', 'IPA', 'Wajib', 5),
  ('Ilmu Pengetahuan Sosial', 'IPS', 'Wajib', 6),
  ('Seni Budaya dan Prakarya', 'SBP', 'Wajib', 7),
  ('Pendidikan Jasmani, Olahraga dan Kesehatan', 'PJOK', 'Wajib', 8),
  ('Bahasa Inggris', 'BING', 'Muatan Lokal', 9);
\\\

### 8.4 Table: report_cards

\\\sql
CREATE TABLE report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES academic_years(id),
  semester text NOT NULL CHECK (semester IN ('Ganjil', 'Genap')),
  class_name text NOT NULL, -- snapshot of class at that time
  homeroom_teacher text, -- nama wali kelas
  homeroom_notes text, -- catatan wali kelas
  attendance_sick integer DEFAULT 0,
  attendance_permission integer DEFAULT 0,
  attendance_absent integer DEFAULT 0,
  pdf_url text, -- URL to generated PDF
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'sent')),
  finalized_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, academic_year_id, semester)
);

CREATE INDEX idx_report_cards_student ON report_cards(student_id);
CREATE INDEX idx_report_cards_academic_year ON report_cards(academic_year_id);
CREATE INDEX idx_report_cards_status ON report_cards(status);
\\\

### 8.5 Table: report_card_grades

\\\sql
CREATE TABLE report_card_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id uuid NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id),
  knowledge_score integer CHECK (knowledge_score >= 0 AND knowledge_score <= 100),
  skill_score integer CHECK (skill_score >= 0 AND skill_score <= 100),
  predicate text CHECK (predicate IN ('A', 'B', 'C', 'D')),
  description text, -- deskripsi capaian kompetensi
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(report_card_id, subject_id)
);

CREATE INDEX idx_report_card_grades_report ON report_card_grades(report_card_id);
\\\

### 8.6 Table: extracurriculars

\\\sql
CREATE TABLE extracurriculars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
\\\

### 8.7 Table: report_card_extracurriculars

\\\sql
CREATE TABLE report_card_extracurriculars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id uuid NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
  extracurricular_id uuid NOT NULL REFERENCES extracurriculars(id),
  predicate text CHECK (predicate IN ('A', 'B', 'C', 'D')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(report_card_id, extracurricular_id)
);
\\\

### 8.8 Table: report_card_send_logs

\\\sql
CREATE TABLE report_card_send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id uuid NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_send_logs_report_card ON report_card_send_logs(report_card_id);
CREATE INDEX idx_send_logs_status ON report_card_send_logs(status);
\\\

---

## 9. UI/UX Requirements

### 9.1 Navigation Structure

\\\
Admin Dashboard
├── Siswa
│   ├── Daftar Siswa (per kelas)
│   ├── Tambah Siswa
│   └── Import dari PPDB
├── Raport
│   ├── Input Nilai
│   ├── Daftar Raport
│   ├── Generate PDF
│   └── Kirim Raport
└── Master Data
    ├── Tahun Ajaran
    ├── Mata Pelajaran
    └── Ekstrakurikuler
\\\

### 9.2 Key Screens

#### Screen 1: Daftar Siswa
- **Layout**: Table dengan sidebar filter
- **Components**: 
  - Dropdown filter kelas
  - Search bar (nama/NISN)
  - Table dengan columns: Avatar, Nama, NISN, Gender, Kelas, Orang Tua, Kontak, Actions
  - Action buttons: Edit, Delete, View Detail
  - Floating action button: Tambah Siswa

#### Screen 2: Form Tambah/Edit Siswa
- **Layout**: Form dengan 2 kolom
- **Components**:
  - Avatar preview (auto-generated based on gender)
  - Input fields dengan validation
  - Dropdown untuk gender, agama, kelas
  - Date picker untuk tanggal lahir
  - Save dan Cancel buttons

#### Screen 3: Input Nilai Raport
- **Layout**: Multi-step form atau accordion
- **Components**:
  - Header: Pilih siswa, semester, tahun ajaran
  - Section 1: Nilai Mata Pelajaran (table format)
  - Section 2: Ekstrakurikuler
  - Section 3: Kehadiran
  - Section 4: Catatan Wali Kelas
  - Footer: Save Draft, Preview, Finalize buttons

#### Screen 4: Preview Raport
- **Layout**: Full-width preview dengan sidebar actions
- **Components**:
  - Raport preview (HTML format)
  - Sidebar: Generate PDF, Edit, Send to Parent buttons

#### Screen 5: Daftar Raport
- **Layout**: Table dengan filter
- **Components**:
  - Filter: Kelas, Semester, Tahun Ajaran, Status
  - Table: Nama Siswa, Kelas, Semester, Status, PDF, Actions
  - Bulk actions: Select all, Send to parents

### 9.3 Design Guidelines
- Consistent dengan design system yang sudah ada (Radix UI + Tailwind)
- Color scheme: Primary (blue), Success (green), Warning (yellow), Danger (red)
- Typography: Clear hierarchy, readable font sizes
- Spacing: Consistent padding dan margin
- Icons: Lucide React icons
- Feedback: Toast notifications untuk success/error messages
- Loading states: Skeleton loaders dan spinners

---

## 10. API Endpoints

### 10.1 Students API

\\\
GET    /api/students              - Get all students (with filters)
GET    /api/students/:id          - Get student by ID
POST   /api/students              - Create new student
PUT    /api/students/:id          - Update student
DELETE /api/students/:id          - Delete student (soft delete)
POST   /api/students/import-ppdb  - Import students from PPDB
\\\

### 10.2 Report Cards API

\\\
GET    /api/report-cards                    - Get all report cards (with filters)
GET    /api/report-cards/:id                - Get report card by ID
POST   /api/report-cards                    - Create new report card
PUT    /api/report-cards/:id                - Update report card
DELETE /api/report-cards/:id                - Delete report card
POST   /api/report-cards/:id/finalize       - Finalize report card
POST   /api/report-cards/:id/generate-pdf   - Generate PDF
POST   /api/report-cards/:id/send           - Send to parent
POST   /api/report-cards/bulk-send          - Bulk send to parents
GET    /api/report-cards/student/:studentId - Get student's report card history
\\\

### 10.3 Master Data API

\\\
GET    /api/academic-years        - Get all academic years
POST   /api/academic-years        - Create academic year
PUT    /api/academic-years/:id    - Update academic year

GET    /api/subjects              - Get all subjects
POST   /api/subjects              - Create subject
PUT    /api/subjects/:id          - Update subject

GET    /api/extracurriculars      - Get all extracurriculars
POST   /api/extracurriculars      - Create extracurricular
PUT    /api/extracurriculars/:id  - Update extracurricular
\\\

---

## 11. Integration Requirements

### 11.1 Email Service Integration
- **Options**: Resend, SendGrid, atau AWS SES
- **Requirements**:
  - Email templates dengan HTML
  - Attachment support untuk PDF
  - Delivery tracking
  - Bounce handling
  - Rate limiting

### 11.2 PDF Generation
- **Library**: react-pdf, jsPDF, atau Puppeteer
- **Requirements**:
  - Template-based generation
  - Support untuk bahasa Indonesia
  - Logo dan watermark sekolah
  - Digital signature (optional)

### 11.3 Storage
- **Service**: Supabase Storage
- **Buckets**:
  - vatars: Student avatars
  - eport-cards: Generated PDF files
- **Requirements**:
  - Public access untuk avatars
  - Authenticated access untuk report cards
  - File size limits: Avatar (2MB), PDF (5MB)

---

## 12. Security & Privacy

### 12.1 Authentication & Authorization
- Admin authentication via Supabase Auth
- Role-based access control (Admin, Teacher)
- Row Level Security (RLS) policies untuk semua tables

### 12.2 Data Privacy
- Student data hanya accessible oleh authenticated users
- Report cards hanya bisa diakses oleh admin dan orang tua terkait
- Email addresses di-encrypt di database
- GDPR compliance untuk data deletion

### 12.3 Input Validation
- Server-side validation untuk semua inputs
- XSS protection
- SQL injection prevention (via Supabase)
- File upload validation

---

## 13. Success Metrics

### 13.1 Adoption Metrics
- 100% siswa aktif ter-input dalam sistem (target: 1 bulan)
- 80% raport dikirim via email (target: semester pertama)

### 13.2 Efficiency Metrics
- Waktu input nilai per siswa < 5 menit
- Waktu generate PDF < 5 detik
- Waktu kirim email < 10 detik

### 13.3 Quality Metrics
- Error rate < 1%
- Email delivery rate > 95%
- User satisfaction score > 4/5

---

## 14. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema creation
- [ ] Migration files
- [ ] Basic API endpoints untuk students
- [ ] RLS policies setup

### Phase 2: Student Management (Week 3-4)
- [ ] Student list page dengan filter per kelas
- [ ] Add student form
- [ ] Edit student form
- [ ] Delete student dengan confirmation
- [ ] Avatar system (dummy based on gender)
- [ ] Import from PPDB feature

### Phase 3: Master Data (Week 5)
- [ ] Academic years management
- [ ] Subjects management
- [ ] Extracurriculars management

### Phase 4: Report Card Input (Week 6-7)
- [ ] Report card input form
- [ ] Grades input per subject
- [ ] Extracurricular grades
- [ ] Homeroom teacher notes
- [ ] Attendance input
- [ ] Auto-save draft functionality

### Phase 5: PDF Generation (Week 8)
- [ ] Report card template design
- [ ] PDF generation implementation
- [ ] Preview functionality
- [ ] Storage integration

### Phase 6: Email Distribution (Week 9)
- [ ] Email service integration
- [ ] Email template design
- [ ] Send single report card
- [ ] Bulk send functionality
- [ ] Send logs and tracking

### Phase 7: Testing & Refinement (Week 10)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] User acceptance testing

### Phase 8: Deployment (Week 11)
- [ ] Production deployment
- [ ] Data migration (if needed)
- [ ] User training
- [ ] Documentation

---

## 15. Dependencies & Risks

### 15.1 Dependencies
- Supabase service availability
- Email service provider (Resend/SendGrid)
- PDF generation library compatibility
- Browser support untuk PDF preview

### 15.2 Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Email delivery failures | High | Medium | Implement retry mechanism, use reliable email service |
| PDF generation performance | Medium | Low | Optimize template, use caching, consider background jobs |
| Data migration from PPDB | Medium | Medium | Thorough testing, data validation, rollback plan |
| User adoption resistance | High | Medium | User training, clear documentation, gradual rollout |
| Storage costs | Low | Low | Implement file size limits, cleanup old files |

---

## 16. Future Enhancements (Out of Scope for v1)

- [ ] Parent portal untuk akses raport online
- [ ] Mobile app untuk orang tua
- [ ] Real-time notifications
- [ ] Analytics dashboard untuk performa siswa
- [ ] Export data ke Excel
- [ ] Integration dengan sistem keuangan (SPP)
- [ ] Absensi siswa terintegrasi
- [ ] Custom avatar upload
- [ ] Multi-language support
- [ ] Digital signature untuk raport

---

## 17. Appendix

### 17.1 Glossary
- **NISN**: Nomor Induk Siswa Nasional
- **PPDB**: Penerimaan Peserta Didik Baru
- **RLS**: Row Level Security
- **Raport**: Laporan hasil belajar siswa

### 17.2 References
- Kurikulum 2013 SD
- Permendikbud tentang Penilaian
- Supabase Documentation
- Next.js Documentation

---

**Document Version**: 1.0  
**Last Updated**: 2026-05-20  
**Author**: AI Assistant  
**Status**: Draft - Pending Review
