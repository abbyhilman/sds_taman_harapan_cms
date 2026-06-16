-- Migration: Allow classrooms without a section letter
-- Use case: Schools with 1 class per grade (e.g., "Kelas 1" instead of "Kelas 1A")

-- 1. Make section nullable, drop default
ALTER TABLE classrooms ALTER COLUMN section DROP NOT NULL;
ALTER TABLE classrooms ALTER COLUMN section DROP DEFAULT;

-- 2. Drop the old unique constraint (doesn't handle NULL properly)
ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS classrooms_grade_level_section_academic_year_id_key;

-- 3. Create unique constraint for non-null sections (same grade+section+year must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_classrooms_grade_section_year
  ON classrooms (grade_level, section, academic_year_id)
  WHERE section IS NOT NULL;

-- 4. Create unique constraint for null sections (max 1 no-section class per grade+year)
CREATE UNIQUE INDEX IF NOT EXISTS idx_classrooms_grade_year_no_section
  ON classrooms (grade_level, academic_year_id)
  WHERE section IS NULL;
