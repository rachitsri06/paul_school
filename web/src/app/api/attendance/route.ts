export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const class_name = searchParams.get('class_name') || '';
    const date = searchParams.get('date') || '';

    let query = supabase.from('attendance').select('*');
    if (class_name) query = query.eq('class_name', class_name);
    if (date) query = query.eq('date', date);

    const { data: records, error } = await query.order('created_at', { ascending: false }).limit(500);
    if (error) throw error;

    return NextResponse.json(records || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
