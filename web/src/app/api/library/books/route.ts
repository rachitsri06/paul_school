export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireStaff } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireStaff(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = supabase.from('library_books').select('*');
    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
    }

    const { data, error } = await query.order('title', { ascending: true });
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

    const { data, error } = await supabase.from('library_books').insert(body).select();
    if (error) throw error;

    return NextResponse.json(Array.isArray(body) ? data : data[0]);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
