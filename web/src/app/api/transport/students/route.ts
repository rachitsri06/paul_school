import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Only return students who actually take the bus/transport
    const { data: students, error } = await supabase
      .from('students')
      .select('id, roll_no, name, class_name, section, transport_route')
      .not('transport_route', 'is', null)
      .neq('transport_route', '');

    if (error) throw error;
    
    return NextResponse.json(students || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
