import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// PATCH /api/invoices/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, due_date, description, status_bayar, payment_date } = body;

    const updates: Record<string, unknown> = {};
    if (amount !== undefined) {
      if (Number(amount) <= 0) return NextResponse.json({ error: 'Jumlah tagihan harus lebih dari 0' }, { status: 400 });
      updates.amount = Number(amount);
    }
    if (due_date !== undefined) updates.due_date = due_date;
    if (description !== undefined) updates.description = description;
    if (status_bayar !== undefined) {
      if (!['pending', 'paid', 'overdue'].includes(status_bayar)) {
        return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
      }
      updates.status_bayar = status_bayar;
      // Auto-set payment_date when marking as paid
      if (status_bayar === 'paid' && !payment_date) {
        updates.payment_date = new Date().toISOString();
      } else if (status_bayar !== 'paid') {
        updates.payment_date = null;
      }
    }
    if (payment_date !== undefined) updates.payment_date = payment_date;

    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select(`id, amount, status_bayar, due_date, payment_date, description, created_at, students(id, full_name, nisn, current_class)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
