import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// PATCH /api/users/[id] — update user profile and optionally password
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { full_name, role, is_active, password } = body;

    const profileUpdates: Record<string, unknown> = {};
    if (full_name !== undefined) profileUpdates.full_name = full_name;
    if (role !== undefined) {
      const validRoles = ['super_admin', 'admin', 'editor', 'viewer'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
      }
      profileUpdates.role = role;
    }
    if (is_active !== undefined) profileUpdates.is_active = is_active;

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password minimal 6 karakter.' },
          { status: 400 }
        );
      }
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password,
      });
      if (pwError) {
        return NextResponse.json({ error: pwError.message }, { status: 500 });
      }
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
    }

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id] — delete user (cascades to profiles via FK)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error: adminError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
