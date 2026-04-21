export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slot_id: string }> }
) {
  try {
    const { slot_id } = await params;
    const body = await request.json();
    delete body.id;

    const { data, error } = await supabase
      .from('timetable')
      .update(body)
      .eq('id', slot_id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slot_id: string }> }
) {
  try {
    const { slot_id } = await params;

    const { error } = await supabase.from('timetable').delete().eq('id', slot_id);
    if (error) throw error;

    return NextResponse.json({ message: 'Slot deleted' });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
