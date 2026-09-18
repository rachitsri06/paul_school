export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, createAccessToken, createRefreshToken, requireAdmin } from '@/lib/auth';

const ALLOWED_ROLES = ['admin', 'teacher', 'parent'];

export async function POST(request: Request) {
  try {
    // Only an existing admin may create new logins through this endpoint.
    await requireAdmin(request);

    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    if (!email || !body.password || !body.name) {
      return NextResponse.json({ detail: "Missing fields" }, { status: 400 });
    }

    const role = ALLOWED_ROLES.includes(body.role) ? body.role : 'teacher';

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) {
      return NextResponse.json({ detail: "Email already exists" }, { status: 400 });
    }

    const hashed = await hashPassword(body.password);
    const { data: user, error } = await supabase.from('users').insert({
      email,
      password_hash: hashed,
      name: body.name,
      role,
    }).select().single();

    if (error) throw error;

    const access = createAccessToken(user.id, email);
    const refresh = createRefreshToken(user.id);

    const response = NextResponse.json({
      id: user.id,
      email,
      name: body.name,
      role: user.role,
      token: access
    });

    response.cookies.set('access_token', access, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7200, path: '/' });
    response.cookies.set('refresh_token', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800, path: '/' });

    return response;
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
