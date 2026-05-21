# SPRINT PLAN - Sistem Manajemen Siswa dan Raport Digital

> **Project**: SDS Taman Harapan CMS  
> **Version**: 1.0  
> **Last Updated**: 2026-05-21  
> **Sprint Duration**: 1 minggu per sprint  
> **Total Sprints**: 11 sprints

---

## Sprint Overview

| Sprint | Focus | Story Points | Deliverables | Status |
|--------|-------|--------------|--------------|--------|
| 1 | Foundation | 6 | Database schema, API setup | ✅ Done |
| 2 | Master Data | 7 | Tahun Ajaran, Mata Pelajaran, Ekskul | ✅ Done |
| 3 | Input Nilai (Part 1) | 8 | Create raport, Input nilai mapel | ⚪ Next |
| 4 | Input Nilai (Part 2) | 9 | Kehadiran, Catatan, Ekskul, Auto-save | ⚪ To Do |
| 5 | Generate PDF (Part 1) | 8 | Preview, Finalize, PDF template | ⚪ To Do |
| 6 | Generate PDF (Part 2) | 8 | PDF generation, List raport | ⚪ To Do |
| 7 | Distribusi (Part 1) | 5 | Email setup, Single send | ⚪ To Do |
| 8 | Distribusi (Part 2) | 7 | Bulk send, Send history | ⚪ To Do |
| 9 | History & Polish | 4 | History per siswa, Bug fixes | ⚪ To Do |
| 10 | Testing | 0 | E2E testing, UAT | ⚪ To Do |
| 11 | Deployment | 0 | Production deploy, Documentation | ⚪ To Do |

**Completed**: 13 SP (Sprint 1-2)  
**Remaining**: 49 SP (Sprint 3-9)

---

## Sprint Details

### Sprint 1: Foundation ✅
**Duration**: Week 1  
**Goal**: Setup database schema dan API foundation  
**Story Points**: 6  
**Status**: ✅ COMPLETED

#### Backlog Items
| ID | Item | SP | Status |
|----|------|----|--------|
| B-001 | Database schema untuk raport system | 3 | ✅ Done |
| B-002 | API endpoints untuk master data | 3 | ✅ Done |

#### Completion Notes
- Tabel `academic_years`, `subjects`, `extracurriculars` sudah ada di Supabase
- Tabel `students`, `ppdb_registrations` sudah ada
- RLS policies aktif
- API menggunakan Supabase client langsung (tidak perlu custom API routes)

---

### Sprint 2: Master Data ✅
**Duration**: Week 2  
**Goal**: UI untuk mengelola master data  
**Story Points**: 7  
**Status**: ✅ COMPLETED

#### Backlog Items
| ID | Item | SP | Status |
|----|------|----|--------|
| B-003 | CRUD Tahun Ajaran | 3 | ✅ Done |
| B-004 | CRUD Mata Pelajaran | 2 | ✅ Done |
| B-013 | CRUD Ekstrakurikuler | 2 | ✅ Done |

#### Completion Notes
- Implementasi di `app/admin/master-data/page.tsx` (33KB)
- UI menggunakan Tabs untuk 3 section
- CRUD lengkap dengan TanStack Query
- Validasi dan toast notifications
- Sidebar navigation sudah ada

---

### Sprint 3: Input Nilai (Part 1)
**Duration**: Week 3  
**Goal**: Membuat raport baru dan input nilai mata pelajaran  
**Story Points**: 8

#### Backlog Items
| ID | Item | SP | Owner |
|----|------|----| ------|
| B-005 | Membuat raport baru | 3 | Full-stack |
| B-006 | Input nilai mata pelajaran (partial) | 5 | Full-stack |

#### Sprint Tasks
- [ ] Create page `/admin/report-cards/new`
- [ ] Student selector dengan search
- [ ] Semester dan tahun ajaran selector
- [ ] Validasi duplikasi raport
- [ ] Create page `/admin/report-cards/[id]/edit`
- [ ] Form input nilai per mata pelajaran
- [ ] Auto-calculate predikat
- [ ] Validasi nilai 0-100

#### Definition of Done
- [ ] Dapat membuat raport baru
- [ ] Dapat input nilai mata pelajaran
- [ ] Predikat auto-calculated
- [ ] Validasi berjalan
- [ ] Code reviewed

#### Risks & Blockers
- Complex form state management
- Performance dengan banyak input fields

---

### Sprint 4: Input Nilai (Part 2)
**Duration**: Week 4  
**Goal**: Lengkapi semua input raport  
**Story Points**: 9

