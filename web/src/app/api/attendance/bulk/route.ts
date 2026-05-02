export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const records = body.records || [];
    const session = body.session || '2026-2027';

    if (!records.length) {
      return NextResponse.json({ detail: "No records provided" }, { status: 400 });
    }

    const rows = records.map((r: any) => ({
      student_id: r.student_id,
      student_name: r.student_name,
      roll_no: r.roll_no,
      class_name: r.class_name || body.class_name,
      date: r.date || body.date,
      status: r.status,
      session: session,
      remarks: r.remarks || null,
    }));

    const { data, error } = await supabase.from('attendance').insert(rows).select();
    if (error) throw error;

    const present = rows.filter((r: any) => r.status === 'Present').length;
    const absent = rows.filter((r: any) => r.status === 'Absent').length;
    const late = rows.filter((r: any) => r.status === 'Late').length;
    const leave = rows.filter((r: any) => r.status === 'Leave').length;

    return NextResponse.json({ message: `${data.length} records saved`, count: data.length, present, absent, late, leave });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
