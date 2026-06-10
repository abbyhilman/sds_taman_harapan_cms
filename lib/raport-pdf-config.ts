export interface FieldPosition {
  x: number;
  y: number;
  font_size: number;
  font_style: 'regular' | 'bold';
}

export interface PageConfig {
  cover_page: number;
  profile_page: number;
  grade_pages: Record<string, number>;
  prestasi_page: number;
}

export interface GradePagePositions {
  student_name: FieldPosition;
  class_name: FieldPosition;
  nisn: FieldPosition;
  semester: FieldPosition;
  school_name: FieldPosition;
  school_address: FieldPosition;
  academic_year: FieldPosition;
  subjects: Record<string, { row_y: number }>;
  mulok_name_x: number;
  mulok_start_y: number;
  mulok_row_spacing: number;
  max_mulok_rows: number;
  kkm: number;
  average_y: number;
  rank_position_x: number;
  rank_total_x: number;
  rank_y: number;
  attendance: {
    sick: { x: number; y: number };
    permission: { x: number; y: number };
    alpha: { x: number; y: number };
  };
  personality: Array<{ label: string; x: number; y: number; value: string }>;
  homeroom_notes: FieldPosition & { max_width: number; max_lines: number };
  date: FieldPosition;
  parent_name: FieldPosition;
  homeroom_label: FieldPosition;
}

export interface CoverPagePositions {
  student_name: FieldPosition;
  nis: { x: number; y: number };
  nisn: { x: number; y: number };
}

export interface ProfilePagePositions {
  fields: Array<{ key: string; x: number; y: number; font_size: number; font_style: string }>;
}

export interface PrestasiPagePositions {
  student_name: FieldPosition;
  school_name: FieldPosition;
  nisn: FieldPosition;
}

export interface FieldPositions {
  cover_page: CoverPagePositions;
  profile_page: ProfilePagePositions;
  grade_page: GradePagePositions;
  prestasi_page: PrestasiPagePositions;
}

export interface RaportTemplate {
  id: string;
  name: string;
  description: string;
  file_url: string;
  file_name: string;
  page_count: number;
  page_config: PageConfig;
  field_positions: FieldPositions;
  status: 'draft' | 'configured' | 'active' | 'archived';
  is_default: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  cover_page: 0,
  profile_page: 4,
  grade_pages: {
    kelas_1_ganjil: 5,
    kelas_1_genap: 6,
    kelas_2_ganjil: 7,
    kelas_2_genap: 8,
    kelas_3_ganjil: 9,
    kelas_3_genap: 10,
    kelas_4_ganjil: 11,
    kelas_4_genap: 12,
    kelas_5_ganjil: 13,
    kelas_5_genap: 14,
    kelas_6_ganjil: 15,
    kelas_6_genap: 16,
  },
  prestasi_page: 21,
};

export const DEFAULT_FIELD_POSITIONS: FieldPositions = {
  cover_page: {
    student_name: { x: 0, y: 755, font_size: 14, font_style: 'bold' },
    nis: { x: 315, y: 821 },
    nisn: { x: 450, y: 821 },
  },
  profile_page: {
    fields: [
      { key: 'full_name', x: 310, y: 148.8, font_size: 10, font_style: 'regular' },
      { key: 'nis_nisn', x: 310, y: 172.7, font_size: 10, font_style: 'regular' },
      { key: 'ttl', x: 310, y: 196.7, font_size: 10, font_style: 'regular' },
      { key: 'gender', x: 310, y: 220.4, font_size: 10, font_style: 'regular' },
      { key: 'religion', x: 310, y: 247.9, font_size: 10, font_style: 'regular' },
      { key: 'family_status', x: 310, y: 268.5, font_size: 10, font_style: 'regular' },
      { key: 'address', x: 310, y: 292.3, font_size: 10, font_style: 'regular' },
      { key: 'parent_name', x: 310, y: 483.5, font_size: 10, font_style: 'regular' },
      { key: 'mother_name', x: 310, y: 507.5, font_size: 10, font_style: 'regular' },
      { key: 'parent_address', x: 310, y: 531.4, font_size: 10, font_style: 'regular' },
    ],
  },
  grade_page: {
    student_name: { x: 233, y: 88.6, font_size: 9.5, font_style: 'regular' },
    class_name: { x: 560, y: 88.6, font_size: 9.5, font_style: 'regular' },
    nisn: { x: 233, y: 107.1, font_size: 9.5, font_style: 'regular' },
    semester: { x: 560, y: 107.1, font_size: 9.5, font_style: 'regular' },
    school_name: { x: 233, y: 125.4, font_size: 9.5, font_style: 'regular' },
    school_address: { x: 233, y: 143.7, font_size: 9.5, font_style: 'regular' },
    academic_year: { x: 560, y: 125.4, font_size: 9.5, font_style: 'regular' },
    subjects: {
      PABP: { row_y: 222.2 },
      PPKN: { row_y: 248.5 },
      BIND: { row_y: 265.1 },
      MTK: { row_y: 286.4 },
      IPAS: { row_y: 307.8 },
      SBP: { row_y: 350.7 },
      PJOK: { row_y: 372.2 },
    },
    mulok_name_x: 120,
    mulok_start_y: 429.2,
    mulok_row_spacing: 21.6,
    max_mulok_rows: 3,
    kkm: 70,
    average_y: 493.6,
    rank_position_x: 360,
    rank_total_x: 520,
    rank_y: 515.0,
    attendance: {
      sick: { x: 640, y: 595.9 },
      permission: { x: 640, y: 574.2 },
      alpha: { x: 640, y: 617.3 },
    },
    personality: [
      { label: 'Sikap Spiritual', x: 322, y: 574.2, value: 'Baik' },
      { label: 'Sikap Sosial', x: 322, y: 595.9, value: 'Baik' },
      { label: 'Kehadiran', x: 322, y: 617.3, value: 'Baik' },
    ],
    homeroom_notes: { x: 105, y: 675, font_size: 8.5, font_style: 'regular', max_width: 550, max_lines: 6 },
    date: { x: 483.7, y: 880.6, font_size: 9.5, font_style: 'regular' },
    parent_name: { x: 105, y: 960.2, font_size: 9.5, font_style: 'regular' },
    homeroom_label: { x: 520, y: 960.2, font_size: 9.5, font_style: 'regular' },
  },
  prestasi_page: {
    student_name: { x: 260, y: 134.1, font_size: 10, font_style: 'regular' },
    school_name: { x: 260, y: 168.2, font_size: 10, font_style: 'regular' },
    nisn: { x: 260, y: 202.1, font_size: 10, font_style: 'regular' },
  },
};

export function getGradePageKey(className: string, semester: number | string): string {
  const classNum = className.match(/\d/)?.[0] || '1';
  const semLabel = (semester === 2 || semester === 'Genap' || semester === 'genap') ? 'genap' : 'ganjil';
  return `kelas_${classNum}_${semLabel}`;
}

export function getGradePageIndex(className: string, semester: number | string, pageConfig: PageConfig): number {
  const key = getGradePageKey(className, semester);
  return pageConfig.grade_pages[key] ?? pageConfig.grade_pages['kelas_1_ganjil'] ?? 5;
}
