# EPICS - Sistem Manajemen Siswa dan Raport Digital

> **Project**: SDS Taman Harapan CMS  
> **Version**: 1.0  
> **Last Updated**: 2026-05-21

---

## Overview

Dokumen ini berisi daftar Epics untuk pengembangan fitur Manajemen Siswa dan Raport Digital. Setiap Epic dipecah menjadi User Stories dengan Acceptance Criteria yang jelas.

### Status Legend
- 🟢 **Done** - Sudah diimplementasi
- 🟡 **In Progress** - Sedang dikerjakan
- ⚪ **To Do** - Belum dimulai

---

## Epic 1: Manajemen Data Siswa 🟢

**Status**: Done (Existing)  
**Priority**: P0  
**Description**: Sistem untuk mengelola data siswa aktif per kelas dengan fitur CRUD lengkap.

### User Stories

#### US-1.1: Melihat Daftar Siswa Per Kelas 🟢
**As an** Admin  
**I want to** melihat daftar siswa berdasarkan kelas  
**So that** saya dapat melihat roster kelas dengan mudah

**Acceptance Criteria**:
- [x] Dropdown filter kelas (Kelas 1-6, Semua)
- [x] Tabel menampilkan: Avatar, Nama, NISN, Gender, Kelas, Orang Tua, Kontak, Actions
- [x] Search by nama atau NISN
- [x] Pagination (20 siswa per halaman)
- [x] Sorting by nama dan kelas
- [x] Overview statistics (total, aktif, laki-laki, perempuan)

#### US-1.2: Menambah Siswa Baru 🟢
**As an** Admin  
**I want to** menambahkan siswa baru ke kelas tertentu  
**So that** data siswa tercatat dalam sistem

**Acceptance Criteria**:
- [x] Form input: NISN, Nama Lengkap, Nama Panggilan, Gender, Tempat/Tanggal Lahir, Agama, Alamat, Kelas, Data Orang Tua
- [x] Validasi field required (NISN, nama, tanggal lahir, kelas, data orang tua)
- [x] NISN harus unique
- [x] Success notification setelah berhasil
- [x] Avatar otomatis berdasarkan gender

#### US-1.3: Mengedit Data Siswa 🟢
**As an** Admin  
**I want to** mengubah data siswa yang sudah ada  
**So that** data siswa tetap up-to-date

**Acceptance Criteria**:
- [x] Form pre-filled dengan data existing
- [x] Dapat mengubah semua field
- [x] Validasi data sebelum update
- [x] Success notification setelah berhasil

#### US-1.4: Menghapus Siswa 🟢
**As an** Admin  
**I want to** menghapus data siswa  
**So that** siswa yang pindah/lulus dapat dihapus dari daftar aktif

**Acceptance Criteria**:
- [x] Confirmation dialog sebelum hapus
- [x] Soft delete (deleted_at timestamp)
- [x] Success notification setelah berhasil

#### US-1.5: Import Siswa dari PPDB 🟢
**As an** Admin  
**I want to** mengimport siswa dari data PPDB yang sudah diterima  
**So that** tidak perlu input ulang data siswa

**Acceptance Criteria**:
- [x] Tombol "Import dari PPDB"
- [x] List pendaftar PPDB dengan status "diterima" yang belum diimport
- [x] Input NISN dan pilih kelas saat import
- [x] Mapping otomatis data PPDB ke data siswa
- [x] Tracking ppdb_registration_id untuk mencegah duplikasi

---

## Epic 2: Master Data Management 🟢

**Status**: Done (Implemented)  
**Priority**: P1  
**Description**: Pengelolaan data master untuk sistem raport (tahun ajaran, mata pelajaran, ekstrakurikuler).

> **Implementation**: `app/admin/master-data/page.tsx` (33KB)

### User Stories

#### US-2.1: Manajemen Tahun Ajaran 🟢
**As an** Admin  
**I want to** mengelola data tahun ajaran  
**So that** raport dapat dikategorikan per tahun ajaran

**Acceptance Criteria**:
- [x] CRUD tahun ajaran (nama: "2025/2026", tanggal mulai, tanggal selesai)
- [x] Set tahun ajaran aktif (hanya 1 yang aktif)
- [x] Validasi periode
- [x] List tahun ajaran dengan status aktif/tidak aktif

#### US-2.2: Manajemen Mata Pelajaran 🟢
**As an** Admin  
**I want to** mengelola daftar mata pelajaran  
**So that** nilai raport dapat diinput per mata pelajaran

**Acceptance Criteria**:
- [x] CRUD mata pelajaran (nama, kode, kategori, urutan)
- [x] Kategori: Wajib, Muatan Lokal
- [x] Order position untuk urutan tampilan
- [ ] Drag & drop untuk mengatur urutan (future enhancement)

#### US-2.3: Manajemen Ekstrakurikuler 🟢
**As an** Admin  
**I want to** mengelola daftar ekstrakurikuler  
**So that** nilai ekskul dapat diinput di raport

