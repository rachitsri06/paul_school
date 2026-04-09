export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, { params }: { params: Promise<{ report_type: string }> }) {
  try {
    const { report_type } = await params;

    let result: any = {};

    switch (report_type) {
      case 'attendance': {
        const { data } = await supabase.from('attendance').select('status');
        const total = data?.length || 0;
        const present = data?.filter((r: any) => r.status === 'present').length || 0;
        result = { total_records: total, present, absent: total - present, rate: total ? Math.round((present / total) * 100) : 0 };
        break;
      }
      case 'fees': {
        const { data } = await supabase.from('fee_payments').select('amount, status');
        const total = data?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
        const collected = data?.filter((r: any) => r.status === 'completed').reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
        result = { total_amount: total, collected, pending: total - collected };
        break;
      }
      case 'students': {
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
        result = { total_students: count || 0 };
        break;
      }
      default:
        return NextResponse.json({ detail: "Unknown report type" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
