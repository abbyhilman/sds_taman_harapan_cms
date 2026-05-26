import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to map Class & Semester to Grade Page Index in template-raport.pdf
function getGradesPageIndex(className: string, semester: string): number {
  const isGenap = semester.toLowerCase() === 'genap';
  if (className.includes('1')) return isGenap ? 6 : 5;
  if (className.includes('2')) return isGenap ? 8 : 7;
  if (className.includes('3')) return isGenap ? 10 : 9;
  if (className.includes('4')) return isGenap ? 12 : 11;
  if (className.includes('5')) return isGenap ? 14 : 13;
  if (className.includes('6')) return isGenap ? 16 : 15;
  return isGenap ? 6 : 5; // default fallback
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  // Normalize line endings to \n and remove carriage returns
  const normalizedText = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = normalizedText.split('\n');
  const lines: string[] = [];
  
  for (let paragraph of paragraphs) {
    // Remove control characters like tab and line breaks within the paragraph line
    const cleanedParagraph = paragraph.replace(/[\n\r\t]/g, ' ').trim();
    if (cleanedParagraph === '') {
      lines.push('');
      continue;
    }
    
    // Split by spaces to wrap words
    const words = cleanedParagraph.split(/\s+/);
    let currentLine = '';
    for (let word of words) {
      // Clean the word to only contain standard WinAnsi characters to prevent encoding errors
      const cleanWord = word.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
      if (!cleanWord) continue;
      
      const testLine = currentLine ? `${currentLine} ${cleanWord}` : cleanWord;
      let width = 0;
      try {
        width = font.widthOfTextAtSize(testLine, fontSize);
      } catch (err) {
        console.error('Failed to get width of text in wrapText:', testLine, err);
        // Fallback: estimate width if standard font fails
        width = testLine.length * (fontSize * 0.55);
      }
      
      if (width > maxWidth) {
        lines.push(currentLine);
        currentLine = cleanWord;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportCardId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const isDownload = searchParams.get('download') === 'true';
    console.log('Generating PDF for report card:', reportCardId);

    // 1. Fetch Report Card with Student and Academic Year Details
    const { data: reportCard, error: rcError } = await supabase
      .from('report_cards')
      .select(`
        *,
        students (
          *
        ),
        academic_years (
          year_name
        )
      `)
      .eq('id', reportCardId)
      .maybeSingle();

    if (rcError || !reportCard) {
      console.error('Report card fetch error:', rcError);
      return NextResponse.json({ error: 'Rapor tidak ditemukan' }, { status: 404 });
    }

    const student = Array.isArray(reportCard.students) ? reportCard.students[0] : reportCard.students;
    const academicYearName = reportCard.academic_years?.year_name || reportCard.academic_year || '2025/2026';
    const studentId = student?.id;

    // 2. Fetch Grades for this Report Card
    const { data: grades, error: gradesError } = await supabase
      .from('report_card_grades')
      .select(`
        *,
        subjects (
          *
        )
      `)
      .eq('report_card_id', reportCardId);

    if (gradesError) {
      console.error('Grades fetch error:', gradesError);
    }

    const gradesList = grades || [];

    // 3. Fetch Attendance Logs for this student, semester, and academic year
    const { data: attendanceData, error: attError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('student_id', studentId)
      .eq('semester', reportCard.semester)
      .eq('academic_year', academicYearName)
      .order('created_at', { ascending: false })
      .limit(1);

    const attendance = attendanceData?.[0] || null;

    if (attError) {
      console.error('Attendance fetch error:', attError);
    }

    // 4. Fetch total students in this class to show rank total
    const { count: classTotal = 30 } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('current_class', reportCard.class_name)
      .eq('status', 'active')
      .is('deleted_at', null);

    // Calculate Rank (mocked or average-based)
    // For now we query all reports in the same class and rank them by average score
    const { data: siblingReports } = await supabase
      .from('report_cards')
      .select(`
        id,
        report_card_grades (
          knowledge_score,
          skill_score
        )
      `)
      .eq('class_name', reportCard.class_name)
      .eq('semester', reportCard.semester)
      .eq('academic_year_id', reportCard.academic_year_id);

    let rankPosition = 1;
    if (siblingReports && siblingReports.length > 0) {
      const scoredReports = siblingReports.map(r => {
        const gs = r.report_card_grades || [];
        const completed = gs.filter(g => g.knowledge_score !== null && g.skill_score !== null);
        const avg = completed.length 
          ? completed.reduce((sum, g) => sum + (Number(g.knowledge_score) + Number(g.skill_score)) / 2, 0) / completed.length 
          : 0;
        return { id: r.id, average: avg };
      }).sort((a, b) => b.average - a.average);

      const myIndex = scoredReports.findIndex(r => r.id === reportCardId);
      if (myIndex !== -1) {
        rankPosition = myIndex + 1;
      }
    }

    // 5. Load the Template PDF
    const templatePath = path.join(process.cwd(), 'template-raport.pdf');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ error: 'Berkas template-raport.pdf tidak ditemukan' }, { status: 500 });
    }
    const templateBytes = fs.readFileSync(templatePath);
    const templateDoc = await PDFDocument.load(templateBytes);
    
    // 6. Create the output PDF
    const pdfDoc = await PDFDocument.create();
    
    // Identify grade page index
    const gradePageIndex = getGradesPageIndex(reportCard.class_name, reportCard.semester);
    console.log(`Mapping class "${reportCard.class_name}", semester "${reportCard.semester}" to page index ${gradePageIndex}`);
    
    // Pages to copy: Cover (0), Profile (4), Specific Grade Page (gradePageIndex), Prestasi (21)
    const pageIndicesToCopy = [0, 4, gradePageIndex, 21];
    const copiedPages = await pdfDoc.copyPages(templateDoc, pageIndicesToCopy);
    
    // Add pages to new document
    const coverPage = pdfDoc.addPage(copiedPages[0]);
    const profilePage = pdfDoc.addPage(copiedPages[1]);
    const gradePage = pdfDoc.addPage(copiedPages[2]);
    const prestasiPage = pdfDoc.addPage(copiedPages[3]);
    
    // Load Fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Constants
    const pageHeight = 1059.12; // Standard viewport height of the template PDF
    const defaultColor = rgb(0, 0, 0);
    
    // ==========================================
    // COVER PAGE (Page 1)
    // ==========================================
    const coverName = student?.full_name || '';
    const coverNameWidth = fontBold.widthOfTextAtSize(coverName, 14);
    const coverNameX = (750 - coverNameWidth) / 2; // Center horizontally on A4 (width 750)
    
    coverPage.drawText(coverName, {
      x: coverNameX,
      y: pageHeight - 755, // Center line of "Nama Peserta Didik" border box
      size: 14,
      font: fontBold,
      color: defaultColor,
    });
    
    const studentNis = student?.nis || '';
    const studentNisn = student?.nisn || '';
    
    coverPage.drawText(studentNis, {
      x: 315,
      y: pageHeight - 821, // baseline of NIS/NISN line
      size: 11,
      font: fontBold,
      color: defaultColor,
    });
    
    coverPage.drawText(studentNisn, {
      x: 450,
      y: pageHeight - 821, // baseline of NIS/NISN line
      size: 11,
      font: fontBold,
      color: defaultColor,
    });
    
    // ==========================================
    // PROFILE PAGE (Page 2)
    // ==========================================
    const drawProfileField = (value: string, yCoord: number) => {
      profilePage.drawText(value, {
        x: 310,
        y: pageHeight - yCoord,
        size: 10,
        font: fontRegular,
        color: defaultColor,
      });
    };
    
    drawProfileField(student?.full_name || '', 148.8);
    drawProfileField(student?.nis || student?.nisn || '', 172.7);
    const birthDateFormatted = student?.birth_date ? new Date(student.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const ttl = [student?.birth_place, birthDateFormatted].filter(Boolean).join(', ');
    drawProfileField(ttl || '-', 196.7);
    drawProfileField(student?.gender || '-', 220.4);
    drawProfileField(student?.religion || '-', 247.9);
    drawProfileField('Anak', 268.5); // Status in family
    drawProfileField(student?.address || '-', 292.3);
    drawProfileField(student?.parent_name || '-', 483.5); // Father/Parent name
    drawProfileField('-', 507.5); // Mother name fallback
    drawProfileField(student?.address || '-', 531.4); // Parent address
    
    // ==========================================
    // GRADES PAGE (Page 3)
    // ==========================================
    // Header Info
    const drawGradeHeader = (value: string, xCoord: number, yCoord: number) => {
      gradePage.drawText(value, {
        x: xCoord,
        y: pageHeight - yCoord,
        size: 9.5,
        font: fontRegular,
        color: defaultColor,
      });
    };
    
    drawGradeHeader(student?.full_name || '', 233, 88.6);
    drawGradeHeader(reportCard.class_name || '', 560, 88.6);
    drawGradeHeader(student?.nisn || '', 233, 107.1);
    drawGradeHeader(reportCard.semester || '', 560, 107.1);
    drawGradeHeader('SDS Taman Harapan', 233, 125.4);
    drawGradeHeader(academicYearName, 560, 125.4);
    drawGradeHeader('Jl. Pendidikan No. 123, Jakarta', 233, 143.7);
    
    // Map subjects to row y-coordinates
    const subjectRowYMap: Record<string, number> = {
      'PAI': 222.2,
      'PKN': 248.5,
      'BIND': 265.1,
      'MTK': 286.4,
      'IPA': 307.8,
      'IPS': 329.3,
      'SBP': 350.7,
      'SBDP': 350.7,
      'PJOK': 372.2,
    };
    
    // Separate core grades and Mulok (Muatan Lokal) grades
    const mulokGrades: any[] = [];
    const coreGrades: any[] = [];
    
    gradesList.forEach((g: any) => {
      const subj = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
      const code = subj?.code || '';
      if (subjectRowYMap[code]) {
        coreGrades.push(g);
      } else {
        mulokGrades.push(g);
      }
    });
    
    // Draw Core Subject Grades
    coreGrades.forEach((g: any) => {
      const subj = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
      const code = subj?.code || '';
      const rowY = subjectRowYMap[code];
      
      const knowledge = g.knowledge_score !== null ? Number(g.knowledge_score) : null;
      const skill = g.skill_score !== null ? Number(g.skill_score) : null;
      const avg = (knowledge !== null && skill !== null) ? Math.round((knowledge + skill) / 2) : (knowledge || skill || null);
      
      if (avg !== null) {
        // Draw KKM (70 by default)
        gradePage.drawText('70', {
          x: 322,
          y: pageHeight - rowY,
          size: 9.5,
          font: fontRegular,
          color: defaultColor,
        });
        // Draw Nilai Angka
        gradePage.drawText(`${avg}`, {
          x: 402,
          y: pageHeight - rowY,
          size: 9.5,
          font: fontRegular,
          color: defaultColor,
        });
        // Draw Predicate / Nilai Huruf
        const pred = g.predicate || (avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : 'D');
        gradePage.drawText(pred, {
          x: 558,
          y: pageHeight - rowY,
          size: 9.5,
          font: fontBold,
          color: defaultColor,
        });
      }
    });
    
    // Draw Mulok grades on rows: 9a (429.2), 9b (450.8), 9c (483.3)
    const mulokRowY = [429.2, 450.8, 483.3];
    mulokGrades.slice(0, 3).forEach((g: any, i: number) => {
      const subj = Array.isArray(g.subjects) ? g.subjects[0] : g.subjects;
      const name = subj?.name || '';
      const rowY = mulokRowY[i];
      
      const knowledge = g.knowledge_score !== null ? Number(g.knowledge_score) : null;
      const skill = g.skill_score !== null ? Number(g.skill_score) : null;
      const avg = (knowledge !== null && skill !== null) ? Math.round((knowledge + skill) / 2) : (knowledge || skill || null);
      
      // Draw Mulok Name (max 20 chars)
      const displayName = name.length > 25 ? name.substring(0, 22) + '...' : name;
      gradePage.drawText(displayName, {
        x: 120,
        y: pageHeight - rowY,
        size: 9,
        font: fontRegular,
        color: defaultColor,
      });
      
      if (avg !== null) {
        gradePage.drawText('70', {
          x: 322,
          y: pageHeight - rowY,
          size: 9.5,
          font: fontRegular,
          color: defaultColor,
        });
        gradePage.drawText(`${avg}`, {
          x: 402,
          y: pageHeight - rowY,
          size: 9.5,
          font: fontRegular,
          color: defaultColor,
        });
        const pred = g.predicate || (avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : 'D');
        gradePage.drawText(pred, {
          x: 558,
          y: pageHeight - rowY,
          size: 9.5,
          font: fontBold,
          color: defaultColor,
        });
      }
    });
    
    // Calculate and draw averages
    const completedGrades = gradesList.filter((g: any) => g.knowledge_score !== null && g.skill_score !== null);
    if (completedGrades.length > 0) {
      const avgKnowledge = completedGrades.reduce((sum: number, g: any) => sum + Number(g.knowledge_score), 0) / completedGrades.length;
      const avgSkill = completedGrades.reduce((sum: number, g: any) => sum + Number(g.skill_score), 0) / completedGrades.length;
      const overallAvg = Math.round((avgKnowledge + avgSkill) / 2);
      
      // Draw Nilai Rata-rata
      gradePage.drawText(`${overallAvg}`, {
        x: 402,
        y: pageHeight - 493.6,
        size: 9.5,
        font: fontBold,
        color: defaultColor,
      });
      
      const overallPred = overallAvg >= 90 ? 'A' : overallAvg >= 80 ? 'B' : overallAvg >= 70 ? 'C' : 'D';
      gradePage.drawText(overallPred, {
        x: 558,
        y: pageHeight - 493.6,
        size: 9.5,
        font: fontBold,
        color: defaultColor,
      });
    }
    
    // Draw Peringkat (Rank)
    gradePage.drawText(`${rankPosition}`, {
      x: 360,
      y: pageHeight - 515.0,
      size: 9.5,
      font: fontRegular,
      color: defaultColor,
    });
    gradePage.drawText(`${classTotal}`, {
      x: 520,
      y: pageHeight - 515.0,
      size: 9.5,
      font: fontRegular,
      color: defaultColor,
    });
    
    // Draw default Kepribadian values
    gradePage.drawText('Baik', { x: 322, y: pageHeight - 574.2, size: 9.5, font: fontRegular, color: defaultColor });
    gradePage.drawText('Baik', { x: 322, y: pageHeight - 595.9, size: 9.5, font: fontRegular, color: defaultColor });
    gradePage.drawText('Baik', { x: 322, y: pageHeight - 617.3, size: 9.5, font: fontRegular, color: defaultColor });
    
    // Draw Attendance values from logs
    const sickDays = attendance?.sick ?? 0;
    const permDays = attendance?.leave_permission ?? 0;
    const alphaDays = attendance?.alpha ?? 0;
    
    gradePage.drawText(`${sickDays}`, { x: 640, y: pageHeight - 595.9, size: 9.5, font: fontRegular, color: defaultColor });
    gradePage.drawText(`${permDays}`, { x: 640, y: pageHeight - 574.2, size: 9.5, font: fontRegular, color: defaultColor });
    gradePage.drawText(`${alphaDays}`, { x: 640, y: pageHeight - 617.3, size: 9.5, font: fontRegular, color: defaultColor });
    
    // Draw Catatan Wali Kelas (Apresiasi & Rekomendasi)
    let appreciationText = '';
    let recommendationText = '';
    
    const notesRaw = reportCard.homeroom_notes || '';
    if (notesRaw.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(notesRaw);
        appreciationText = parsed.appreciation || '';
        recommendationText = parsed.recommendation || '';
      } catch (e) {
        console.error('Failed to parse homeroom_notes JSON in PDF generator:', e);
        appreciationText = notesRaw;
      }
    } else {
      appreciationText = notesRaw;
    }
    
    const fullNotes = `Apresiasi: ${appreciationText}\n\nRekomendasi: ${recommendationText}`;
    
    const wrappedLines = wrapText(fullNotes, 550, fontRegular, 8.5);
    let currentY = pageHeight - 675;
    wrappedLines.slice(0, 6).forEach((line: string) => {
      gradePage.drawText(line, {
        x: 105,
        y: currentY,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= 12; // Line spacing
    });
    
    // Draw signature info
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    gradePage.drawText(`Jakarta, ${dateStr}`, {
      x: 483.7,
      y: pageHeight - 880.6,
      size: 9.5,
      font: fontRegular,
      color: defaultColor,
    });
    gradePage.drawText(`(${student?.parent_name || '........................'})`, {
      x: 105,
      y: pageHeight - 960.2,
      size: 9.5,
      font: fontRegular,
      color: defaultColor,
    });
    gradePage.drawText('( Wali Kelas )', {
      x: 520,
      y: pageHeight - 960.2,
      size: 9.5,
      font: fontRegular,
      color: defaultColor,
    });
    
    // ==========================================
    // PRESTASI PAGE (Page 4)
    // ==========================================
    prestasiPage.drawText(student?.full_name || '', { x: 260, y: pageHeight - 134.1, size: 10, font: fontRegular, color: defaultColor });
    prestasiPage.drawText('SDS Taman Harapan', { x: 260, y: pageHeight - 168.2, size: 10, font: fontRegular, color: defaultColor });
    prestasiPage.drawText(student?.nisn || student?.nis || '', { x: 260, y: pageHeight - 202.1, size: 10, font: fontRegular, color: defaultColor });
    
    // 7. Save PDF Bytes and Stream
    const pdfBytes = await pdfDoc.save();
    
    const safeName = student?.full_name ? student.full_name.replace(/[^a-zA-Z0-9]/g, '_') : 'siswa';
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
