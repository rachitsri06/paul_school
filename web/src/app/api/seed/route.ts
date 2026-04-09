export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
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
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
