export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json({ detail: "Name, email, and phone are required." }, { status: 400 });
    }

    // Insert into staff table securely
    const { data: staffData, error: staffError } = await supabase.from('staff').insert({
      employee_id: `T-${Math.floor(1000 + Math.random() * 9000)}`,
      name: body.name,
      department: body.department || 'Teaching',
      designation: body.designation || 'Teacher',
      email: body.email.toLowerCase().trim(),
      phone: body.phone,
      join_date: new Date().toISOString().split('T')[0],
      status: 'Active'
    }).select().single();

    if (staffError) throw staffError;

    // Automated login creation with generated password
    const password = body.password || 'Teacher@123';
    const passwordHash = await hashPassword(password);
    
    await supabase.from('users').insert({
      email: staffData.email,
      password_hash: passwordHash,
      name: staffData.name,
      role: 'teacher'
    });

    return NextResponse.json({ ...staffData, default_password: password });
  } catch (error: any) {
    console.error("Teacher Registration Error:", error.message);
    // Suppress Postgres duplicate key errors nicely
    if (error.message.includes('duplicate key')) {
        return NextResponse.json({ detail: "An account with this email already exists." }, { status: 400 });
    }
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
