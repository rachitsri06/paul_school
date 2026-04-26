export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    // Make sure to order by created at. If the table 'notification_logs' is missing, fallback to []
    const { data, error } = await supabase.from('notification_logs').select('*').order('sent_at', { ascending: false }).limit(limit);
    if (error) {
      if (error.message.includes('relation "notification_logs" does not exist')) return NextResponse.json([]);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
