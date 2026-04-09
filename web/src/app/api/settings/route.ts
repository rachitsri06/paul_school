export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { data: row } = await supabase.from('settings').select('value').eq('key', 'school').single();

    if (!row) {
      const defaults = {
        school_name: "St. Paul's School",
        address: "Maharajganj, Uttar Pradesh",
        phone: "+91 9876543210",
        email: "info@stpauls.edu",
        principal: "Fr. Thomas Joseph",
        academic_year: "2025-2026",
        classes: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        sections: ["A", "B"],
        motto: "Study - Play - Serve",
        notification_email: true,
        notification_sms: true,
        notification_whatsapp: false,
      };
      await supabase.from('settings').insert({ key: 'school', value: defaults });
      return NextResponse.json(defaults);
    }

    return NextResponse.json(row.value);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const { data: existing } = await supabase.from('settings').select('value').eq('key', 'school').single();
    const merged = { ...(existing?.value || {}), ...body };

    await supabase.from('settings').upsert({ key: 'school', value: merged, updated_at: new Date().toISOString() });

    return NextResponse.json(merged);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
