export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireStaff } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireStaff(request);
    const { data, error } = await supabase.from('transport_routes').select('*').order('route_name', { ascending: true });
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
    const { data, error } = await supabase.from('transport_routes').insert(body).select();
    if (error) throw error;

    return NextResponse.json(Array.isArray(body) ? data : data[0]);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
