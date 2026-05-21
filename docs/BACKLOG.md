# PRODUCT BACKLOG - Sistem Manajemen Siswa dan Raport Digital

> **Project**: SDS Taman Harapan CMS  
> **Version**: 1.0  
> **Last Updated**: 2026-05-21

---

## Backlog Overview

| Priority | Items | Story Points | Status |
|----------|-------|--------------|--------|
| P0 (Must Have) | 12 | 42 | 4 Done, 8 To Do |
| P1 (Should Have) | 8 | 18 | 1 Done, 7 To Do |
| P2 (Nice to Have) | 3 | 5 | To Do |
| **Total** | **23** | **65** | - |

> **Note**: Database schema (B-001, B-002) dan Master Data UI (B-003, B-004, B-013) sudah diimplementasi.

---

## Priority Legend

- **P0 (Must Have)**: Critical untuk MVP, harus selesai
- **P1 (Should Have)**: Penting tapi bisa ditunda jika waktu tidak cukup
- **P2 (Nice to Have)**: Enhancement, bisa masuk backlog future

---

## Product Backlog (Ordered by Priority)

### 🔴 P0 - Must Have (MVP)

| ID | User Story | Epic | SP | Dependencies | Sprint | Status |
|----|------------|------|----|--------------| -------|--------|
| B-001 | Database schema untuk raport system | Foundation | 3 | - | 1 | ✅ Done |
| B-002 | API endpoints untuk master data | Master Data | 3 | B-001 | 1 | ✅ Done |
| B-003 | CRUD Tahun Ajaran | Master Data | 3 | B-002 | 2 | ✅ Done |
| B-004 | CRUD Mata Pelajaran | Master Data | 2 | B-002 | 2 | ✅ Done |
| B-005 | Membuat raport baru | Input Nilai | 3 | B-003, B-004 | 3 | ⚪ To Do |
| B-006 | Input nilai mata pelajaran | Input Nilai | 5 | B-005 | 3-4 | ⚪ To Do |
| B-007 | Input data kehadiran | Input Nilai | 2 | B-005 | 4 | ⚪ To Do |
| B-008 | Input catatan wali kelas | Input Nilai | 2 | B-005 | 4 | ⚪ To Do |
| B-009 | Preview raport (HTML) | Generate PDF | 3 | B-006 | 5 | ⚪ To Do |
| B-010 | Generate PDF raport | Generate PDF | 5 | B-009 | 5-6 | ⚪ To Do |
| B-011 | Kirim raport ke orang tua (single) | Distribusi | 5 | B-010 | 7 | ⚪ To Do |
| B-012 | Daftar raport dengan filter | History | 3 | B-005 | 6 | ⚪ To Do |

**Subtotal P0**: 39 SP (11 SP Done, 28 SP Remaining)

---

### 🟡 P1 - Should Have

| ID | User Story | Epic | SP | Dependencies | Sprint | Status |
|----|------------|------|----|--------------| -------|--------|
| B-013 | CRUD Ekstrakurikuler | Master Data | 2 | B-002 | 2 | ✅ Done |
| B-014 | Input nilai ekstrakurikuler | Input Nilai | 3 | B-005, B-013 | 4 | ⚪ To Do |
| B-015 | Finalize raport (lock editing) | Generate PDF | 2 | B-009 | 5 | ⚪ To Do |
| B-016 | Bulk send raport | Distribusi | 5 | B-011 | 8 | ⚪ To Do |
| B-017 | History pengiriman raport | Distribusi | 2 | B-011 | 8 | ⚪ To Do |
| B-018 | History raport per siswa | History | 2 | B-012 | 9 | ⚪ To Do |
| B-019 | Auto-save draft nilai | Input Nilai | 2 | B-006 | 4 | ⚪ To Do |

**Subtotal P1**: 18 SP (2 SP Done, 16 SP Remaining)

---

### 🟢 P2 - Nice to Have

| ID | User Story | Epic | SP | Dependencies | Sprint |
|----|------------|------|----|--------------| -------|
| B-020 | Drag & drop urutan mata pelajaran | Master Data | 2 | B-004 | - |
| B-021 | Export daftar raport ke Excel | History | 2 | B-012 | - |
| B-022 | Dashboard statistik raport | History | 3 | B-012 | - |

**Subtotal P2**: 7 SP

---

## Detailed Backlog Items

### B-001: Database Schema untuk Raport System
**Priority**: P0  
**Story Points**: 3  
**Epic**: Foundation

**Description**:
Membuat migration file untuk semua tabel yang dibutuhkan sistem raport.

**Technical Tasks**:
- [ ] Create table `academic_years`
- [ ] Create table `subjects` dengan default data
- [ ] Create table `extracurriculars`
- [ ] Create table `report_cards`
- [ ] Create table `report_card_grades`
- [ ] Create table `report_card_extracurriculars`
- [ ] Create table `report_card_send_logs`
- [ ] Setup RLS policies untuk semua tabel
- [ ] Create indexes untuk performance

