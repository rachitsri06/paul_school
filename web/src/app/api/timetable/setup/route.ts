export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Create timetable table if it doesn't exist
    const { error } = await supabase.rpc('create_timetable_if_not_exists').maybeSingle().catch(() => ({ error: null }));

    // Try inserting a dummy row to check if table exists, then delete it
    const { error: insertErr } = await supabase.from('timetable').select('id').limit(1);

    if (insertErr && insertErr.code === 'PGRST205') {
      return NextResponse.json({
        detail: 'Table does not exist. Please run this SQL in your Supabase SQL Editor:\n\n' +
          'create table if not exists timetable (\n' +
          '  id uuid primary key default gen_random_uuid(),\n' +
          '  class_name text,\n' +
          '  day text,\n' +
          '  period text,\n' +
          '  subject text,\n' +
          '  teacher text,\n' +
          '  color text,\n' +
          '  created_at timestamptz default now()\n' +
          ');'
      }, { status: 503 });
    }

    return NextResponse.json({ message: 'timetable table is ready ✅' });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
