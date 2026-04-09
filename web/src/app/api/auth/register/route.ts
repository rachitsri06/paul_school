export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, createAccessToken, createRefreshToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    if (!email || !body.password || !body.name) {
      return NextResponse.json({ detail: "Missing fields" }, { status: 400 });
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) {
      return NextResponse.json({ detail: "Email already exists" }, { status: 400 });
    }

    const hashed = await hashPassword(body.password);
    const { data: user, error } = await supabase.from('users').insert({
      email,
      password_hash: hashed,
      name: body.name,
      role: body.role || 'teacher',
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

    response.cookies.set('access_token', access, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7200, path: '/' });
    response.cookies.set('refresh_token', refresh, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 604800, path: '/' });

    return response;
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
