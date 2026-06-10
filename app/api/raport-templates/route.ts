import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const statusFilter = request.nextUrl.searchParams.get('status');

    let query = supabase
      .from('raport_templates')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil template', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('GET raport-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'File PDF wajib diupload' }, { status: 400 });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nama template wajib diisi' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Hanya file PDF yang diterima' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 10MB' }, { status: 400 });
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());

    let pageCount = 0;
    try {
      const pdfDoc = await PDFDocument.load(fileBytes);
      pageCount = pdfDoc.getPageCount();
    } catch {
      return NextResponse.json({ error: 'File PDF tidak valid atau corrupt' }, { status: 400 });
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `template_${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('raport-templates')
      .upload(storagePath, fileBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Gagal upload file', details: uploadError.message }, { status: 500 });
    }

    const { data: template, error: insertError } = await supabase
      .from('raport_templates')
      .insert({
        name: name.trim(),
        description: description.trim(),
        file_url: storagePath,
        file_name: file.name,
        page_count: pageCount,
        page_config: {},
        field_positions: {},
        status: 'draft',
        is_default: false,
      })
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from('raport-templates').remove([storagePath]);
      return NextResponse.json({ error: 'Gagal menyimpan template', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    console.error('POST raport-templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
