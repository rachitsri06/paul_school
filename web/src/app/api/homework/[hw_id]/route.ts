export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ hw_id: string }> }) {
  try {
    const { hw_id } = await params;
    const body = await request.json();
    delete body.id;

    const { data, error } = await supabase.from('homework').update(body).eq('id', hw_id).select().single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ hw_id: string }> }) {
  try {
    const { hw_id } = await params;

    const { error } = await supabase.from('homework').delete().eq('id', hw_id);
    if (error) throw error;

    return NextResponse.json({ message: "Homework deleted" });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
