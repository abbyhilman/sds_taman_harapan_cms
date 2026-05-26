import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportCardId } = await params;

    // Fetch report card with student info
    const { data: reportCard, error: rcError } = await supabase
      .from('report_cards')
      .select('id, semester, class_name, status, students(id, full_name, current_class)')
      .eq('id', reportCardId)
      .maybeSingle();

    if (rcError) return NextResponse.json({ error: 'Gagal mengambil data rapor', details: rcError.message }, { status: 500 });
    if (!reportCard) return NextResponse.json({ error: 'Rapor tidak ditemukan' }, { status: 404 });

    // Fetch grades
    const { data: grades, error: gradesError } = await supabase
      .from('report_card_grades')
      .select('id, knowledge_score, skill_score, predicate, subjects(id, name, code)')
      .eq('report_card_id', reportCardId);

    if (gradesError) return NextResponse.json({ error: 'Gagal mengambil data nilai' }, { status: 500 });
    if (!grades || grades.length === 0) return NextResponse.json({ error: 'Belum ada nilai yang diinput' }, { status: 400 });

    const completedGrades = grades.filter(g => g.knowledge_score !== null && g.skill_score !== null);
    const completionRate = (completedGrades.length / grades.length) * 100;

    if (completionRate < 50) {
      return NextResponse.json({
        error: `Minimal 50% nilai harus diinput. Saat ini: ${completionRate.toFixed(0)}%`
      }, { status: 400 });
    }

    // Build subject scores
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

    // ── AI Prompt ──────────────────────────────────────────────────────────────
    const weakList = weakSubjects.length > 0
      ? weakSubjects.map(s => `- ${s.name}: Pengetahuan ${s.knowledge}, Keterampilan ${s.skill} (rata-rata ${s.average.toFixed(1)})`).join('\n')
      : '(tidak ada mata pelajaran di bawah 80)';

    const prompt = `Kamu adalah wali kelas SD yang berpengalaman dan bijaksana. Analisa nilai rapor siswa berikut dan berikan catatan yang membangun serta panduan belajar yang konkret.

Nama Siswa: ${studentName}
Kelas: ${className}
Semester: ${reportCard.semester}

Semua Nilai Mata Pelajaran:
${subjectScores.map(s => `- ${s.name}: Pengetahuan ${s.knowledge}, Keterampilan ${s.skill} (rata-rata ${s.average.toFixed(1)}, Predikat ${s.predicate})`).join('\n')}

Rata-rata Pengetahuan: ${avgKnowledge.toFixed(1)}
Rata-rata Keterampilan: ${avgSkill.toFixed(1)}
Rata-rata Keseluruhan: ${overallAvg.toFixed(1)}

Mata Pelajaran Terbaik (3 tertinggi): ${topSubjects.map(s => `${s.name} (${s.average.toFixed(0)})`).join(', ')}
Mata Pelajaran Perlu Perhatian (< 80): 
${weakList}

Berikan response dalam format JSON berikut (HANYA JSON, tanpa teks lain):
{
  "appreciation": "Paragraf apresiasi 2-3 kalimat. Sebutkan nama siswa dan mata pelajaran terbaiknya. Gunakan bahasa positif dan memotivasi.",
  "recommendation": "Paragraf rekomendasi umum 2-3 kalimat. Jika ada mata pelajaran di bawah 80, sebutkan dan berikan saran umum. Jika semua nilai bagus, berikan saran mempertahankan prestasi.",
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
  "strength_note": "Kalimat singkat tentang kekuatan siswa berdasarkan mata pelajaran terbaiknya, dan bagaimana kekuatan ini bisa membantu mapel yang lemah."
}

Catatan: "focus_areas" hanya diisi untuk mata pelajaran dengan rata-rata < 80. Jika tidak ada, isi dengan array kosong []. Strategi harus spesifik, praktis, dan sesuai level SD.`;

    // ── Call AI ────────────────────────────────────────────────────────────────
    const aiResponse = await fetch('https://ai.sumopod.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUMOPOD_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'kimi-k2.6',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error('AI Error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // Parse AI response
    let aiReport: {
      appreciation: string;
      recommendation: string;
      focus_areas: { subject: string; current_score: number; target_score: number; priority: string; strategies: string[]; daily_tip: string }[];
      strength_note: string;
    } = { appreciation: '', recommendation: '', focus_areas: [], strength_note: '' };

    try {
      const match = aiContent.match(/\{[\s\S]*\}/);
      if (match) aiReport = JSON.parse(match[0]);
    } catch {
      aiReport.appreciation = aiContent;
    }

    return NextResponse.json({
      success: true,
      analysis: {
        student_name: studentName,
        class_name: className,
        semester: reportCard.semester,
        total_subjects: grades.length,
        completed_subjects: completedGrades.length,
        completion_rate: completionRate,
        average_knowledge: Math.round(avgKnowledge * 10) / 10,
        average_skill: Math.round(avgSkill * 10) / 10,
        overall_average: Math.round(overallAvg * 10) / 10,
        top_subjects: topSubjects.map(s => ({ name: s.name, score: Math.round(s.average) })),
        weak_subjects: weakSubjects.map(s => ({ name: s.name, score: Math.round(s.average) })),
      },
      ai_report: aiReport,
    });

  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
