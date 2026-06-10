import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  DEFAULT_PAGE_CONFIG,
  DEFAULT_FIELD_POSITIONS,
  type PageConfig,
  type FieldPositions,
} from './raport-pdf-config';

export interface SubjectGrade {
  code: string;
  name: string;
  knowledge: number | null;
  skill: number | null;
  predicate: string;
}

export interface RaportRenderData {
  student_name: string;
  nis: string;
  nisn: string;
  birth_place: string;
  birth_date: string;
  gender: string;
  religion: string;
  address: string;
  parent_name: string;
  class_name: string;
  semester_label: string;
  academic_year: string;
  school_name: string;
  school_address: string;
  subjects: SubjectGrade[];
  overall_average: number | null;
  overall_predicate: string;
  rank_position: number;
  rank_total: number;
  attendance: { sick: number; permission: number; alpha: number };
  homeroom_teacher: string;
  homeroom_notes: string;
  date_string: string;
  kepribadian_spiritual?: string;
  kepribadian_sosial?: string;
}

const CHAR_MAP: Record<string, string> = {
  '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
  '\u2013': '-', '\u2014': '-', '\u2026': '...',
};

function convertSpecialChars(text: string): string {
  return text.replace(/[\u2018\u2019\u201C\u201D\u2013\u2014\u2026]/g, (c) => CHAR_MAP[c] || c);
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const normalizedText = convertSpecialChars(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = normalizedText.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const cleaned = paragraph.replace(/[\n\r\t]/g, ' ').trim();
    if (cleaned === '') { lines.push(''); continue; }

    const words = cleaned.split(/\s+/);
    let currentLine = '';
    for (const word of words) {
      const clean = word.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
      if (!clean) continue;
      const testLine = currentLine ? `${currentLine} ${clean}` : clean;
      let width = 0;
      try { width = font.widthOfTextAtSize(testLine, fontSize); } catch { width = testLine.length * (fontSize * 0.55); }
      if (width > maxWidth) { if (currentLine) lines.push(currentLine); currentLine = clean; }
      else currentLine = testLine;
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines;
}

function resolveProfileField(key: string, data: RaportRenderData): string {
  switch (key) {
    case 'full_name': return data.student_name || '';
    case 'nis_nisn': return data.nis || data.nisn || '';
    case 'ttl': return [data.birth_place, data.birth_date].filter(Boolean).join(', ') || '-';
    case 'gender': return data.gender || '-';
    case 'religion': return data.religion || '-';
    case 'family_status': return 'Anak';
    case 'address': return data.address || '-';
    case 'parent_name': return data.parent_name || '-';
    case 'mother_name': return '-';
    case 'parent_address': return data.address || '-';
    default: return '-';
  }
}

export async function renderRaportPDF(
  templateBytes: Uint8Array,
  pageConfig: PageConfig,
  fieldPositions: FieldPositions,
  gradePageIndex: number,
  data: RaportRenderData,
): Promise<Uint8Array> {
  const templateDoc = await PDFDocument.load(templateBytes);
  const pdfDoc = await PDFDocument.create();

  const pageIndicesToCopy = [
    pageConfig.cover_page,
    pageConfig.profile_page,
    gradePageIndex,
    pageConfig.prestasi_page,
  ];
  const copiedPages = await pdfDoc.copyPages(templateDoc, pageIndicesToCopy);

  const coverPage = pdfDoc.addPage(copiedPages[0]);
  const profilePage = pdfDoc.addPage(copiedPages[1]);
  const gradePage = pdfDoc.addPage(copiedPages[2]);
  const prestasiPage = pdfDoc.addPage(copiedPages[3]);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageHeight = 1059.12;
  const defaultColor = rgb(0, 0, 0);
  const pageWidth = 750;

  const drawField = (
    page: any, value: string,
    fp: { x: number; y: number; font_size?: number; font_style?: string },
    opts?: { center?: boolean; centerWidth?: number }
  ) => {
    const size = fp.font_size ?? 9.5;
    const font = fp.font_style === 'bold' ? fontBold : fontRegular;
    let x = fp.x;
    if (opts?.center) {
      const w = font.widthOfTextAtSize(value, size);
      x = ((opts.centerWidth || pageWidth) - w) / 2;
    }
    page.drawText(value, { x, y: pageHeight - fp.y, size, font, color: defaultColor });
  };

  // ── Cover ──
  const cover = fieldPositions.cover_page;
  drawField(coverPage, data.student_name, cover.student_name, { center: true, centerWidth: pageWidth });
  drawField(coverPage, data.nis, cover.nis);
  drawField(coverPage, data.nisn, cover.nisn);

  // ── Profile ──
  for (const field of fieldPositions.profile_page.fields) {
    drawField(profilePage, resolveProfileField(field.key, data), field);
  }

  // ── Grades ──
  const gp = fieldPositions.grade_page;
  const kkm = gp.kkm ?? 70;

  drawField(gradePage, data.student_name, gp.student_name);
  drawField(gradePage, data.class_name, gp.class_name);
  drawField(gradePage, data.nisn, gp.nisn);
  drawField(gradePage, data.semester_label, gp.semester);
  drawField(gradePage, data.school_name || 'SDS Taman Harapan', gp.school_name);
  drawField(gradePage, data.academic_year, gp.academic_year);
  drawField(gradePage, data.school_address || 'Jl. Pendidikan No. 123, Jakarta', gp.school_address);

  const subjectCodes = Object.keys(gp.subjects);
  const coreGrades = data.subjects.filter(s => subjectCodes.includes(s.code));
  const mulokGrades = data.subjects.filter(s => !subjectCodes.includes(s.code));

  const drawGradeRow = (rowY: number, avg: number, pred: string) => {
    gradePage.drawText(`${kkm}`, { x: 322, y: pageHeight - rowY, size: 9.5, font: fontRegular, color: defaultColor });
    gradePage.drawText(`${avg}`, { x: 402, y: pageHeight - rowY, size: 9.5, font: fontRegular, color: defaultColor });
    gradePage.drawText(pred, { x: 558, y: pageHeight - rowY, size: 9.5, font: fontBold, color: defaultColor });
  };

  for (const g of coreGrades) {
    const rowY = gp.subjects[g.code]?.row_y;
    if (rowY === undefined) continue;
    const avg = (g.knowledge !== null && g.skill !== null)
      ? Math.round((g.knowledge + g.skill) / 2)
      : (g.knowledge ?? g.skill ?? null);
    if (avg !== null) {
      const pred = g.predicate || (avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= kkm ? 'C' : 'D');
      drawGradeRow(rowY, avg, pred);
    }
  }

  const mulokSpacing = gp.mulok_row_spacing ?? 21.6;
  const maxMulok = gp.max_mulok_rows ?? 3;
  mulokGrades.slice(0, maxMulok).forEach((g, i) => {
    const rowY = gp.mulok_start_y + (i * mulokSpacing);
    const name = g.name.length > 25 ? g.name.substring(0, 22) + '...' : g.name;
    gradePage.drawText(name, { x: gp.mulok_name_x, y: pageHeight - rowY, size: 9, font: fontRegular, color: defaultColor });
    const avg = (g.knowledge !== null && g.skill !== null)
      ? Math.round((g.knowledge + g.skill) / 2)
      : (g.knowledge ?? g.skill ?? null);
    if (avg !== null) {
      const pred = g.predicate || (avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= kkm ? 'C' : 'D');
      drawGradeRow(rowY, avg, pred);
    }
  });

  // Average
  if (data.overall_average !== null) {
    gradePage.drawText(`${data.overall_average}`, { x: 402, y: pageHeight - gp.average_y, size: 9.5, font: fontBold, color: defaultColor });
    gradePage.drawText(data.overall_predicate, { x: 558, y: pageHeight - gp.average_y, size: 9.5, font: fontBold, color: defaultColor });
  }

  // Rank
  gradePage.drawText(`${data.rank_position}`, { x: gp.rank_position_x, y: pageHeight - gp.rank_y, size: 9.5, font: fontRegular, color: defaultColor });
  gradePage.drawText(`${data.rank_total}`, { x: gp.rank_total_x, y: pageHeight - gp.rank_y, size: 9.5, font: fontRegular, color: defaultColor });

  // Personality — use per-student values when available, fallback to config defaults
  for (const p of gp.personality) {
    let value = p.value;
    if (p.label === 'Sikap Spiritual' && data.kepribadian_spiritual) {
      value = data.kepribadian_spiritual;
    } else if (p.label === 'Sikap Sosial' && data.kepribadian_sosial) {
      value = data.kepribadian_sosial;
    }
    gradePage.drawText(value, { x: p.x, y: pageHeight - p.y, size: 9.5, font: fontRegular, color: defaultColor });
  }

  // Attendance
  gradePage.drawText(`${data.attendance.sick}`, { x: gp.attendance.sick.x, y: pageHeight - gp.attendance.sick.y, size: 9.5, font: fontRegular, color: defaultColor });
  gradePage.drawText(`${data.attendance.permission}`, { x: gp.attendance.permission.x, y: pageHeight - gp.attendance.permission.y, size: 9.5, font: fontRegular, color: defaultColor });
  gradePage.drawText(`${data.attendance.alpha}`, { x: gp.attendance.alpha.x, y: pageHeight - gp.attendance.alpha.y, size: 9.5, font: fontRegular, color: defaultColor });

  // Notes
  const notesFp = gp.homeroom_notes;
  const wrappedLines = wrapText(data.homeroom_notes, notesFp.max_width, fontRegular, notesFp.font_size);
  let notesY = pageHeight - notesFp.y;
  wrappedLines.slice(0, notesFp.max_lines).forEach((line: string) => {
    gradePage.drawText(line, { x: notesFp.x, y: notesY, size: notesFp.font_size, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    notesY -= 12;
  });

  // Date & Signatures
  drawField(gradePage, data.date_string, gp.date);
  drawField(gradePage, `(${data.parent_name || '........................'})`, gp.parent_name);
  drawField(gradePage, data.homeroom_teacher ? `(${data.homeroom_teacher})` : '( Wali Kelas )', gp.homeroom_label);

  // ── Prestasi ──
  const pr = fieldPositions.prestasi_page;
  drawField(prestasiPage, data.student_name, pr.student_name);
  drawField(prestasiPage, data.school_name || 'SDS Taman Harapan', pr.school_name);
  drawField(prestasiPage, data.nisn || data.nis, pr.nisn);

  return pdfDoc.save();
}
