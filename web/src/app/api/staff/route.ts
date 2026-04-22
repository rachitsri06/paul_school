export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin, hashPassword } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || '';

    let query = supabase.from('staff').select('*');
    if (department) query = query.eq('department', department);

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const { data: staffData, error: staffError } = await supabase.from('staff').insert(body).select();
    if (staffError) throw staffError;

    const staffRecord = Array.isArray(staffData) ? staffData[0] : staffData;

    // Automated login creation
    if (staffRecord.email) {
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', staffRecord.email.toLowerCase().trim()).single();
      
      if (!existingUser) {
        const passwordHash = await hashPassword('Teacher@123');
        await supabase.from('users').insert({
          email: staffRecord.email.toLowerCase().trim(),
          password_hash: passwordHash,
          name: staffRecord.name,
          role: 'teacher'
        });
      }
    }

    return NextResponse.json(staffRecord);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
