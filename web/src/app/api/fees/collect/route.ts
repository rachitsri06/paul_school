export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from('fee_payments').insert({
      student_id: body.student_id,
      student_name: body.student_name,
      class_name: body.class_name,
      amount: body.amount,
      payment_mode: body.payment_mode || 'Cash',
      fee_type: body.fee_type || 'Monthly',
      month: body.month,
      session: body.session || '2026-2027',
      payment_method: body.payment_method || body.payment_mode || 'cash',
      receipt_number: body.receipt_number || `REC-${Date.now()}`,
      status: 'completed',
    }).select().single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
