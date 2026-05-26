-- Tambah kolom description ke report_card_grades
-- Jalankan di Supabase SQL Editor

ALTER TABLE report_card_grades 
ADD COLUMN IF NOT EXISTS description text;
