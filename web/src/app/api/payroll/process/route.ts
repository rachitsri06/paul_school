export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const month = body.month || new Date().toISOString().slice(0, 7);

    // Get all staff
    const { data: staffList, error: staffError } = await supabase.from('staff').select('*');
    if (staffError) throw staffError;

    const results = (staffList || []).map((s: any) => ({
      staff_id: s.id,
      name: s.name,
      role: s.role,
      department: s.department,
      salary: s.salary || 0,
      month,
      status: 'processed',
      processed_at: new Date().toISOString()
    }));

    return NextResponse.json({ message: "Payroll processed", month, records: results });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
