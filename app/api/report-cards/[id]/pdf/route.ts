import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_PAGE_CONFIG,
  DEFAULT_FIELD_POSITIONS,
  getGradePageIndex,
  type PageConfig,
  type FieldPositions,
} from '@/lib/raport-pdf-config';
import { renderRaportPDF, type RaportRenderData, type SubjectGrade } from '@/lib/raport-pdf-renderer';
import { normalizeSemester } from '@/lib/semester-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportCardId } = await params;
    const isDownload = request.nextUrl.searchParams.get('download') === 'true';
    console.log('Generating PDF for report card:', reportCardId);

    // ── 1. Fetch Report Card ─────────────────────────────────────────────
    const { data: reportCard, error: rcError } = await supabase
      .from('report_cards')
      .select('*, students (*), academic_years (year_name)')
      .eq('id', reportCardId)
      .maybeSingle();

    if (rcError || !reportCard) {
      console.error('Report card fetch error:', rcError);
      return NextResponse.json({ error: 'Rapor tidak ditemukan' }, { status: 404 });
    }

    const student = Array.isArray(reportCard.students) ? reportCard.students[0] : reportCard.students;
    const academicYearName = reportCard.academic_years?.year_name || reportCard.academic_year || '2025/2026';

    // ── 2. Fetch Grades ──────────────────────────────────────────────────
    const { data: grades, error: gradesError } = await supabase
      .from('report_card_grades')
      .select('*, subjects (*)')
      .eq('report_card_id', reportCardId);

    if (gradesError) console.error('Grades fetch error:', gradesError);
    const gradesList = grades || [];

    // ── 3. Fetch Attendance ──────────────────────────────────────────────
    const { data: attendanceData } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('student_id', student?.id)
      .eq('semester', normalizeSemester(reportCard.semester))
      .eq('academic_year', academicYearName)
      .order('created_at', { ascending: false })
      .limit(1);

    const attendance = attendanceData?.[0] || null;

    // ── 4. Rank Calculation ──────────────────────────────────────────────
    const { count: classTotal = 30 } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('current_class', reportCard.class_name)
      .eq('status', 'active')
      .is('deleted_at', null);

    const { data: siblingReports } = await supabase
      .from('report_cards')
      .select('id, report_card_grades (knowledge_score, skill_score)')
      .eq('class_name', reportCard.class_name)
      .eq('semester', reportCard.semester)
      .eq('academic_year_id', reportCard.academic_year_id);

    let rankPosition = 1;
    if (siblingReports && siblingReports.length > 0) {
      const scored = siblingReports.map(r => {
        const gs = r.report_card_grades || [];
        const done = gs.filter((g: any) => g.knowledge_score !== null && g.skill_score !== null);
        const avg = done.length
          ? done.reduce((s: number, g: any) => s + (Number(g.knowledge_score) + Number(g.skill_score)) / 2, 0) / done.length
          : 0;
        return { id: r.id, average: avg };
      }).sort((a, b) => b.average - a.average);

      const idx = scored.findIndex(r => r.id === reportCardId);
      if (idx !== -1) rankPosition = idx + 1;
    }

    // ── 5. Load Template Config ──────────────────────────────────────────
    const { data: activeTemplate } = await supabase
      .from('raport_templates')
      .select('*')
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle();

    let pageConfig: PageConfig = DEFAULT_PAGE_CONFIG;
    let fieldPositions: FieldPositions = DEFAULT_FIELD_POSITIONS;
    let templateBytes: Uint8Array | null = null;

    if (activeTemplate?.file_url) {
      console.log(`Loading template: ${activeTemplate.name} (${activeTemplate.file_url})`);
      try {
        const { data: fileData, error: dlError } = await supabase.storage
          .from('raport-templates')
          .download(activeTemplate.file_url);

        if (!dlError && fileData) {
          templateBytes = new Uint8Array(await fileData.arrayBuffer());
          pageConfig = activeTemplate.page_config || DEFAULT_PAGE_CONFIG;
          fieldPositions = activeTemplate.field_positions || DEFAULT_FIELD_POSITIONS;
        }
      } catch (err) {
        console.error('Template storage download failed:', err);
      }
    }

    if (!templateBytes) {
      console.log('Falling back to filesystem template-raport.pdf');
      const templatePath = path.join(process.cwd(), 'template-raport.pdf');
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: 'Template raport tidak ditemukan' }, { status: 500 });
      }
      templateBytes = fs.readFileSync(templatePath);
    }

    // ── 6. Build Render Data ─────────────────────────────────────────────
    const kkm = fieldPositions.grade_page.kkm ?? 70;
    const subjects: SubjectGrade[] = gradesList.map((g: any) => {
      const subj = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
      return {
        code: subj?.code || '',
        name: subj?.name || '',
        knowledge: g.knowledge_score !== null ? Number(g.knowledge_score) : null,
        skill: g.skill_score !== null ? Number(g.skill_score) : null,
        predicate: g.predicate || '',
      };
    });

    const completed = subjects.filter(s => s.knowledge !== null && s.skill !== null);
    let overallAverage: number | null = null;
    let overallPredicate = '';
    if (completed.length > 0) {
      const avgK = completed.reduce((s, g) => s + (g.knowledge || 0), 0) / completed.length;
      const avgS = completed.reduce((s, g) => s + (g.skill || 0), 0) / completed.length;
      overallAverage = Math.round((avgK + avgS) / 2);
      overallPredicate = overallAverage >= 90 ? 'A' : overallAverage >= 80 ? 'B' : overallAverage >= kkm ? 'C' : 'D';
    }

    // Build homeroom notes
    const notesRaw = reportCard.homeroom_notes || '';
    let appreciationText = '';
    let recommendationText = '';
    const focusAreas: any[] = [];

    if (notesRaw.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(notesRaw);
        appreciationText = parsed.appreciation || '';
        recommendationText = parsed.recommendation || '';
        if (Array.isArray(parsed.focus_areas)) focusAreas.push(...parsed.focus_areas);
      } catch {
        appreciationText = notesRaw;
      }
    } else {
      appreciationText = notesRaw;
    }

    let homeroomNotes = `Apresiasi: ${appreciationText}\n\nRekomendasi: ${recommendationText}`;
    if (focusAreas.length > 0) {
      const faLines = focusAreas.slice(0, 2).map((fa: any) =>
        `• ${fa.subject}: ${fa.strategies?.[0] || 'Perlu latihan lebih lanjut'}`
      );
      homeroomNotes += '\n\nFokus Perbaikan:\n' + faLines.join('\n');
    }

    const birthDate = student?.birth_date
      ? new Date(student.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const renderData: RaportRenderData = {
      student_name: student?.full_name || '',
      nis: student?.nis || '',
      nisn: student?.nisn || '',
      birth_place: student?.birth_place || '',
      birth_date: birthDate,
      gender: student?.gender || '',
      religion: student?.religion || '',
      address: student?.address || '',
      parent_name: student?.parent_name || '',
      class_name: reportCard.class_name || '',
      semester_label: normalizeSemester(reportCard.semester),
      academic_year: academicYearName,
      school_name: 'SDS Taman Harapan',
      school_address: 'Jl. Pendidikan No. 123, Jakarta',
      subjects,
      overall_average: overallAverage,
      overall_predicate: overallPredicate,
      rank_position: rankPosition,
      rank_total: classTotal ?? 30,
      attendance: {
        sick: attendance?.sick ?? 0,
        permission: attendance?.leave_permission ?? 0,
        alpha: attendance?.alpha ?? 0,
      },
      homeroom_teacher: reportCard.homeroom_teacher || '',
      homeroom_notes: homeroomNotes,
      date_string: `Jakarta, ${dateStr}`,
      kepribadian_spiritual: reportCard.kepribadian_spiritual || undefined,
      kepribadian_sosial: reportCard.kepribadian_sosial || undefined,
    };

    // ── 7. Render PDF ────────────────────────────────────────────────────
    const gradePageIndex = getGradePageIndex(reportCard.class_name, reportCard.semester, pageConfig);
    console.log(`Class "${reportCard.class_name}", semester ${reportCard.semester} → page index ${gradePageIndex}`);

    const pdfBytes = await renderRaportPDF(templateBytes, pageConfig, fieldPositions, gradePageIndex, renderData);

    const safeName = student?.full_name
      ? student.full_name.replace(/[^a-zA-Z0-9]/g, '_')
      : 'siswa';

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="raport_${safeName}_${student?.nisn || ''}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating report PDF:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
