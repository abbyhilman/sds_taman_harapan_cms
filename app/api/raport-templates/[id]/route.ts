import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('raport_templates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil template', details: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET raport-templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: existing } = await supabase
      .from('raport_templates')
      .select('id, status')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    const updateFields: Record<string, unknown> = {};

    if (typeof body.name === 'string') updateFields.name = body.name.trim();
    if (typeof body.description === 'string') updateFields.description = body.description.trim();
    if (body.page_config && typeof body.page_config === 'object') updateFields.page_config = body.page_config;
    if (body.field_positions && typeof body.field_positions === 'object') updateFields.field_positions = body.field_positions;

    if (body.page_config || body.field_positions) {
      const currentStatus = existing.status;
      if (currentStatus === 'draft') {
        updateFields.status = 'configured';
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('raport_templates')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Gagal update template', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('PUT raport-templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: existing } = await supabase
      .from('raport_templates')
      .select('id, status, file_url')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    if (existing.status === 'active') {
      return NextResponse.json({ error: 'Template aktif tidak bisa dihapus. Nonaktifkan terlebih dahulu.' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('raport_templates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Gagal menghapus template', details: deleteError.message }, { status: 500 });
    }

    if (existing.file_url) {
      await supabase.storage.from('raport-templates').remove([existing.file_url]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE raport-templates/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
