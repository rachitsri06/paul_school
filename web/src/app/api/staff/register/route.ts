export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json({ detail: "Name, email, and phone are required." }, { status: 400 });
    }

    // Check if email already registered
    const { data: existingStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('email', body.email.toLowerCase().trim())
      .single();

    if (existingStaff) {
      return NextResponse.json({ detail: "An account with this email already exists." }, { status: 400 });
    }

    // Insert into staff table
    const { data: staffData, error: staffError } = await supabaseAdmin.from('staff').insert({
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

    // Create login account
    const password = body.password || 'Teacher@123';
    const passwordHash = await bcrypt.hash(password, 10);

    const { error: userError } = await supabaseAdmin.from('users').insert({
      email: staffData.email,
      password_hash: passwordHash,
      name: staffData.name,
      role: 'teacher'
    });

    if (userError && !userError.message.includes('duplicate')) {
      console.error('User creation error:', userError.message);
    }

    return NextResponse.json({ ...staffData, default_password: password });
  } catch (error: any) {
    console.error("Teacher Registration Error:", error.message);
    if (error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
      return NextResponse.json({ detail: "An account with this email already exists." }, { status: 400 });
    }
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
