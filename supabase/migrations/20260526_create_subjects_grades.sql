-- Tabel Subjects dan Report Card Grades
-- Jalankan di Supabase SQL Editor

-- 1. Tabel Subjects (Master Data Mata Pelajaran)
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  code varchar NOT NULL UNIQUE,
  category varchar DEFAULT 'Umum',
  order_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage subjects"
  ON subjects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 2. Tabel Report Card Grades (Nilai per Mata Pelajaran)
CREATE TABLE IF NOT EXISTS report_card_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id uuid REFERENCES report_cards(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  knowledge_score numeric CHECK (knowledge_score >= 0 AND knowledge_score <= 100),
  skill_score numeric CHECK (skill_score >= 0 AND skill_score <= 100),
  predicate varchar(1) CHECK (predicate IN ('A', 'B', 'C', 'D')),
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(report_card_id, subject_id)
);

ALTER TABLE report_card_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage report_card_grades"
  ON report_card_grades FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 3. Insert Data Mata Pelajaran SD
INSERT INTO subjects (name, code, category, order_position) VALUES
('Pendidikan Agama dan Budi Pekerti', 'PAI', 'Wajib', 1),
('Pendidikan Pancasila dan Kewarganegaraan', 'PPKN', 'Wajib', 2),
('Bahasa Indonesia', 'BIND', 'Wajib', 3),
('Matematika', 'MTK', 'Wajib', 4),
('Ilmu Pengetahuan Alam', 'IPA', 'Wajib', 5),
('Ilmu Pengetahuan Sosial', 'IPS', 'Wajib', 6),
('Seni Budaya dan Prakarya', 'SBDP', 'Wajib', 7),
('Pendidikan Jasmani, Olahraga dan Kesehatan', 'PJOK', 'Wajib', 8),
('Bahasa Inggris', 'BING', 'Muatan Lokal', 9),
('Bahasa Daerah', 'BADA', 'Muatan Lokal', 10)
ON CONFLICT (code) DO NOTHING;

-- 4. Verifikasi
SELECT 'subjects' as tabel, count(*) as jumlah FROM subjects
UNION ALL
SELECT 'report_card_grades', count(*) FROM report_card_grades;
