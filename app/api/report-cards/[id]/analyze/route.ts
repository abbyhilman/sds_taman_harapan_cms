import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeSemester, isGanjil, previousSemester } from '@/lib/semester-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AIResponse {
  appreciation: string;
  recommendation: string;
  focus_areas: {
    subject: string;
    current_score: number;
    target_score: number;
    priority: string;
    strategies: string[];
    daily_tip: string;
  }[];
  strength_note: string;
  attendance_note: string;
  semester_comparison: {
    previous_average: number | null;
    trend: 'naik' | 'turun' | 'stabil';
    note: string;
  } | null;
}

function extractJSON(text: string): unknown | null {
  try {
    return JSON.parse(text.trim());
  } catch {
    // noop
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.substring(start, end + 1));
    } catch {
      // noop
    }
  }
  return null;
}

function validateAIResponse(raw: unknown): { valid: boolean; data: AIResponse; errors: string[] } {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return {
      valid: false,
      data: { appreciation: '', recommendation: '', focus_areas: [], strength_note: '', attendance_note: '', semester_comparison: null },
      errors: ['Response is not an object'],
    };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.appreciation !== 'string' || obj.appreciation.length < 10) {
    errors.push('appreciation must be a string with min 10 chars');
  }
  if (typeof obj.recommendation !== 'string' || obj.recommendation.length < 10) {
    errors.push('recommendation must be a string with min 10 chars');
  }

  let focusAreas: AIResponse['focus_areas'] = [];
  if (Array.isArray(obj.focus_areas)) {
    focusAreas = obj.focus_areas.filter((fa: any) =>
      fa && typeof fa.subject === 'string' &&
      typeof fa.current_score === 'number' &&
      Array.isArray(fa.strategies) && fa.strategies.length > 0
    );
  }

  let semesterComparison: AIResponse['semester_comparison'] = null;
  if (obj.semester_comparison && typeof obj.semester_comparison === 'object') {
    const sc = obj.semester_comparison as Record<string, unknown>;
    const trend = sc.trend;
    if (trend === 'naik' || trend === 'turun' || trend === 'stabil') {
      semesterComparison = {
        previous_average: typeof sc.previous_average === 'number' ? sc.previous_average : null,
        trend,
        note: typeof sc.note === 'string' ? sc.note : '',
      };
    }
  }

  const data: AIResponse = {
    appreciation: typeof obj.appreciation === 'string' ? obj.appreciation : '',
    recommendation: typeof obj.recommendation === 'string' ? obj.recommendation : '',
    focus_areas: focusAreas,
    strength_note: typeof obj.strength_note === 'string' ? obj.strength_note : '',
    attendance_note: typeof obj.attendance_note === 'string' ? obj.attendance_note : '',
    semester_comparison: semesterComparison,
  };

  return { valid: errors.length === 0, data, errors };
}

