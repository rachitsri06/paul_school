export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireStaff } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireStaff(request);
    const { searchParams } = new URL(request.url);
    const class_name = searchParams.get('class_name') || '';
    const session = searchParams.get('session') || '';

    let query = supabase.from('timetable').select('*');
    if (class_name) query = query.eq('class_name', class_name);
    if (session) query = query.eq('session', session);

    const { data, error } = await query.order('day').order('period');
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireStaff(request);
    const body = await request.json();
    const payload = { ...body, session: body.session || '2026-2027' };
    const { data, error } = await supabase.from('timetable').insert(payload).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
