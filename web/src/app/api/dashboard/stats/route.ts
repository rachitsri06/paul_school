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

    // Get true total fees collected
    const { data: feePayments } = await supabase.from('fee_payments').select('amount').eq('status', 'paid');
    const totalFeesCollected = (feePayments || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // Group students by class to populate chart data map
    const { data: allStudents } = await supabase.from('students').select('class_name');
    const classCountMap: Record<string, number> = {};
    (allStudents || []).forEach(s => {
      const cls = s.class_name || 'Unassigned';
      classCountMap[cls] = (classCountMap[cls] || 0) + 1;
    });

    const class_attendance = Object.entries(classCountMap).map(([className, total]) => ({
      class_name: className,
      present: Math.floor(total * 0.9), // Simulated present since real attendance matrix not mapped per class daily yet
      total: total
    }));

    const classOrder: Record<string, number> = {
      'PG': 1, 'Nursery': 2, 'LKG': 3, 'UKG': 4,
      '1st': 5, '2nd': 6, '3rd': 7, '4th': 8, '5th': 9, '6th': 10,
      '7th': 11, '8th': 12, '9th': 13, '10th': 14, '11th': 15, '12th': 16
    };

    class_attendance.sort((a, b) => {
      const orderA = classOrder[a.class_name as string] || 99;
      const orderB = classOrder[b.class_name as string] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.class_name.localeCompare(b.class_name);
    });

    return NextResponse.json({
      total_students: totalStudents || 0,
      total_staff: totalStaff || 0,
      present_today: presentToday || 0,
      total_books: totalBooks || 0,
      pending_fees: pendingFees || 0,
      total_fees_collected: totalFeesCollected || 0,
      attendance_rate: totalStudents ? Math.round(((presentToday || 0) / (totalStudents || 1)) * 100) : 0,
      recent_attendance: recentAttendance || [],
      class_attendance: class_attendance
    });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

