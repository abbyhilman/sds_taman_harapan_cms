# PRD: AI Student Performance Analyzer

## Document Info
| Field | Value |
|-------|-------|
| Product | SDS Taman Harapan CMS |
| Feature | AI Student Performance Analyzer |
| Version | 1.0 |
| Status | Approved |
| Created | 2026-05-26 |
| Author | AI Assistant |

---

## 1. Executive Summary

### 1.1 Problem Statement
Wali kelas menghabiskan waktu yang signifikan untuk menganalisa nilai siswa secara manual dan menulis catatan deskriptif untuk rapor. Proses ini membutuhkan:
- Identifikasi mata pelajaran dengan nilai rendah/tinggi
- Penulisan apresiasi pencapaian siswa
- Penulisan rekomendasi perbaikan yang spesifik

### 1.2 Solution
Mengintegrasikan AI analyzer langsung ke dalam flow Input Nilai Raport yang sudah ada. AI akan membaca data nilai yang sudah diinput dan memberikan:
- Analisa kekuatan dan kelemahan siswa
- Apresiasi pencapaian yang personalized
- Rekomendasi perbaikan yang actionable

### 1.3 Success Metrics
| Metric | Target |
|--------|--------|
| Waktu penulisan catatan rapor | Berkurang 50% |
| Adoption rate | 80% wali kelas menggunakan fitur |
| User satisfaction | Rating 4+ dari 5 |

---

## 2. User Stories

### US-1: Analisa Performa Otomatis
**Sebagai** wali kelas  
**Saya ingin** AI menganalisa nilai siswa yang sudah diinput  
**Sehingga** saya mendapat insight tentang kekuatan dan kelemahan siswa tanpa harus menghitung manual

**Acceptance Criteria:**
- [ ] Tombol "Analisa AI" muncul di halaman Input Nilai
- [ ] Tombol hanya aktif jika minimal 50% nilai sudah diinput
- [ ] AI menampilkan mata pelajaran dengan nilai tertinggi dan terendah
- [ ] AI menampilkan rata-rata nilai keseluruhan

### US-2: Generate Catatan Deskriptif
**Sebagai** wali kelas  
**Saya ingin** AI membantu generate catatan apresiasi dan rekomendasi  
**Sehingga** saya tidak perlu menulis dari nol

**Acceptance Criteria:**
- [ ] AI generate paragraf apresiasi berdasarkan nilai tertinggi
- [ ] AI generate paragraf rekomendasi berdasarkan nilai terendah
- [ ] Hasil AI bisa diedit sebelum disimpan
- [ ] Catatan tersimpan ke tabel report_cards

### US-3: Rekomendasi Spesifik
**Sebagai** wali kelas  
**Saya ingin** AI memberikan rekomendasi yang spesifik per mata pelajaran  
**Sehingga** saya bisa memberikan saran yang tepat ke orang tua

**Acceptance Criteria:**
- [ ] AI menyebutkan nama mata pelajaran yang perlu perbaikan
- [ ] AI memberikan saran konkret (bukan generik)
- [ ] Rekomendasi mempertimbangkan gap antara nilai pengetahuan dan keterampilan

---

## 3. Functional Requirements

### 3.1 Data Source
| Requirement | Description |
|-------------|-------------|
| FR-1 | AI membaca data dari tabel `report_card_grades` |
| FR-2 | AI menggunakan `knowledge_score` dan `skill_score` untuk analisa |
| FR-3 | AI mempertimbangkan `predicate` (A/B/C/D) dalam analisa |

### 3.2 AI Analysis
| Requirement | Description |
|-------------|-------------|
| FR-4 | Identifikasi 3 mata pelajaran dengan nilai tertinggi |
| FR-5 | Identifikasi 3 mata pelajaran dengan nilai terendah |
| FR-6 | Hitung rata-rata nilai pengetahuan dan keterampilan |
| FR-7 | Deteksi gap signifikan antara pengetahuan vs keterampilan |

### 3.3 AI Output
| Requirement | Description |
|-------------|-------------|
| FR-8 | Generate paragraf apresiasi (2-3 kalimat) |
| FR-9 | Generate paragraf rekomendasi (2-3 kalimat) |
| FR-10 | Output dalam Bahasa Indonesia formal |

### 3.4 UI/UX
| Requirement | Description |
|-------------|-------------|
| FR-11 | Tombol "Analisa AI" di halaman Input Nilai |
| FR-12 | Modal/dialog untuk menampilkan hasil analisa |
| FR-13 | Textarea editable untuk apresiasi dan rekomendasi |
| FR-14 | Tombol simpan untuk menyimpan ke database |

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Performance | AI response time < 10 detik |
| NFR-2 | Availability | Graceful degradation jika AI service down |
| NFR-3 | Security | API key tidak exposed di client |
| NFR-4 | UX | Loading state saat AI processing |
| NFR-5 | Accessibility | Keyboard navigable |

---

## 5. Technical Design

### 5.1 API Endpoint
```
POST /api/report-cards/[id]/analyze
```

