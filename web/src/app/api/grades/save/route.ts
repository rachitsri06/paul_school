export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records = body.grades || [body];

    const { data, error } = await supabase.from('grades').upsert(records).select();
    if (error) throw error;

    return NextResponse.json({ message: "Grades saved", count: data.length });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
