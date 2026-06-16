-- ============================================
-- Migration: Classrooms, Sub-Kelas & Ranking
-- ============================================

-- ============================================
-- TABLE: classrooms
-- ============================================
CREATE TABLE IF NOT EXISTS classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_level integer NOT NULL CHECK (grade_level BETWEEN 1 AND 6),
  section text NOT NULL DEFAULT 'A',
  display_name text NOT NULL,
  academic_year_id uuid REFERENCES academic_years(id),
  homeroom_teacher text DEFAULT '',
  capacity integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(grade_level, section, academic_year_id)
);

ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read classrooms"
  ON classrooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert classrooms"
  ON classrooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update classrooms"
  ON classrooms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete classrooms"
  ON classrooms FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_classrooms_grade ON classrooms (grade_level) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_classrooms_year ON classrooms (academic_year_id) WHERE is_active = true;

-- ============================================
-- ALTER: students — add classroom_id, drop old constraint
-- ============================================
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_current_class_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'classroom_id'
  ) THEN
    ALTER TABLE students ADD COLUMN classroom_id uuid REFERENCES classrooms(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_students_classroom ON students (classroom_id) WHERE deleted_at IS NULL;

-- ============================================
-- VIEW: class_rankings
-- ============================================
CREATE OR REPLACE VIEW class_rankings AS
SELECT
  rc.id AS report_card_id,
  rc.student_id,
  s.full_name,
  s.nisn,
  s.gender,
  rc.class_name,
  rc.semester,
  rc.academic_year_id,
  ay.year_name AS academic_year_name,
  ROUND(COALESCE(AVG((COALESCE(rg.knowledge_score, 0) + COALESCE(rg.skill_score, 0)) / 2.0), 0), 1) AS average_score,
  RANK() OVER (
    PARTITION BY rc.class_name, rc.semester, rc.academic_year_id
    ORDER BY COALESCE(AVG((COALESCE(rg.knowledge_score, 0) + COALESCE(rg.skill_score, 0)) / 2.0), 0) DESC
  ) AS rank_position,
  COUNT(DISTINCT rc2.id) AS rank_total
FROM report_cards rc
JOIN students s ON s.id = rc.student_id
LEFT JOIN report_card_grades rg ON rg.report_card_id = rc.id
LEFT JOIN academic_years ay ON ay.id = rc.academic_year_id
JOIN report_cards rc2 ON rc2.class_name = rc.class_name
  AND rc2.semester = rc.semester
  AND rc2.academic_year_id = rc.academic_year_id
JOIN students s2 ON s2.id = rc2.student_id AND s2.deleted_at IS NULL AND s2.status = 'active'
WHERE s.deleted_at IS NULL AND s.status = 'active'
GROUP BY rc.id, rc.student_id, s.full_name, s.nisn, s.gender,
         rc.class_name, rc.semester, rc.academic_year_id, ay.year_name;

-- ============================================
-- Backfill: migrate existing students to new naming convention
-- ============================================
-- Keep current_class values as-is (e.g. 'Kelas 1') for backward compatibility.
-- classroom_id will be populated via seed data + UI assignment.
