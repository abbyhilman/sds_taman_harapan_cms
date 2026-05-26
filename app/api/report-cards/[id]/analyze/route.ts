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
    console.log('Analyzing report card:', reportCardId);

    // Fetch report card with student info
    const { data: reportCard, error: rcError } = await supabase
      .from('report_cards')
      .select(`
        id,
        semester,
        class_name,
        status,
        students (
          id,
          full_name,
          current_class
        )
      `)
      .eq('id', reportCardId)
      .maybeSingle();

    console.log('Report card query result:', { reportCard, rcError });

    if (rcError) {
      console.error('Report card error:', rcError);
      return NextResponse.json({ error: 'Gagal mengambil data rapor', details: rcError.message }, { status: 500 });
    }

    if (!reportCard) {
      return NextResponse.json({ error: 'Rapor tidak ditemukan' }, { status: 404 });
    }

    // Fetch grades for this report card
    const { data: grades, error: gradesError } = await supabase
      .from('report_card_grades')
      .select(`
        id,
        knowledge_score,
        skill_score,
        predicate,
        subjects (
          id,
          name,
          code
        )
      `)
      .eq('report_card_id', reportCardId);

    console.log('Grades query result:', { gradesCount: grades?.length, gradesError });

    if (gradesError) {
      return NextResponse.json({ error: 'Gagal mengambil data nilai' }, { status: 500 });
    }

    if (!grades || grades.length === 0) {
      return NextResponse.json({ error: 'Belum ada nilai yang diinput' }, { status: 400 });
    }

    // Calculate statistics
    const completedGrades = grades.filter(g => g.knowledge_score !== null && g.skill_score !== null);
    const completionRate = (completedGrades.length / grades.length) * 100;

    if (completionRate < 50) {
      return NextResponse.json({ 
        error: `Minimal 50% nilai harus diinput. Saat ini: ${completionRate.toFixed(0)}%` 
      }, { status: 400 });
    }

    // Calculate averages and identify top/weak subjects
    const subjectScores = completedGrades.map(g => {
      const subj = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
      return {
        name: subj?.name || 'Unknown',
        code: subj?.code || '',
        knowledge: Number(g.knowledge_score),
        skill: Number(g.skill_score),
        average: (Number(g.knowledge_score) + Number(g.skill_score)) / 2,
        predicate: g.predicate
      };
    });

    const avgKnowledge = subjectScores.reduce((sum, s) => sum + s.knowledge, 0) / subjectScores.length;
    const avgSkill = subjectScores.reduce((sum, s) => sum + s.skill, 0) / subjectScores.length;
    const overallAvg = (avgKnowledge + avgSkill) / 2;

    // Sort to find top and weak subjects
    const sorted = [...subjectScores].sort((a, b) => b.average - a.average);
    const topSubjects = sorted.slice(0, 3);
    const weakSubjects = sorted.slice(-3).reverse();

    // Build AI prompt
    const student = Array.isArray(reportCard.students) ? reportCard.students[0] : reportCard.students;
    const studentName = student?.full_name || 'Siswa';
    const className = student?.current_class || reportCard.class_name;

    const prompt = `Kamu adalah wali kelas SD yang berpengalaman dan bijaksana. Analisa nilai rapor siswa berikut dan berikan catatan yang membangun.

Nama Siswa: ${studentName}
Kelas: ${className}
Semester: ${reportCard.semester}

Nilai Mata Pelajaran:
${subjectScores.map(s => `- ${s.name}: Pengetahuan ${s.knowledge}, Keterampilan ${s.skill} (Predikat ${s.predicate})`).join('\n')}

Rata-rata Pengetahuan: ${avgKnowledge.toFixed(1)}
Rata-rata Keterampilan: ${avgSkill.toFixed(1)}
Rata-rata Keseluruhan: ${overallAvg.toFixed(1)}

Mata Pelajaran Terbaik: ${topSubjects.map(s => `${s.name} (${s.average.toFixed(0)})`).join(', ')}
Mata Pelajaran Perlu Perhatian: ${weakSubjects.filter(s => s.average < 80).map(s => `${s.name} (${s.average.toFixed(0)})`).join(', ') || 'Tidak ada'}

Berikan response dalam format JSON:
{
  "appreciation": "Paragraf apresiasi 2-3 kalimat. Sebutkan nama siswa dan mata pelajaran terbaiknya. Gunakan bahasa yang positif dan memotivasi.",
  "recommendation": "Paragraf rekomendasi 2-3 kalimat. Jika ada mata pelajaran di bawah 80, sebutkan dan berikan saran konkret untuk perbaikan. Jika semua nilai bagus, berikan saran untuk mempertahankan prestasi."
}`;

    // Call AI
    const aiResponse = await fetch('https://ai.sumopod.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUMOPOD_API_KEY}`
      },
      body: JSON.stringify({
        model: 'kimi-k2.6',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      console.error('AI Error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // Parse AI response
    let aiReport = { appreciation: '', recommendation: '' };
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
        weak_subjects: weakSubjects.filter(s => s.average < 80).map(s => ({ name: s.name, score: Math.round(s.average) }))
      },
      ai_report: aiReport
    });

  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
