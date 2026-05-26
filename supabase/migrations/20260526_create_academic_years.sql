-- Tabel Academic Years (diperlukan untuk halaman Raport Digital)
-- Jalankan di Supabase SQL Editor

-- 1. Buat tabel academic_years
CREATE TABLE IF NOT EXISTS academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_name varchar NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage academic_years"
  ON academic_years FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 2. Insert data tahun ajaran
INSERT INTO academic_years (year_name, start_date, end_date, is_active) VALUES
('2024/2025', '2024-07-15', '2025-06-30', false),
('2025/2026', '2025-07-15', '2026-06-30', true)
ON CONFLICT (year_name) DO NOTHING;

-- 3. Tambahkan kolom academic_year_id ke report_cards jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_cards' AND column_name = 'academic_year_id') THEN
    ALTER TABLE report_cards ADD COLUMN academic_year_id uuid REFERENCES academic_years(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_cards' AND column_name = 'class_name') THEN
    ALTER TABLE report_cards ADD COLUMN class_name varchar;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report_cards' AND column_name = 'status') THEN
    ALTER TABLE report_cards ADD COLUMN status varchar DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'sent'));
  END IF;
END $$;

-- 4. Verifikasi
SELECT 'academic_years' as tabel, count(*) as jumlah FROM academic_years
UNION ALL
SELECT 'report_cards', count(*) FROM report_cards;
