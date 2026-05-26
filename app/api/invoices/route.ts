import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/invoices?student_id=...&status=...&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('invoices')
      .select(`
        id, amount, status_bayar, due_date, payment_date, description, created_at,
        students(id, full_name, nisn, current_class)
      `, { count: 'exact' })
      .order('due_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (studentId) query = query.eq('student_id', studentId);
    if (status) query = query.eq('status_bayar', status);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data, total: count, page, limit });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/invoices
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, amount, due_date, description, status_bayar } = body;

    if (!student_id || !amount || !due_date) {
      return NextResponse.json({ error: 'student_id, amount, dan due_date wajib diisi' }, { status: 400 });
    }
    if (Number(amount) <= 0) {
      return NextResponse.json({ error: 'Jumlah tagihan harus lebih dari 0' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        student_id,
        amount: Number(amount),
        due_date,
        description: description || 'SPP Bulanan',
        status_bayar: status_bayar || 'pending',
      })
      .select(`id, amount, status_bayar, due_date, payment_date, description, created_at, students(id, full_name, nisn, current_class)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
