import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/school-profile — get the single school profile
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('school_profiles')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/school-profile — upsert the school profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { data: existing } = await supabaseAdmin
      .from('school_profiles')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('school_profiles')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    } else {
      const { data, error } = await supabaseAdmin
        .from('school_profiles')
        .insert(body)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
