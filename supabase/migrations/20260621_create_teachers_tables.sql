/*
  # Teacher Profiles System for SDS Taman Harapan
  
  1. New Tables
    - `teachers` - Master data guru/pengajar
    - `teacher_subjects` - Linking table: teacher ↔ mata pelajaran
    - `teacher_classrooms` - Linking table: teacher ↔ kelas yang diajar
    - `teacher_expertise` - Keahlian/spesialisasi guru
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users (CRUD)
    - Add policies for public read (anon) for public website
  
  3. Storage
    - Bucket for teacher photos
*/

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create storage bucket for teacher photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'teacher-photos',
  'teacher-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Public access to teacher photos
CREATE POLICY "Public can view teacher photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'teacher-photos');

-- Authenticated users can upload teacher photos
CREATE POLICY "Authenticated users can upload teacher photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'teacher-photos' AND auth.role() = 'authenticated');

-- Authenticated users can update teacher photos
CREATE POLICY "Authenticated users can update teacher photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'teacher-photos' AND auth.role() = 'authenticated');

-- Authenticated users can delete teacher photos
CREATE POLICY "Authenticated users can delete teacher photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'teacher-photos' AND auth.role() = 'authenticated');

-- ============================================
-- TABLE: teachers
-- ============================================

CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url text NOT NULL DEFAULT '',
  full_name text NOT NULL,
  nip text DEFAULT '',
  position text NOT NULL DEFAULT 'Guru Mata Pelajaran' 
    CHECK (position IN (
      'Kepala Sekolah',
      'Wakil Kepala Sekolah',
      'Wali Kelas',
      'Guru Mata Pelajaran',
      'Guru Pendamping',
      'Guru Ekstrakurikuler'
    )),
  education text DEFAULT '',
  alma_mater text DEFAULT '',
  bio text DEFAULT '',
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Unique constraint on NIP for ON CONFLICT to work
ALTER TABLE teachers ADD CONSTRAINT teachers_nip_key UNIQUE (nip);

-- Public read access
CREATE POLICY "Anyone can view active teachers"
  ON teachers FOR SELECT
  USING (is_active = true);

-- Admin CRUD
CREATE POLICY "Admins can manage teachers"
  ON teachers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- TABLE: teacher_subjects (linking)
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_subjects (
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view teacher subjects"
  ON teacher_subjects FOR SELECT
  USING (true);

-- Admin CRUD
CREATE POLICY "Admins can manage teacher subjects"
  ON teacher_subjects FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- TABLE: teacher_classrooms (linking)
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_classrooms (
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, classroom_id)
);

ALTER TABLE teacher_classrooms ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view teacher classrooms"
  ON teacher_classrooms FOR SELECT
  USING (true);

-- Admin CRUD
CREATE POLICY "Admins can manage teacher classrooms"
  ON teacher_classrooms FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- TABLE: teacher_expertise
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_expertise (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  expertise text NOT NULL
);

ALTER TABLE teacher_expertise ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view teacher expertise"
  ON teacher_expertise FOR SELECT
  USING (true);

-- Admin CRUD
CREATE POLICY "Admins can manage teacher expertise"
  ON teacher_expertise FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- SEED DATA (sample teachers)
-- ============================================

-- Note: Using placeholder photos. Replace with actual uploaded photos.
INSERT INTO teachers (photo_url, full_name, nip, position, education, alma_mater, bio, display_order) VALUES
  ('/images/guru-laki.png', 'Bpk. Ahmad Suryadi, S.Pd.', '198501152010011005', 'Kepala Sekolah', 'S1 Pendidikan Matematika', 'Universitas Negeri Jakarta', 'Berpengalaman lebih dari 15 tahun dalam dunia pendidikan dasar. Memimpin SDS Taman Harapan sejak 2018 dengan visi mewujudkan sekolah yang berkarakter dan berprestasi.', 1),
  ('/images/guru-wanita.png', 'Ibu Siti Nurhaliza, S.Pd.', '199203222015032008', 'Wali Kelas', 'S1 Pendidikan Guru Sekolah Dasar', 'Universitas Indonesia', 'Passionate dalam mengajar dan membimbing siswa kelas awal. Spesialisasi dalam metode pembelajaran aktif dan kreatif. Mengajar Kelas 3A dengan pendekatan menyenangkan.', 2)
ON CONFLICT (nip) DO NOTHING;

-- Seed teacher_subjects (using subquery to find teacher IDs)
INSERT INTO teacher_subjects (teacher_id, subject_id)
SELECT t.id, s.id FROM teachers t, subjects s
WHERE t.nip = '198501152010011005' AND s.name = 'Matematika'
ON CONFLICT (teacher_id, subject_id) DO NOTHING;

INSERT INTO teacher_subjects (teacher_id, subject_id)
SELECT t.id, s.id FROM teachers t, subjects s
WHERE t.nip = '199203222015032008' AND s.name IN ('Bahasa Indonesia', 'IPA')
ON CONFLICT (teacher_id, subject_id) DO NOTHING;

-- Seed teacher_classrooms
INSERT INTO teacher_classrooms (teacher_id, classroom_id)
SELECT t.id, c.id FROM teachers t, classrooms c
WHERE t.nip = '199203222015032008' AND c.name = '3A'
ON CONFLICT (teacher_id, classroom_id) DO NOTHING;

-- Seed teacher_expertise
INSERT INTO teacher_expertise (teacher_id, expertise)
SELECT t.id, 'Kepemimpinan Pendidikan' FROM teachers t WHERE t.nip = '198501152010011005'
ON CONFLICT DO NOTHING;

INSERT INTO teacher_expertise (teacher_id, expertise)
SELECT t.id, exp FROM teachers t, (VALUES ('Pembelajaran Aktif'), ('Metode Kreatif'), ('Kelas Awal')) AS v(exp) WHERE t.nip = '199203222015032008'
ON CONFLICT DO NOTHING;