**Acceptance Criteria**:
- [x] CRUD ekstrakurikuler (nama, deskripsi)
- [x] List ekstrakurikuler dengan order position
- [x] Delete functionality

---

## Epic 3: Input Nilai Raport ⚪

**Status**: To Do  
**Priority**: P0  
**Description**: Sistem untuk menginput nilai raport siswa per semester.

### User Stories

#### US-3.1: Membuat Raport Baru
**As a** Teacher/Admin  
**I want to** membuat raport baru untuk siswa  
**So that** nilai siswa dapat dicatat

**Acceptance Criteria**:
- [ ] Pilih siswa, semester (Ganjil/Genap), tahun ajaran
- [ ] Validasi tidak boleh duplikat (1 siswa, 1 semester, 1 tahun ajaran)
- [ ] Auto-fill kelas siswa saat ini
- [ ] Status default: draft

#### US-3.2: Input Nilai Mata Pelajaran
**As a** Teacher/Admin  
**I want to** menginput nilai per mata pelajaran  
**So that** nilai akademik siswa tercatat

**Acceptance Criteria**:
- [ ] Form input per mata pelajaran
- [ ] Input: Nilai Pengetahuan (0-100), Nilai Keterampilan (0-100)
- [ ] Predikat auto-calculated (A: 90-100, B: 80-89, C: 70-79, D: <70)
- [ ] Input deskripsi capaian kompetensi (opsional)
- [ ] Validasi nilai 0-100
- [ ] Auto-save draft setiap perubahan

#### US-3.3: Input Nilai Ekstrakurikuler
**As a** Teacher/Admin  
**I want to** menginput nilai ekstrakurikuler  
**So that** kegiatan ekskul siswa tercatat

**Acceptance Criteria**:
- [ ] Pilih ekstrakurikuler yang diikuti siswa
- [ ] Input predikat (A/B/C/D)
- [ ] Input catatan/keterangan
- [ ] Dapat menambah/menghapus ekskul yang diikuti

#### US-3.4: Input Data Kehadiran
**As a** Teacher/Admin  
**I want to** menginput data kehadiran siswa  
**So that** absensi tercatat di raport

**Acceptance Criteria**:
- [ ] Input jumlah hari: Sakit, Izin, Tanpa Keterangan
- [ ] Validasi angka positif
- [ ] Total kehadiran dihitung otomatis

#### US-3.5: Input Catatan Wali Kelas
**As a** Teacher/Admin  
**I want to** memberikan catatan umum untuk siswa  
**So that** orang tua mendapat feedback kualitatif

**Acceptance Criteria**:
- [ ] Text area untuk catatan wali kelas
- [ ] Character limit 500 karakter
- [ ] Character counter
- [ ] Input nama wali kelas

---

## Epic 4: Generate & Preview Raport ⚪

**Status**: To Do  
**Priority**: P0  
**Description**: Sistem untuk preview dan generate raport dalam format PDF.

### User Stories

#### US-4.1: Preview Raport
**As an** Admin  
**I want to** melihat preview raport sebelum finalize  
**So that** saya dapat memastikan data sudah benar

**Acceptance Criteria**:
- [ ] Preview dalam format HTML (mirip PDF)
- [ ] Menampilkan semua data: identitas, nilai, ekskul, kehadiran, catatan
- [ ] Tombol "Edit" untuk kembali ke form
- [ ] Tombol "Finalize" untuk mengunci raport

#### US-4.2: Finalize Raport
**As an** Admin  
**I want to** mengunci raport yang sudah selesai  
**So that** data tidak dapat diubah lagi

**Acceptance Criteria**:
- [ ] Confirmation dialog sebelum finalize
- [ ] Status berubah dari "draft" ke "finalized"
- [ ] Timestamp finalized_at tercatat
- [ ] Raport yang sudah finalized tidak bisa diedit (kecuali admin unlock)

#### US-4.3: Generate PDF Raport
**As an** Admin  
**I want to** menghasilkan raport dalam format PDF  
**So that** raport dapat didownload dan dicetak

**Acceptance Criteria**:
- [ ] Template raport sesuai standar sekolah
- [ ] Header: Logo, nama sekolah, alamat
- [ ] Identitas siswa: Nama, NISN, Kelas, Semester, Tahun Ajaran
- [ ] Tabel nilai mata pelajaran dengan predikat
- [ ] Tabel ekstrakurikuler
- [ ] Data kehadiran
- [ ] Catatan wali kelas
- [ ] Tanda tangan digital (nama wali kelas, kepala sekolah)
- [ ] Watermark "SDS Taman Harapan"
- [ ] PDF tersimpan di Supabase Storage
- [ ] URL PDF tersimpan di database

#### US-4.4: Download Raport PDF
**As an** Admin  
**I want to** mendownload raport PDF  
**So that** raport dapat dicetak atau disimpan lokal