**Acceptance Criteria**:
- Semua tabel ter-create di Supabase
- RLS policies aktif
- Default subjects ter-insert

---

### B-002: API Endpoints untuk Master Data
**Priority**: P0  
**Story Points**: 3  
**Epic**: Master Data

**Description**:
Membuat API routes untuk CRUD master data.

**Technical Tasks**:
- [ ] GET/POST `/api/academic-years`
- [ ] PUT/DELETE `/api/academic-years/[id]`
- [ ] GET/POST `/api/subjects`
- [ ] PUT/DELETE `/api/subjects/[id]`
- [ ] GET/POST `/api/extracurriculars`
- [ ] PUT/DELETE `/api/extracurriculars/[id]`

**Acceptance Criteria**:
- Semua endpoints berfungsi
- Proper error handling
- Input validation

---

### B-003: CRUD Tahun Ajaran
**Priority**: P0  
**Story Points**: 3  
**Epic**: Master Data

**Description**:
UI untuk mengelola tahun ajaran.

**Technical Tasks**:
- [ ] Page `/admin/master-data/academic-years`
- [ ] List tahun ajaran dengan status
- [ ] Form tambah/edit tahun ajaran
- [ ] Toggle tahun ajaran aktif
- [ ] Validasi periode tidak overlap

**Acceptance Criteria**:
- CRUD berfungsi lengkap
- Hanya 1 tahun ajaran aktif
- Validasi periode

---

### B-004: CRUD Mata Pelajaran
**Priority**: P0  
**Story Points**: 2  
**Epic**: Master Data

**Description**:
UI untuk mengelola mata pelajaran.

**Technical Tasks**:
- [ ] Page `/admin/master-data/subjects`
- [ ] List mata pelajaran dengan kategori
- [ ] Form tambah/edit mata pelajaran
- [ ] Urutan tampilan

**Acceptance Criteria**:
- CRUD berfungsi lengkap
- Kategori: Wajib, Muatan Lokal
- Default subjects tersedia

---

### B-005: Membuat Raport Baru
**Priority**: P0  
**Story Points**: 3  
**Epic**: Input Nilai

**Description**:
Form untuk membuat raport baru.

**Technical Tasks**:
- [ ] Page `/admin/report-cards/new`
- [ ] Select siswa (dengan search)
- [ ] Select semester dan tahun ajaran
- [ ] Validasi duplikasi
- [ ] Create report_card record

**Acceptance Criteria**:
- Dapat membuat raport baru
- Validasi 1 raport per siswa per semester per tahun
- Auto-fill kelas siswa

---

### B-006: Input Nilai Mata Pelajaran
**Priority**: P0  
**Story Points**: 5  
**Epic**: Input Nilai

**Description**:
Form untuk input nilai per mata pelajaran.

**Technical Tasks**:
- [ ] Page `/admin/report-cards/[id]/edit`
- [ ] Form nilai per mata pelajaran
- [ ] Input pengetahuan & keterampilan (0-100)
- [ ] Auto-calculate predikat
- [ ] Input deskripsi (opsional)
- [ ] Validasi nilai

**Acceptance Criteria**:
- Input nilai berfungsi
- Predikat auto-calculated
- Validasi 0-100

---

### B-007: Input Data Kehadiran
**Priority**: P0  
**Story Points**: 2  
**Epic**: Input Nilai

**Description**:
Form untuk input data kehadiran.

**Technical Tasks**:
- [ ] Section kehadiran di form raport
- [ ] Input: Sakit, Izin, Tanpa Keterangan
- [ ] Validasi angka positif

**Acceptance Criteria**:
- Input kehadiran berfungsi
- Validasi angka

---

### B-008: Input Catatan Wali Kelas
**Priority**: P0  
**Story Points**: 2  
**Epic**: Input Nilai

**Description**:
Form untuk catatan wali kelas.

**Technical Tasks**:
- [ ] Section catatan di form raport
- [ ] Textarea dengan character limit 500
- [ ] Character counter
- [ ] Input nama wali kelas

**Acceptance Criteria**:
- Input catatan berfungsi
- Character limit enforced

---

### B-009: Preview Raport (HTML)
**Priority**: P0  
**Story Points**: 3  
**Epic**: Generate PDF

**Description**:
Preview raport dalam format HTML.

**Technical Tasks**:
- [ ] Page `/admin/report-cards/[id]/preview`
- [ ] Template raport HTML
- [ ] Menampilkan semua data
- [ ] Tombol Edit dan Generate PDF

**Acceptance Criteria**:
- Preview mirip format PDF
- Semua data ditampilkan
- Navigation ke edit dan generate

---

### B-010: Generate PDF Raport
**Priority**: P0  
**Story Points**: 5  
**Epic**: Generate PDF

**Description**:
Generate raport dalam format PDF.

**Technical Tasks**:
- [ ] Setup PDF library (@react-pdf/renderer)
- [ ] Template PDF raport
- [ ] Header sekolah dengan logo
- [ ] Tabel nilai
- [ ] Tanda tangan digital
- [ ] Watermark
- [ ] Upload ke Supabase Storage
- [ ] Save URL ke database