#### Backlog Items
| ID | Item | SP | Owner |
|----|------|----| ------|
| B-007 | Input data kehadiran | 2 | Frontend |
| B-008 | Input catatan wali kelas | 2 | Frontend |
| B-014 | Input nilai ekstrakurikuler | 3 | Frontend |
| B-019 | Auto-save draft nilai | 2 | Frontend |

#### Sprint Tasks
- [ ] Section kehadiran (sakit, izin, alpha)
- [ ] Section catatan wali kelas dengan character limit
- [ ] Section ekstrakurikuler dengan add/remove
- [ ] Implement debounced auto-save
- [ ] Save indicator ("Saving..." / "Saved")
- [ ] Handle save errors gracefully

#### Definition of Done
- [ ] Semua section input berfungsi
- [ ] Auto-save berjalan smooth
- [ ] Character counter berfungsi
- [ ] No data loss on navigation
- [ ] Code reviewed

#### Risks & Blockers
- Auto-save race conditions
- Complex state management

---

### Sprint 5: Generate PDF (Part 1)
**Duration**: Week 5  
**Goal**: Preview raport dan finalize  
**Story Points**: 8

#### Backlog Items
| ID | Item | SP | Owner |
|----|------|----| ------|
| B-009 | Preview raport (HTML) | 3 | Frontend |
| B-015 | Finalize raport | 2 | Full-stack |
| B-010 | Generate PDF raport (partial - template) | 3 | Frontend |

#### Sprint Tasks
- [ ] Create page `/admin/report-cards/[id]/preview`
- [ ] HTML template raport (mirip PDF)
- [ ] Tombol Edit dan Finalize
- [ ] Finalize confirmation dialog
- [ ] Update status ke "finalized"
- [ ] Disable edit untuk finalized raport
- [ ] Install @react-pdf/renderer
- [ ] Create PDF template components

#### Definition of Done
- [ ] Preview menampilkan semua data
- [ ] Finalize berfungsi
- [ ] Edit disabled setelah finalize
- [ ] PDF template siap
- [ ] Code reviewed

#### Risks & Blockers
- PDF library compatibility
- Template styling complexity

---

### Sprint 6: Generate PDF (Part 2)
**Duration**: Week 6  
**Goal**: Complete PDF generation dan list raport  
**Story Points**: 8

#### Backlog Items
| ID | Item | SP | Owner |
|----|------|----| ------|
| B-010 | Generate PDF raport (complete) | 2 | Full-stack |
| B-012 | Daftar raport dengan filter | 3 | Frontend |

#### Sprint Tasks
- [ ] Complete PDF generation logic
- [ ] Add school logo dan watermark
- [ ] Upload PDF ke Supabase Storage
- [ ] Save PDF URL ke database
- [ ] Create page `/admin/report-cards`
- [ ] Tabel raport dengan pagination
- [ ] Filter: Kelas, Semester, Tahun Ajaran, Status
- [ ] Search by nama siswa
- [ ] Quick actions (View, Edit, Download, Send)

#### Definition of Done
- [ ] PDF ter-generate dengan benar
- [ ] PDF tersimpan di storage
- [ ] List raport berfungsi dengan filter
- [ ] Download PDF berfungsi
- [ ] Code reviewed

#### Risks & Blockers
- Storage bucket permissions
- PDF file size

---

### Sprint 7: Distribusi (Part 1)
**Duration**: Week 7  
**Goal**: Setup email dan single send  
**Story Points**: 5

#### Backlog Items
| ID | Item | SP | Owner |
|----|------|----| ------|
| B-011 | Kirim raport ke orang tua (single) | 5 | Full-stack |

#### Sprint Tasks
- [ ] Setup Resend account dan API key
- [ ] Create email template HTML
- [ ] API endpoint `/api/report-cards/[id]/send`
- [ ] Attach PDF ke email
- [ ] Create send log record
- [ ] Update raport status ke "sent"
- [ ] Handle send errors
- [ ] UI tombol "Kirim ke Orang Tua"
- [ ] Confirmation dialog dengan preview

#### Definition of Done
- [ ] Email terkirim dengan attachment
- [ ] Log tercatat di database
- [ ] Status updated
- [ ] Error handling berfungsi
- [ ] Code reviewed

#### Risks & Blockers
- Email service rate limits
- Email delivery issues
- API key security

---

### Sprint 8: Distribusi (Part 2)
**Duration**: Week 8  
**Goal**: Bulk send dan history  
**Story Points**: 7

#### Backlog Items
| ID | Item | SP | Owner |
|----|------|----| ------|
| B-016 | Bulk send raport | 5 | Full-stack |
| B-017 | History pengiriman raport | 2 | Frontend |