**Acceptance Criteria**:
- [ ] Tombol download di list raport
- [ ] Tombol download di detail raport
- [ ] Nama file: "Raport_[NamaSiswa]_[Semester]_[TahunAjaran].pdf"

---

## Epic 5: Distribusi Raport ⚪

**Status**: To Do  
**Priority**: P0  
**Description**: Sistem untuk mengirim raport ke orang tua via email.

### User Stories

#### US-5.1: Kirim Raport ke Orang Tua (Single)
**As an** Admin  
**I want to** mengirim raport ke email orang tua  
**So that** orang tua menerima raport tanpa harus ke sekolah

**Acceptance Criteria**:
- [ ] Tombol "Kirim ke Orang Tua" di detail raport
- [ ] Confirmation dialog dengan preview email
- [ ] Email template profesional dengan branding sekolah
- [ ] Subject: "Raport [Nama Siswa] - Semester [X] Tahun Ajaran [XXXX/XXXX]"
- [ ] Body: Salam, informasi raport, kontak sekolah
- [ ] Attachment: PDF raport
- [ ] Log pengiriman (timestamp, status, error message jika gagal)
- [ ] Status raport berubah ke "sent"
- [ ] Retry mechanism jika gagal

#### US-5.2: Bulk Send Raport
**As an** Admin  
**I want to** mengirim raport ke semua orang tua dalam satu kelas  
**So that** distribusi raport lebih efisien

**Acceptance Criteria**:
- [ ] Filter by kelas, semester, tahun ajaran
- [ ] Checkbox select all / select individual
- [ ] Hanya raport dengan status "finalized" yang bisa dikirim
- [ ] Progress bar tracking pengiriman
- [ ] Summary report: berhasil/gagal dengan detail
- [ ] Rate limiting untuk mencegah spam

#### US-5.3: Melihat History Pengiriman
**As an** Admin  
**I want to** melihat history pengiriman raport  
**So that** saya dapat tracking status pengiriman

**Acceptance Criteria**:
- [ ] List log pengiriman per raport
- [ ] Status: Pending, Sent, Failed
- [ ] Timestamp pengiriman
- [ ] Error message jika gagal
- [ ] Tombol resend untuk yang gagal

---

## Epic 6: Riwayat Raport ⚪

**Status**: To Do  
**Priority**: P1  
**Description**: Sistem untuk melihat arsip raport siswa.

### User Stories

#### US-6.1: Melihat Daftar Raport
**As an** Admin  
**I want to** melihat daftar semua raport  
**So that** saya dapat mengelola raport dengan mudah

**Acceptance Criteria**:
- [ ] Tabel raport dengan filter: Kelas, Semester, Tahun Ajaran, Status
- [ ] Kolom: Nama Siswa, Kelas, Semester, Tahun Ajaran, Status, PDF, Actions
- [ ] Search by nama siswa
- [ ] Pagination
- [ ] Quick actions: View, Edit (jika draft), Download PDF, Send

#### US-6.2: Melihat History Raport Siswa
**As an** Admin  
**I want to** melihat semua raport seorang siswa  
**So that** saya dapat melihat perkembangan siswa

**Acceptance Criteria**:
- [ ] Akses dari detail siswa
- [ ] List raport per semester dan tahun ajaran
- [ ] Status pengiriman
- [ ] Download PDF raport lama

---

## Dependencies Map

```
Epic 1 (Students) ──────────────────────────────────────┐
        │                                               │
        ▼                                               │
Epic 2 (Master Data) ──────────────────────┐            │
        │                                  │            │
        ▼                                  ▼            ▼
Epic 3 (Input Nilai) ──────────────► Epic 4 (Generate PDF)
                                           │
                                           ▼
                                    Epic 5 (Distribusi)
                                           │
                                           ▼
                                    Epic 6 (History)
```

---

## Story Points Estimation

| Epic | Story Points | Complexity | Status |
|------|-------------|------------|--------|
| Epic 1: Manajemen Siswa | 0 (Done) | - | ✅ Done |
| Epic 2: Master Data | 0 (Done) | - | ✅ Done |
| Epic 3: Input Nilai | 21 | High | ⚪ To Do |
| Epic 4: Generate PDF | 13 | High | ⚪ To Do |
| Epic 5: Distribusi | 13 | High | ⚪ To Do |
| Epic 6: History | 5 | Low | ⚪ To Do |
| **Total Remaining** | **52** | - | - |

---

## Technical Notes

### Existing Implementation
- Students CRUD sudah ada di `/app/admin/students/page.tsx`
- Import dari PPDB sudah ada
- UI components menggunakan Radix UI + Tailwind
- State management menggunakan TanStack Query

### New Tables Required
- `academic_years`
- `subjects`
- `report_cards`
- `report_card_grades`
- `extracurriculars`
- `report_card_extracurriculars`
- `report_card_send_logs`

### External Dependencies
- PDF Generation: `@react-pdf/renderer` atau `jspdf`
- Email Service: Resend (recommended untuk Next.js)