async function callAIWithRetry(prompt: string, apiKey: string, maxRetries = 2): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch('https://ai.sumopod.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2500,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`AI API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';

      if (!content) throw new Error('AI returned empty content');

      const parsed = extractJSON(content);
      if (!parsed) throw new Error('No valid JSON found in AI response');

      return content;
    } catch (err) {
      console.error(`AI attempt ${attempt + 1} failed:`, err);
      if (attempt === maxRetries) {
        throw new Error(`AI service failed after ${maxRetries + 1} attempts: ${(err as Error).message}`);
      }
      await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
    }
  }
  throw new Error('AI service unavailable');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportCardId } = await params;

    const { data: reportCard, error: rcError } = await supabase
      .from('report_cards')
      .select('id, semester, class_name, status, student_id, academic_year_id, attendance_sick, attendance_permission, attendance_absent, students(id, full_name, current_class)')
      .eq('id', reportCardId)
      .maybeSingle();

    if (rcError) return NextResponse.json({ error: 'Gagal mengambil data rapor', details: rcError.message }, { status: 500 });
    if (!reportCard) return NextResponse.json({ error: 'Rapor tidak ditemukan' }, { status: 404 });

    const { data: grades, error: gradesError } = await supabase
      .from('report_card_grades')
      .select('id, knowledge_score, skill_score, predicate, subjects(id, name, code)')
      .eq('report_card_id', reportCardId);

    if (gradesError) return NextResponse.json({ error: 'Gagal mengambil data nilai' }, { status: 500 });
    if (!grades || grades.length === 0) return NextResponse.json({ error: 'Belum ada nilai yang diinput' }, { status: 400 });

    const totalSubjects = grades.length;
    const completedGrades = grades.filter(g => g.knowledge_score !== null && g.skill_score !== null);
    const completionRate = totalSubjects > 0 ? (completedGrades.length / totalSubjects) * 100 : 0;

    if (completionRate < 50) {
      return NextResponse.json({
        error: `Minimal 50% nilai harus diinput. Saat ini: ${completionRate.toFixed(0)}%`
      }, { status: 400 });
    }

    const subjectScores = completedGrades.map(g => {
      const subj = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
      const knowledge = Number(g.knowledge_score);
      const skill = Number(g.skill_score);
      const average = (knowledge + skill) / 2;
      return {
        name: subj?.name || 'Unknown',
        code: subj?.code || '',
        knowledge,
        skill,
        average,
        predicate: g.predicate,
      };
    });

    const avgKnowledge = subjectScores.reduce((s, x) => s + x.knowledge, 0) / subjectScores.length;
    const avgSkill = subjectScores.reduce((s, x) => s + x.skill, 0) / subjectScores.length;
    const overallAvg = (avgKnowledge + avgSkill) / 2;

    const sorted = [...subjectScores].sort((a, b) => b.average - a.average);
    const topSubjects = sorted.slice(0, 3);
    const weakSubjects = sorted.filter(s => s.average < 80).sort((a, b) => a.average - b.average);

    const student = Array.isArray(reportCard.students) ? reportCard.students[0] : reportCard.students;
    const studentName = student?.full_name || 'Siswa';
    const className = student?.current_class || reportCard.class_name;

    // ── Fetch Attendance Data ──────────────────────────────────────────────────
    const semesterLabel = normalizeSemester(reportCard.semester);
    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('year_name')
      .eq('id', reportCard.academic_year_id)
      .maybeSingle();

    const academicYearName = academicYear?.year_name || '';

    const { data: attendanceData } = await supabase
      .from('attendance_logs')
      .select('sick, leave_permission, alpha')
      .eq('student_id', reportCard.student_id)
      .eq('semester', semesterLabel)
      .eq('academic_year', academicYearName)
      .maybeSingle();

    const attendance = {
      sick: attendanceData?.sick ?? reportCard.attendance_sick ?? 0,
      permission: attendanceData?.leave_permission ?? reportCard.attendance_permission ?? 0,
      alpha: attendanceData?.alpha ?? reportCard.attendance_absent ?? 0,
    };

    // ── Fetch Previous Semester Data ───────────────────────────────────────────
    let previousAverage: number | null = null;

    const prevSemesterLabel = previousSemester(reportCard.semester);
    let prevAcademicYearId: string | null = null;

    if (isGanjil(reportCard.semester)) {
      const currentYearMatch = academicYearName.match(/^(\d{4})/);
      if (currentYearMatch) {
        const prevYearStart = parseInt(currentYearMatch[1]) - 1;
        const prevYearName = `${prevYearStart}/${prevYearStart + 1}`;
        const { data: prevYear } = await supabase
          .from('academic_years')
          .select('id')
          .eq('year_name', prevYearName)
          .maybeSingle();
        prevAcademicYearId = prevYear?.id || null;
      }
    } else {
      prevAcademicYearId = reportCard.academic_year_id;
    }

    if (prevAcademicYearId) {
      const { data: prevReport } = await supabase
        .from('report_cards')
        .select('id')
        .eq('student_id', reportCard.student_id)
        .eq('academic_year_id', prevAcademicYearId)
        .eq('semester', prevSemesterLabel)
        .maybeSingle();

      if (prevReport) {
        const { data: prevGrades } = await supabase
          .from('report_card_grades')
          .select('knowledge_score, skill_score')
          .eq('report_card_id', prevReport.id);

        if (prevGrades && prevGrades.length > 0) {
          const prevCompleted = prevGrades.filter(g => g.knowledge_score !== null && g.skill_score !== null);
          if (prevCompleted.length > 0) {
            previousAverage = prevCompleted.reduce((sum, g) => sum + (Number(g.knowledge_score) + Number(g.skill_score)) / 2, 0) / prevCompleted.length;
          }
        }
      }
    }

    // ── Build Enhanced Prompt ──────────────────────────────────────────────────
    const weakList = weakSubjects.length > 0
      ? weakSubjects.map(s => `- ${s.name}: Pengetahuan ${s.knowledge}, Keterampilan ${s.skill} (rata-rata ${s.average.toFixed(1)})`).join('\n')
      : '(tidak ada mata pelajaran di bawah 80)';

    const attendanceSection = `
=== DATA KEHADIRAN ===
Sakit: ${attendance.sick} hari
Izin: ${attendance.permission} hari
Alpha: ${attendance.alpha} hari
${attendance.alpha > 3 ? 'Perhatian: Alpha lebih dari 3 hari, perlu menjadi catatan khusus!' : ''}`;

    let comparisonSection = '';
    if (previousAverage !== null) {
      const diff = overallAvg - previousAverage;
      const trendLabel = diff > 3 ? 'naik' : diff < -3 ? 'turun' : 'stabil';
      comparisonSection = `
=== PERBANDINGAN SEMESTER LALU ===
Rata-rata semester lalu: ${previousAverage.toFixed(1)}
Rata-rata semester ini: ${overallAvg.toFixed(1)}
Perubahan: ${diff > 0 ? '+' : ''}${diff.toFixed(1)} (${trendLabel})`;
    } else {
      comparisonSection = `
=== PERBANDINGAN SEMESTER LALU ===
Ini adalah semester pertama siswa atau tidak ada data semester sebelumnya.`;
    }

    const prompt = `Kamu adalah wali kelas SD yang berpengalaman dan bijaksana. Analisa nilai rapor siswa berikut dan berikan catatan yang membangun serta panduan belajar yang konkret.

Nama Siswa: ${studentName}
Kelas: ${className}
Semester: ${reportCard.semester}
Tahun Ajaran: ${academicYearName}

=== DATA NILAI ===
${subjectScores.map(s => `- ${s.name}: Pengetahuan ${s.knowledge}, Keterampilan ${s.skill} (rata-rata ${s.average.toFixed(1)}, Predikat ${s.predicate})`).join('\n')}

Rata-rata Pengetahuan: ${avgKnowledge.toFixed(1)}
Rata-rata Keterampilan: ${avgSkill.toFixed(1)}
Rata-rata Keseluruhan: ${overallAvg.toFixed(1)}

Mata Pelajaran Terbaik (3 tertinggi): ${topSubjects.map(s => `${s.name} (${s.average.toFixed(0)})`).join(', ')}
Mata Pelajaran Perlu Perhatian (< 80):
${weakList}
${attendanceSection}
${comparisonSection}

Berikan response dalam format JSON berikut (HANYA JSON, tanpa teks lain):
{
  "appreciation": "Paragraf apresiasi 2-3 kalimat. Sebutkan nama siswa dan mata pelajaran terbaiknya. Gunakan bahasa positif dan memotivasi.",
  "recommendation": "Paragraf rekomendasi umum 2-3 kalimat. Jika ada mata pelajaran di bawah 80, sebutkan dan berikan saran umum. Jika semua nilai bagus, berikan saran mempertahankan prestasi.",
  "attendance_note": "Catatan singkat tentang kehadiran siswa. Jika alpha > 3 hari, berikan peringatan dan saran. Jika kehadiran baik, berikan apresiasi singkat. Kosongkan jika tidak ada catatan khusus.",
  "focus_areas": [
    {
      "subject": "Nama Mata Pelajaran",
      "current_score": 75,
      "target_score": 85,
      "priority": "tinggi",
      "strategies": [
        "Strategi belajar konkret 1 (spesifik untuk mapel ini)",
        "Strategi belajar konkret 2",
        "Strategi belajar konkret 3"
      ],
      "daily_tip": "Tips harian singkat yang bisa langsung dipraktikkan siswa SD"
    }
  ],
  "strength_note": "Kalimat singkat tentang kekuatan siswa berdasarkan mata pelajaran terbaiknya, dan bagaimana kekuatan ini bisa membantu mapel yang lemah.",
  "semester_comparison": {
    "previous_average": ${previousAverage !== null ? previousAverage.toFixed(1) : 'null'},
    "trend": "naik atau turun atau stabil",
    "note": "Kalimat singkat membandingkan performa semester ini dengan semester lalu. Jika semester pertama, beri semangat untuk semester berikutnya."
  }
}

Catatan: "focus_areas" hanya diisi untuk mata pelajaran dengan rata-rata < 80. Jika tidak ada, isi dengan array kosong []. Strategi harus spesifik, praktis, dan sesuai level SD. "semester_comparison" bisa null jika ini semester pertama.`;

    // ── Call AI with Retry ─────────────────────────────────────────────────────
    const apiKey = process.env.SUMOPOD_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI API key tidak dikonfigurasi' }, { status: 500 });
    }

    let aiContent: string;
    try {
      aiContent = await callAIWithRetry(prompt, apiKey);
    } catch (err) {
      console.error('AI call failed after retries:', err);
      return NextResponse.json({
        error: 'Layanan AI sedang tidak tersedia. Silakan coba lagi nanti atau tulis catatan secara manual.',
        details: (err as Error).message,
      }, { status: 503 });
    }

    // ── Parse & Validate AI Response ───────────────────────────────────────────
    const parsed = extractJSON(aiContent);
    if (!parsed) {
      console.error('AI returned unparseable content:', aiContent.substring(0, 200));
      return NextResponse.json({
        error: 'AI mengembalikan response yang tidak valid. Silakan coba regenerasi.',
      }, { status: 502 });
    }

    const validation = validateAIResponse(parsed);
    if (!validation.valid) {
      console.warn('AI response validation warnings:', validation.errors);
    }

    return NextResponse.json({
      success: true,
      analysis: {
        student_name: studentName,
        class_name: className,
        semester: reportCard.semester,
        total_subjects: totalSubjects,
        completed_subjects: completedGrades.length,
        completion_rate: Math.round(completionRate * 10) / 10,
        average_knowledge: Math.round(avgKnowledge * 10) / 10,
        average_skill: Math.round(avgSkill * 10) / 10,
        overall_average: Math.round(overallAvg * 10) / 10,
        top_subjects: topSubjects.map(s => ({ name: s.name, score: Math.round(s.average) })),
        weak_subjects: weakSubjects.map(s => ({ name: s.name, score: Math.round(s.average) })),
        attendance,
        previous_average: previousAverage !== null ? Math.round(previousAverage * 10) / 10 : null,
      },
      ai_report: validation.data,
    });

  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
