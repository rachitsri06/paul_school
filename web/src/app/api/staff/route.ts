export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || '';

    let query = supabase.from('staff').select('*');
    if (department) query = query.eq('department', department);

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const { data: staff, error } = await supabase.from('staff').insert(body).select();
    if (error) throw error;

    return NextResponse.json(Array.isArray(body) ? staff : staff[0]);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
