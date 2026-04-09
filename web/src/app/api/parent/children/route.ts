export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'parent') {
      return NextResponse.json({ detail: "Parent access required" }, { status: 403 });
    }

    const childrenIds = user.children_ids || [];
    if (childrenIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: children, error } = await supabase.from('students').select('*').in('id', childrenIds);
    if (error) throw error;

    return NextResponse.json(children || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
