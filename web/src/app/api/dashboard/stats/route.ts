export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const { count: totalStudents } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: totalStaff } = await supabase.from('staff').select('*', { count: 'exact', head: true });

    const today = new Date().toISOString().split('T')[0];
    const { count: presentToday } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present');

    const { count: totalBooks } = await supabase.from('library_books').select('*', { count: 'exact', head: true });
    const { count: pendingFees } = await supabase.from('fee_payments').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    const { data: recentAttendance } = await supabase.from('attendance').select('*').order('created_at', { ascending: false }).limit(5);

    return NextResponse.json({
      total_students: totalStudents || 0,
      total_staff: totalStaff || 0,
      present_today: presentToday || 0,
      total_books: totalBooks || 0,
      pending_fees: pendingFees || 0,
      attendance_rate: totalStudents ? Math.round(((presentToday || 0) / totalStudents) * 100) : 0,
      recent_attendance: recentAttendance || []
    });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
