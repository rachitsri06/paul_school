export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ student_id: string }> }) {
  try {
    const { student_id } = await params;
    const { data: student, error } = await supabase.from('students').select('*').eq('id', student_id).single();
    if (error || !student) {
      return NextResponse.json({ detail: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(student);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ student_id: string }> }) {
  try {
    await requireAdmin(request);
    const { student_id } = await params;
    const body = await request.json();
    delete body.id;

    const { data: student, error } = await supabase.from('students').update(body).eq('id', student_id).select().single();
    if (error) throw error;

    return NextResponse.json(student);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ student_id: string }> }) {
  try {
    await requireAdmin(request);
    const { student_id } = await params;

    const { error } = await supabase.from('students').delete().eq('id', student_id);
    if (error) throw error;

    return NextResponse.json({ message: "Student deleted" });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
