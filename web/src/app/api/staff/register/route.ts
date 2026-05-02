export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, ...staffData } = body;
    
    // Insert staff record
    const { data, error } = await supabase.from('staff').insert(staffData).select();
    if (error) throw error;
    
    const staffRecord = Array.isArray(data) ? data[0] : data;

    // Create user login
    if (staffRecord.email) {
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', staffRecord.email.toLowerCase().trim()).single();
      
      if (!existingUser) {
        const passwordHash = await hashPassword(password || 'Teacher@123');
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
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
