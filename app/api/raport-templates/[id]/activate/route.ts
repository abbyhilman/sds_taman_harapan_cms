import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: target } = await supabase
      .from('raport_templates')
      .select('id, status')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!target) {
      return NextResponse.json({ error: 'Template tidak ditemukan' }, { status: 404 });
    }

    await supabase
      .from('raport_templates')
      .update({ status: 'configured' })
      .eq('status', 'active')
      .is('deleted_at', null);

    const { data: activated, error } = await supabase
      .from('raport_templates')
      .update({ status: 'active' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Gagal mengaktifkan template', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: activated });
  } catch (error) {
    console.error('POST raport-templates/[id]/activate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
