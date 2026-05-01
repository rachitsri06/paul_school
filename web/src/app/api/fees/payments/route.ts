export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id') || '';
    const session = searchParams.get('session') || '';

    let query = supabase.from('fee_payments').select('*');
    if (student_id) query = query.eq('student_id', student_id);
    if (session) query = query.eq('session', session);

    const { data, error } = await query.order('payment_date', { ascending: false });
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
