import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/users — list all users with profiles
export async function GET() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data: profiles ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users — create a new user via Supabase Admin API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, role } = body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedFullName = typeof full_name === 'string' ? full_name.trim() : '';
    const normalizedRole = role || 'viewer';

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const validRoles = ['super_admin', 'admin', 'editor', 'viewer'];
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json(
        { error: 'Role tidak valid.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: normalizedFullName,
      },
    });

    if (error) {
      if (
        error.message.includes('already registered') ||
        error.message.includes('already been registered')
      ) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Gagal membuat pengguna.' },
        { status: 500 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          email: normalizedEmail,
          full_name: normalizedFullName,
          role: normalizedRole,
          is_active: true,
        },
        { onConflict: 'id' }
      )
      .select('id, email, full_name, role, is_active, created_at, updated_at')
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: profile }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
