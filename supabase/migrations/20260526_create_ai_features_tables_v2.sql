/*
  # AI Features Database Schema for SDS Taman Harapan CMS
  
  Catatan: Tabel students sudah ada, jadi kita hanya menambahkan kolom yang diperlukan
  dan membuat tabel baru untuk AI features.
*/

-- Tambahkan kolom yang mungkin belum ada di tabel students (jika error, abaikan)
DO $$ 
BEGIN
  -- Cek dan tambah kolom jika belum ada
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'nis') THEN
    ALTER TABLE students ADD COLUMN nis varchar UNIQUE;
  END IF;
END $$;

-- Academic Grades
CREATE TABLE IF NOT EXISTS academic_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject varchar NOT NULL,
  grade_score numeric NOT NULL CHECK (grade_score >= 0 AND grade_score <= 100),
  semester varchar DEFAULT 'Ganjil',
  academic_year varchar DEFAULT '2025/2026',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE academic_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage grades" ON academic_grades;
CREATE POLICY "Authenticated users can manage grades"
  ON academic_grades FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Attendance Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  sick integer DEFAULT 0,
  leave_permission integer DEFAULT 0,
  alpha integer DEFAULT 0,
  semester varchar DEFAULT 'Ganjil',
  academic_year varchar DEFAULT '2025/2026',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage attendance" ON attendance_logs;
CREATE POLICY "Authenticated users can manage attendance"
  ON attendance_logs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status_bayar varchar DEFAULT 'pending' CHECK (status_bayar IN ('pending', 'paid', 'overdue')),
  due_date timestamp NOT NULL,
  payment_date timestamp,
  description varchar DEFAULT 'SPP Bulanan',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON invoices;
CREATE POLICY "Authenticated users can manage invoices"
  ON invoices FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Report Cards (AI Generated)
CREATE TABLE IF NOT EXISTS report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  semester varchar NOT NULL,
  academic_year varchar NOT NULL,
  ai_appreciation text,
  ai_recommendation text,
  teacher_notes text,
  is_finalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, semester, academic_year)
);

ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage report cards" ON report_cards;
CREATE POLICY "Authenticated users can manage report cards"
  ON report_cards FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Insert sample grades untuk siswa yang sudah ada (ambil 1 siswa pertama)
INSERT INTO academic_grades (student_id, subject, grade_score, semester, academic_year)
SELECT s.id, subject, score, 'Ganjil', '2025/2026'
FROM (SELECT id FROM students LIMIT 1) s
CROSS JOIN (VALUES 
  ('Matematika', 85), ('Bahasa Indonesia', 90), ('IPA', 88), 
  ('IPS', 82), ('Bahasa Inggris', 87), ('Agama', 95)
) AS grades(subject, score)
ON CONFLICT DO NOTHING;

-- Insert sample attendance
INSERT INTO attendance_logs (student_id, sick, leave_permission, alpha, semester, academic_year)
SELECT id, 2, 1, 0, 'Ganjil', '2025/2026' 
FROM (SELECT id FROM students LIMIT 1) s
ON CONFLICT DO NOTHING;

-- Insert sample invoices (6 bulan data historis)
INSERT INTO invoices (student_id, amount, status_bayar, due_date, payment_date, description)
SELECT s.id, 500000, 'paid', 
  (DATE '2025-12-01' + (n || ' months')::interval)::timestamp,
  (DATE '2025-12-05' + (n || ' months')::interval)::timestamp,
  'SPP Bulan ' || to_char(DATE '2025-12-01' + (n || ' months')::interval, 'Month YYYY')
FROM (SELECT id FROM students LIMIT 1) s, generate_series(0, 5) AS n
ON CONFLICT DO NOTHING;
