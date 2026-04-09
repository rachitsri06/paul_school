export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const class_name = searchParams.get('class_name') || '';
    const section = searchParams.get('section') || '';

    let query = supabase.from('students').select('*');

    if (search) {
      query = query.or(`name.ilike.%${search}%,roll_no.ilike.%${search}%`);
    }
    if (class_name) query = query.eq('class_name', class_name);
    if (section) query = query.eq('section', section);

    const { data: students, error } = await query.limit(1000);
    if (error) throw error;

    return NextResponse.json(students || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const { data: student, error } = await supabase.from('students').insert(body).select().single();
    if (error) throw error;

    return NextResponse.json(student);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
