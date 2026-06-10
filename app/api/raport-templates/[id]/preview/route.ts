import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_PAGE_CONFIG,
  DEFAULT_FIELD_POSITIONS,
  getGradePageIndex,
} from '@/lib/raport-pdf-config';
import { renderRaportPDF, type RaportRenderData } from '@/lib/raport-pdf-renderer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DUMMY_DATA: RaportRenderData = {
  student_name: 'Ahmad Test Siswa',
  nis: '1234567890',
  nisn: '0012345678',
  birth_place: 'Jakarta',
  birth_date: '15 Januari 2018',
  gender: 'Laki-laki',
  religion: 'Islam',
  address: 'Jl. Contoh Alamat No. 45, Jakarta',
  parent_name: 'Budi Santoso',
  class_name: 'Kelas 3',
  semester_label: 'Ganjil',
  academic_year: '2025/2026',
  school_name: 'SDS Taman Harapan',
  school_address: 'Jl. Pendidikan No. 123, Jakarta',
  subjects: [
    { code: 'PAI', name: 'Pendidikan Agama Islam', knowledge: 85, skill: 88, predicate: 'B' },
    { code: 'PKN', name: 'Pendidikan Pancasila', knowledge: 78, skill: 80, predicate: 'B' },
    { code: 'BIND', name: 'Bahasa Indonesia', knowledge: 90, skill: 85, predicate: 'A' },
    { code: 'MTK', name: 'Matematika', knowledge: 72, skill: 75, predicate: 'C' },
    { code: 'IPA', name: 'Ilmu Pengetahuan Alam', knowledge: 82, skill: 80, predicate: 'B' },
    { code: 'IPS', name: 'Ilmu Pengetahuan Sosial', knowledge: 88, skill: 85, predicate: 'B' },
    { code: 'SBP', name: 'Seni Budaya dan Prakarya', knowledge: 92, skill: 90, predicate: 'A' },
    { code: 'PJOK', name: 'Pendidikan Jasmani', knowledge: 85, skill: 88, predicate: 'B' },
    { code: 'MULOK1', name: 'Bahasa Daerah', knowledge: 80, skill: 78, predicate: 'B' },
    { code: 'MULOK2', name: 'Bahasa Inggris', knowledge: 75, skill: 72, predicate: 'C' },
  ],
  overall_average: 83,
  overall_predicate: 'B',
  rank_position: 5,
  rank_total: 28,
  attendance: { sick: 2, permission: 1, alpha: 0 },
  homeroom_teacher: 'Ibu Siti Rahayu, S.Pd.',
  homeroom_notes: 'Apresiasi: Ahmad menunjukkan kemajuan yang baik semester ini, terutama di Seni Budaya dan Bahasa Indonesia.继续保持 semangat belajar!\n\nRekomendasi: Perlu meningkatkan kemampuan Matematika dengan latihan soal secara rutin.\n\nFokus Perbaikan:\n• Matematika: Kerjakan 5 soal latihan setiap hari\n• Bahasa Inggris: Tonton video pembelajaran dalam bahasa Inggris',
  date_string: 'Jakarta, 10 Juni 2026',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;

    const { data: template, error } = await supabase
      .from('raport_templates')
      .select('*')
      .eq('id', templateId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !template) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    const pageConfig = template.page_config || DEFAULT_PAGE_CONFIG;
    const fieldPositions = template.field_positions || DEFAULT_FIELD_POSITIONS;

    let templateBytes: Uint8Array | null = null;

    if (template.file_url) {
      try {
        const { data: fileData, error: dlError } = await supabase.storage
          .from('raport-templates')
          .download(template.file_url);

        if (!dlError && fileData) {
          templateBytes = new Uint8Array(await fileData.arrayBuffer());
        }
      } catch (err) {
        console.error('Template download failed:', err);
      }
    }

    if (!templateBytes) {
      const templatePath = path.join(process.cwd(), 'template-raport.pdf');
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ error: 'File template tidak ditemukan' }, { status: 500 });
      }
      templateBytes = fs.readFileSync(templatePath);
    }

    const gradePageIndex = getGradePageIndex('Kelas 3', 1, pageConfig);

    const pdfBytes = await renderRaportPDF(
      templateBytes,
      pageConfig,
      fieldPositions,
      gradePageIndex,
      DUMMY_DATA,
    );

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="preview_${template.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ error: 'Gagal generate preview' }, { status: 500 });
  }
}
