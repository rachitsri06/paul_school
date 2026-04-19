export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPassword, createAccessToken, createRefreshToken, MASTER_ADMIN_EMAIL, MASTER_ADMIN_PASSWORD, MASTER_USER } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    if (!email || !body.password) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 400 });
    }

    // Check for master login
    if (email === MASTER_ADMIN_EMAIL.toLowerCase() && body.password === MASTER_ADMIN_PASSWORD) {
      const access = createAccessToken(MASTER_USER.id, MASTER_USER.email);
      const refresh = createRefreshToken(MASTER_USER.id);

      const response = NextResponse.json({
        ...MASTER_USER,
        token: access
      });

      response.cookies.set('access_token', access, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7200, path: '/' });
      response.cookies.set('refresh_token', refresh, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 604800, path: '/' });

      return response;
    }

    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    if (!user) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(body.password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const access = createAccessToken(user.id, email);
    const refresh = createRefreshToken(user.id);

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name || "",
      role: user.role || "",
      token: access,
      children_ids: user.children_ids || []
    });

    response.cookies.set('access_token', access, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7200, path: '/' });
    response.cookies.set('refresh_token', refresh, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 604800, path: '/' });

    return response;
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
