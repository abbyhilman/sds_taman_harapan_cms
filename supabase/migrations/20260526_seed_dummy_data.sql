-- Data Dummy Siswa, Nilai, Kehadiran, dan Invoice
-- Jalankan di Supabase SQL Editor

-- 1. Insert Siswa (10 siswa)
-- current_class harus: 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'
INSERT INTO students (nisn, full_name, nickname, gender, birth_place, birth_date, religion, address, current_class, parent_name, parent_phone, parent_email, status, enrollment_date) VALUES
('0012345001', 'Ahmad Rizki Pratama', 'Rizki', 'Laki-laki', 'Jakarta', '2014-03-15', 'Islam', 'Jl. Melati No. 10, Jakarta Selatan', 'Kelas 6', 'Budi Pratama', '081234567001', 'budi@email.com', 'active', '2020-07-15'),
('0012345002', 'Siti Nurhaliza', 'Liza', 'Perempuan', 'Bandung', '2014-05-22', 'Islam', 'Jl. Mawar No. 5, Jakarta Timur', 'Kelas 6', 'Hasan Abdullah', '081234567002', 'hasan@email.com', 'active', '2020-07-15'),
('0012345003', 'Muhammad Farhan', 'Farhan', 'Laki-laki', 'Surabaya', '2014-01-10', 'Islam', 'Jl. Kenanga No. 8, Jakarta Barat', 'Kelas 6', 'Ridwan Farhan', '081234567003', 'ridwan@email.com', 'active', '2020-07-15'),
('0012345004', 'Aisyah Putri Ramadhani', 'Aisyah', 'Perempuan', 'Yogyakarta', '2014-07-18', 'Islam', 'Jl. Dahlia No. 12, Jakarta Utara', 'Kelas 5', 'Ahmad Yusuf', '081234567004', 'ahmad@email.com', 'active', '2020-07-15'),
('0012345005', 'Dimas Aditya Nugraha', 'Dimas', 'Laki-laki', 'Semarang', '2014-09-25', 'Islam', 'Jl. Anggrek No. 3, Tangerang', 'Kelas 5', 'Surya Aditya', '081234567005', 'surya@email.com', 'active', '2020-07-15'),
('0012345006', 'Zahra Amelia Putri', 'Zahra', 'Perempuan', 'Medan', '2015-02-14', 'Islam', 'Jl. Tulip No. 7, Bekasi', 'Kelas 4', 'Fajar Hidayat', '081234567006', 'fajar@email.com', 'active', '2021-07-15'),
('0012345007', 'Rafi Pratama Putra', 'Rafi', 'Laki-laki', 'Palembang', '2015-04-30', 'Islam', 'Jl. Kamboja No. 15, Depok', 'Kelas 4', 'Eko Pratama', '081234567007', 'eko@email.com', 'active', '2021-07-15'),
('0012345008', 'Nabila Sari Dewi', 'Nabila', 'Perempuan', 'Makassar', '2015-06-08', 'Islam', 'Jl. Seroja No. 20, Bogor', 'Kelas 3', 'Dedi Sari', '081234567008', 'dedi@email.com', 'active', '2021-07-15'),
('0012345009', 'Farel Putra Wijaya', 'Farel', 'Laki-laki', 'Denpasar', '2016-08-12', 'Islam', 'Jl. Flamboyan No. 9, Jakarta Selatan', 'Kelas 2', 'Agus Putra', '081234567009', 'agus@email.com', 'active', '2022-07-15'),
('0012345010', 'Keisha Azzahra Putri', 'Keisha', 'Perempuan', 'Malang', '2016-11-20', 'Islam', 'Jl. Bougenville No. 11, Jakarta Timur', 'Kelas 1', 'Roni Setiawan', '081234567010', 'roni@email.com', 'active', '2022-07-15')
ON CONFLICT (nisn) DO NOTHING;

-- 2. Insert Nilai Akademik untuk semua siswa
INSERT INTO academic_grades (student_id, subject, grade_score, semester, academic_year)
SELECT s.id, g.subject, LEAST(100, GREATEST(60, g.score + (random() * 15 - 7)::int)), 'Ganjil', '2025/2026'
FROM students s
CROSS JOIN (VALUES 
  ('Matematika', 82), ('Bahasa Indonesia', 85), ('IPA', 80), 
  ('IPS', 78), ('Bahasa Inggris', 83), ('Pendidikan Agama', 90),
  ('PJOK', 85), ('Seni Budaya', 82), ('PKn', 84)
) AS g(subject, score)
WHERE s.status = 'active';

-- 3. Insert Kehadiran untuk semua siswa
INSERT INTO attendance_logs (student_id, sick, leave_permission, alpha, semester, academic_year)
SELECT id, 
  (random() * 5)::int,
  (random() * 3)::int,
  (random() * 2)::int,
  'Ganjil', '2025/2026'
FROM students
WHERE status = 'active';

-- 4. Insert Invoice SPP (6 bulan untuk setiap siswa)
INSERT INTO invoices (student_id, amount, status_bayar, due_date, payment_date, description)
SELECT 
  s.id, 
  500000, 
  CASE 
    WHEN n < 4 THEN 'paid'
    WHEN n = 4 THEN CASE WHEN random() > 0.3 THEN 'paid' ELSE 'pending' END
    ELSE 'pending'
  END,
  (DATE '2025-12-01' + (n || ' months')::interval)::timestamp,
  CASE 
    WHEN n < 4 THEN (DATE '2025-12-01' + (n || ' months')::interval + ((random() * 10)::int || ' days')::interval)::timestamp
    WHEN n = 4 AND random() > 0.3 THEN (DATE '2026-04-01' + ((random() * 10)::int || ' days')::interval)::timestamp
    ELSE NULL
  END,
  'SPP Bulan ' || to_char(DATE '2025-12-01' + (n || ' months')::interval, 'Month YYYY')
FROM students s, generate_series(0, 5) AS n
WHERE s.status = 'active';

-- 5. Verifikasi data
SELECT 'Siswa' as tabel, count(*) as jumlah FROM students WHERE status = 'active'
UNION ALL
SELECT 'Nilai', count(*) FROM academic_grades
UNION ALL
SELECT 'Kehadiran', count(*) FROM attendance_logs
UNION ALL
SELECT 'Invoice', count(*) FROM invoices;
