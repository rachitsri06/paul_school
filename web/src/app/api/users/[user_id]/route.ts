export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin, hashPassword } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    await requireAdmin(request);
    const { user_id } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.role) updateData.role = body.role;
    
    // Check if it's a password reset request
    if (body.resetPassword) {
      const defaultPassword = body.role === 'teacher' ? 'Teacher@123' : 'Parent@123';
      updateData.password_hash = await hashPassword(defaultPassword);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user_id)
      .select('id, email, name, role')
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    await requireAdmin(request);
    const { user_id } = await params;

    // Prevent deleting the last admin or the master ID if it were in the DB
    const { data: user } = await supabase.from('users').select('role').eq('id', user_id).single();
    if (user?.role === 'admin') {
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin');
        if (count && count <= 1) {
            throw new Error("Cannot delete the only remaining administrator.");
        }
    }

    const { error } = await supabase.from('users').delete().eq('id', user_id);
    if (error) throw error;

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