**Acceptance Criteria**:
- PDF ter-generate dengan benar
- Template sesuai standar
- PDF tersimpan di storage

---

### B-011: Kirim Raport ke Orang Tua (Single)
**Priority**: P0  
**Story Points**: 5  
**Epic**: Distribusi

**Description**:
Kirim raport via email ke orang tua.

**Technical Tasks**:
- [ ] Setup email service (Resend)
- [ ] Email template HTML
- [ ] API endpoint untuk send
- [ ] Attach PDF
- [ ] Log pengiriman
- [ ] Update status raport

**Acceptance Criteria**:
- Email terkirim dengan attachment
- Log tercatat
- Status updated

---

### B-012: Daftar Raport dengan Filter
**Priority**: P0  
**Story Points**: 3  
**Epic**: History

**Description**:
Halaman daftar semua raport.

**Technical Tasks**:
- [ ] Page `/admin/report-cards`
- [ ] Tabel raport
- [ ] Filter: Kelas, Semester, Tahun Ajaran, Status
- [ ] Search by nama siswa
- [ ] Pagination
- [ ] Quick actions

**Acceptance Criteria**:
- List raport berfungsi
- Filter dan search berfungsi
- Actions berfungsi

---

### B-013: CRUD Ekstrakurikuler
**Priority**: P1  
**Story Points**: 2  
**Epic**: Master Data

**Description**:
UI untuk mengelola ekstrakurikuler.

**Technical Tasks**:
- [ ] Page `/admin/master-data/extracurriculars`
- [ ] List ekstrakurikuler
- [ ] Form tambah/edit

**Acceptance Criteria**:
- CRUD berfungsi lengkap

---

### B-014: Input Nilai Ekstrakurikuler
**Priority**: P1  
**Story Points**: 3  
**Epic**: Input Nilai

**Description**:
Form untuk input nilai ekstrakurikuler.

**Technical Tasks**:
- [ ] Section ekskul di form raport
- [ ] Select ekskul yang diikuti
- [ ] Input predikat dan catatan
- [ ] Add/remove ekskul

**Acceptance Criteria**:
- Input ekskul berfungsi
- Dapat add/remove

---

### B-015: Finalize Raport
**Priority**: P1  
**Story Points**: 2  
**Epic**: Generate PDF

**Description**:
Lock raport agar tidak bisa diedit.

**Technical Tasks**:
- [ ] Tombol Finalize
- [ ] Confirmation dialog
- [ ] Update status ke "finalized"
- [ ] Disable edit untuk finalized

**Acceptance Criteria**:
- Finalize berfungsi
- Edit disabled setelah finalize

---

### B-016: Bulk Send Raport
**Priority**: P1  
**Story Points**: 5  
**Epic**: Distribusi

**Description**:
Kirim raport ke banyak orang tua sekaligus.

**Technical Tasks**:
- [ ] UI bulk select
- [ ] Progress tracking
- [ ] Rate limiting
- [ ] Summary report

**Acceptance Criteria**:
- Bulk send berfungsi
- Progress ditampilkan
- Summary tersedia

---

### B-017: History Pengiriman Raport
**Priority**: P1  
**Story Points**: 2  
**Epic**: Distribusi

**Description**:
Melihat log pengiriman raport.

**Technical Tasks**:
- [ ] List send logs per raport
- [ ] Status: Pending, Sent, Failed
- [ ] Tombol resend

**Acceptance Criteria**:
- History ditampilkan
- Resend berfungsi

---

### B-018: History Raport per Siswa
**Priority**: P1  
**Story Points**: 2  
**Epic**: History

**Description**:
Melihat semua raport seorang siswa.

**Technical Tasks**:
- [ ] Section di detail siswa
- [ ] List raport per semester
- [ ] Download PDF

**Acceptance Criteria**:
- History per siswa ditampilkan
- Download berfungsi

---

### B-019: Auto-save Draft Nilai
**Priority**: P1  
**Story Points**: 2  
**Epic**: Input Nilai

**Description**:
Auto-save nilai saat input.

**Technical Tasks**:
- [ ] Debounced auto-save
- [ ] Indicator "Saving..." / "Saved"
- [ ] Handle offline

**Acceptance Criteria**:
- Auto-save berfungsi
- Indicator ditampilkan

---

## Backlog Refinement Notes

### Technical Debt to Address
1. Perlu setup storage bucket baru untuk report-cards
2. Perlu setup email service (Resend API key)
3. Perlu install PDF library

### Risks
1. **Email delivery** - Mitigasi: gunakan reliable provider (Resend)
2. **PDF performance** - Mitigasi: background job jika perlu
3. **Data migration** - Mitigasi: thorough testing

### Out of Scope (Future Backlog)
- Parent portal
- Mobile app
- Real-time notifications
- Analytics dashboard
- Multi-language support
