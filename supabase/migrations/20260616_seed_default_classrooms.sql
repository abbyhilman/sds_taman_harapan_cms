-- ============================================
-- Seed: Default Classrooms (1A-6A) for active academic year
-- ============================================

DO $$
DECLARE
  active_year_id uuid;
BEGIN
  SELECT id INTO active_year_id FROM academic_years WHERE is_active = true ORDER BY created_at DESC LIMIT 1;

  IF active_year_id IS NOT NULL THEN
    INSERT INTO classrooms (grade_level, section, display_name, academic_year_id, homeroom_teacher, capacity)
    VALUES
      (1, 'A', 'Kelas 1A', active_year_id, '', 30),
      (2, 'A', 'Kelas 2A', active_year_id, '', 30),
      (3, 'A', 'Kelas 3A', active_year_id, '', 30),
      (4, 'A', 'Kelas 4A', active_year_id, '', 30),
      (5, 'A', 'Kelas 5A', active_year_id, '', 30),
      (6, 'A', 'Kelas 6A', active_year_id, '', 30)
    ON CONFLICT (grade_level, section, academic_year_id) DO NOTHING;
  END IF;
END $$;
