export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from('fee_payments').insert({
      student_id: body.student_id,
      amount: body.amount,
      payment_method: body.payment_method || 'cash',
      receipt_number: body.receipt_number || `REC-${Date.now()}`,
      status: 'completed',
    }).select().single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
