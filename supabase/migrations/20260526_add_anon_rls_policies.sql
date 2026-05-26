-- Tambah RLS policy untuk anon read pada report_cards dan report_card_grades
-- Jalankan di Supabase SQL Editor

-- Policy untuk report_cards
DROP POLICY IF EXISTS "Allow anon read report_cards" ON report_cards;
CREATE POLICY "Allow anon read report_cards" 
  ON report_cards FOR SELECT TO anon 
  USING (true);

-- Policy untuk report_card_grades
DROP POLICY IF EXISTS "Allow anon read report_card_grades" ON report_card_grades;
CREATE POLICY "Allow anon read report_card_grades" 
  ON report_card_grades FOR SELECT TO anon 
  USING (true);

-- Policy untuk subjects (jika belum ada)
DROP POLICY IF EXISTS "Allow anon read subjects" ON subjects;
CREATE POLICY "Allow anon read subjects" 
  ON subjects FOR SELECT TO anon 
  USING (true);
