export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireStaff } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ hw_id: string }> }) {
  try {
    await requireStaff(request);
    const { hw_id } = await params;
    const body = await request.json();
    delete body.id;

    const { data, error } = await supabase.from('homework').update(body).eq('id', hw_id).select().single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ hw_id: string }> }) {
  try {
    await requireStaff(request);
    const { hw_id } = await params;

    const { error } = await supabase.from('homework').delete().eq('id', hw_id);
    if (error) throw error;

    return NextResponse.json({ message: "Homework deleted" });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
