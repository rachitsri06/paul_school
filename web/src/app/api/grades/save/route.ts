export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireStaff } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await requireStaff(request);
    const body = await request.json();
    const records = body.records || body.grades || (Array.isArray(body) ? body : [body]);

    const { data, error } = await supabase.from('grades').upsert(records).select();
    if (error) throw error;

    return NextResponse.json({ message: "Grades saved", count: data.length });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
