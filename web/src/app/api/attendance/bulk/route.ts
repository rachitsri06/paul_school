export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records = body.records || [];

    if (!records.length) {
      return NextResponse.json({ detail: "No records provided" }, { status: 400 });
    }

    const rows = records.map((r: any) => ({
      student_id: r.student_id,
      class_name: r.class_name || body.class_name,
      date: r.date || body.date,
      status: r.status,
      remarks: r.remarks || null,
    }));

    const { data, error } = await supabase.from('attendance').insert(rows).select();
    if (error) throw error;

    return NextResponse.json({ message: `${data.length} attendance records saved`, count: data.length });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