**Request:**
```json
{
  "report_card_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "student_name": "string",
    "class_name": "string",
    "total_subjects": 10,
    "completed_subjects": 8,
    "average_knowledge": 82.5,
    "average_skill": 80.0,
    "top_subjects": [
      { "name": "Matematika", "score": 95 }
    ],
    "weak_subjects": [
      { "name": "Bahasa Inggris", "score": 65 }
    ]
  },
  "ai_report": {
    "appreciation": "string",
    "recommendation": "string"
  }
}
```

### 5.2 Database Schema
Menggunakan tabel existing:
- `report_cards` - menyimpan `ai_appreciation`, `ai_recommendation`
- `report_card_grades` - sumber data nilai

### 5.3 AI Provider
- Provider: SumoPod AI
- Model: kimi-k2.6
- Base URL: https://ai.sumopod.com/v1

---

## 6. User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT NILAI RAPORT                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tabel Nilai Mata Pelajaran                          │   │
│  │ ┌──────────────┬────────────┬────────────┬────────┐ │   │
│  │ │ Mapel        │ Pengetahuan│ Keterampilan│Predikat│ │   │
│  │ ├──────────────┼────────────┼────────────┼────────┤ │   │
│  │ │ Matematika   │ 85         │ 80         │ B      │ │   │
│  │ │ B. Indonesia │ 90         │ 88         │ A      │ │   │
│  │ │ ...          │ ...        │ ...        │ ...    │ │   │
│  │ └──────────────┴────────────┴────────────┴────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────────┐                    │
│  │ Simpan Nilai │  │ ✨ Analisa AI    │ ← Tombol baru      │
│  └──────────────┘  └──────────────────┘                    │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              MODAL HASIL ANALISA AI                 │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ 📊 Ringkasan Nilai                              │ │   │
│  │ │ • Rata-rata: 82.5                               │ │   │
│  │ │ • Tertinggi: Matematika (95)                    │ │   │
│  │ │ • Perlu Perhatian: B. Inggris (65)              │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ ✨ Apresiasi (editable)                         │ │   │
│  │ │ ┌─────────────────────────────────────────────┐ │ │   │
│  │ │ │ Keisha menunjukkan pencapaian yang sangat   │ │ │   │
│  │ │ │ baik di bidang Matematika dan IPA...        │ │ │   │
│  │ │ └─────────────────────────────────────────────┘ │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ 📝 Rekomendasi (editable)                       │ │   │
│  │ │ ┌─────────────────────────────────────────────┐ │ │   │
│  │ │ │ Disarankan untuk lebih banyak berlatih      │ │ │   │
│  │ │ │ Bahasa Inggris melalui...                   │ │ │   │
│  │ │ └─────────────────────────────────────────────┘ │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  ┌────────────┐  ┌─────────────────────┐           │   │
│  │  │   Batal    │  │ 💾 Simpan ke Rapor  │           │   │
│  │  └────────────┘  └─────────────────────┘           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Release Plan

### Phase 1: MVP (Current Sprint)
- [x] API endpoint `/api/report-cards/[id]/analyze`
- [x] Tombol "Analisa AI" di halaman Input Nilai
- [x] Modal hasil analisa dengan textarea editable
- [x] Simpan hasil ke database

### Phase 2: Enhancement (Future)
- [ ] Batch analyze untuk semua siswa dalam satu kelas
- [ ] Template catatan yang bisa dikustomisasi
- [ ] History analisa AI sebelumnya
- [ ] Export hasil analisa ke PDF

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI service down | High | Tampilkan pesan error yang jelas, user bisa input manual |
| AI response lambat | Medium | Loading state, timeout 30 detik |
| AI output tidak sesuai | Medium | User bisa edit sebelum simpan |
| API key exposed | High | Simpan di server-side env, tidak expose ke client |

---

## 9. Out of Scope
- Analisa trend nilai antar semester
- Perbandingan dengan siswa lain
- Integrasi dengan sistem kehadiran
- Notifikasi ke orang tua

---

## 10. Appendix

### A. Contoh Prompt AI
```
Kamu adalah wali kelas SD yang berpengalaman. Analisa nilai rapor siswa berikut:

Nama: Keisha Azzahra Putri
Kelas: Kelas 1
Semester: Ganjil 2025/2026

Nilai Mata Pelajaran:
- Matematika: Pengetahuan 85, Keterampilan 80 (B)
- Bahasa Indonesia: Pengetahuan 90, Keterampilan 88 (A)
- IPA: Pengetahuan 75, Keterampilan 70 (C)
...

Berikan response dalam format JSON:
{
  "appreciation": "Paragraf apresiasi 2-3 kalimat, sebutkan mata pelajaran terbaik",
  "recommendation": "Paragraf rekomendasi 2-3 kalimat, sebutkan mata pelajaran yang perlu ditingkatkan dan saran konkret"
}
```

### B. Files to Modify
- `app/api/report-cards/[id]/analyze/route.ts` (NEW)
- `app/admin/report-cards/edit/page.tsx` (UPDATE)
- `app/admin/academic-ai/` (DELETE)
- `components/admin/Sidebar.tsx` (UPDATE)