#### Sprint Tasks
- [ ] UI bulk select di list raport
- [ ] API endpoint `/api/report-cards/bulk-send`
- [ ] Progress tracking dengan polling/SSE
- [ ] Rate limiting (max 10/minute)
- [ ] Summary report (success/failed)
- [ ] Send history per raport
- [ ] Tombol resend untuk yang gagal

#### Definition of Done
- [ ] Bulk send berfungsi
- [ ] Progress ditampilkan real-time
- [ ] Rate limiting aktif
- [ ] History ditampilkan
- [ ] Resend berfungsi
- [ ] Code reviewed

#### Risks & Blockers
- Rate limiting complexity
- Long-running requests timeout

---

### Sprint 9: History & Polish
**Duration**: Week 9  
**Goal**: History per siswa dan bug fixes  
**Story Points**: 4

#### Backlog Items
| ID | Item | SP | Owner |
|----|------|----| ------|
| B-018 | History raport per siswa | 2 | Frontend |
| - | Bug fixes dan polish | 2 | Full-stack |

#### Sprint Tasks
- [ ] Section history di detail siswa
- [ ] List raport per semester
- [ ] Download PDF dari history
- [ ] Fix bugs dari sprint sebelumnya
- [ ] UI polish dan consistency check
- [ ] Performance optimization
- [ ] Error handling improvement

#### Definition of Done
- [ ] History per siswa berfungsi
- [ ] No critical bugs
- [ ] UI consistent
- [ ] Performance acceptable
- [ ] Code reviewed

#### Risks & Blockers
- Accumulated technical debt
- Scope creep

---

### Sprint 10: Testing
**Duration**: Week 10  
**Goal**: End-to-end testing dan UAT  
**Story Points**: 0 (testing sprint)

#### Sprint Tasks
- [ ] Write E2E test cases
- [ ] Execute E2E tests
- [ ] User Acceptance Testing dengan admin sekolah
- [ ] Document bugs dan issues
- [ ] Fix critical bugs
- [ ] Performance testing
- [ ] Security review

#### Definition of Done
- [ ] All E2E tests pass
- [ ] UAT sign-off dari stakeholder
- [ ] No critical/high bugs
- [ ] Performance meets requirements
- [ ] Security review passed

#### Risks & Blockers
- UAT feedback requiring major changes
- Performance issues

---

### Sprint 11: Deployment
**Duration**: Week 11  
**Goal**: Production deployment dan documentation  
**Story Points**: 0 (deployment sprint)

#### Sprint Tasks
- [ ] Setup production environment
- [ ] Configure environment variables
- [ ] Run production migration
- [ ] Deploy to production
- [ ] Smoke testing di production
- [ ] Create user documentation
- [ ] Training session untuk admin
- [ ] Handover ke tim maintenance

#### Definition of Done
- [ ] Production deployed dan stable
- [ ] Documentation complete
- [ ] Training completed
- [ ] Handover done

#### Risks & Blockers
- Production environment issues
- Data migration problems

---

## Sprint Ceremonies

### Daily Standup
- **Time**: 09:00 WIB (15 menit)
- **Format**: What did yesterday, What will do today, Blockers

### Sprint Planning
- **Time**: Senin, 09:30 WIB (1 jam)
- **Agenda**: Review backlog, Commit sprint items, Task breakdown

### Sprint Review
- **Time**: Jumat, 14:00 WIB (30 menit)
- **Agenda**: Demo completed items, Stakeholder feedback

### Sprint Retrospective
- **Time**: Jumat, 15:00 WIB (30 menit)
- **Agenda**: What went well, What to improve, Action items

---

## Velocity Tracking

| Sprint | Planned SP | Completed SP | Velocity |
|--------|-----------|--------------|----------|
| 1 | 6 | - | - |
| 2 | 7 | - | - |
| 3 | 8 | - | - |
| 4 | 9 | - | - |
| 5 | 8 | - | - |
| 6 | 8 | - | - |
| 7 | 5 | - | - |
| 8 | 7 | - | - |
| 9 | 4 | - | - |
| 10 | 0 | - | - |
| 11 | 0 | - | - |

**Average Velocity**: TBD after Sprint 3

---

## Release Plan

### MVP Release (End of Sprint 9)
- ✅ Manajemen Siswa (existing)
- ✅ Master Data (Tahun Ajaran, Mapel, Ekskul)
- ✅ Input Nilai Raport
- ✅ Generate PDF
- ✅ Kirim Raport (Single & Bulk)
- ✅ History Raport

### Post-MVP (Future)
- Parent Portal
- Mobile App
- Analytics Dashboard
- Export to Excel
