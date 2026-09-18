export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Master admin can always log in via /api/auth/login, so this is only
    // reachable by someone who is already an admin.
    await requireAdmin(request);

    // Check if admin already exists
    const { data: existing } = await supabase.from('users').select('id').eq('email', 'admin@stpauls.edu').single();
    if (existing) {
      return NextResponse.json({ message: "Admin user already exists", id: existing.id });
    }

    const hashed = await hashPassword('admin123');
    const { data: admin, error } = await supabase.from('users').insert({ 
      email: 'admin@stpauls.edu',
      password_hash: hashed,
      name: 'Admin',
      role: 'admin'
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ message: "Admin user seeded", id: admin.id });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
