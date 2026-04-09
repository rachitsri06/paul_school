export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ child_id: string }> }) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'parent') {
      return NextResponse.json({ detail: "Parent access required" }, { status: 403 });
    }

    const { child_id } = await params;
    const childrenIds = user.children_ids || [];
    if (!childrenIds.includes(child_id)) {
      return NextResponse.json({ detail: "Not your child" }, { status: 403 });
    }

    const { data: child, error } = await supabase.from('students').select('*').eq('id', child_id).single();
    if (error || !child) {
      return NextResponse.json({ detail: "Child not found" }, { status: 404 });
    }

    return NextResponse.json(child);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
