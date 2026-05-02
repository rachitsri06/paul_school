export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAdmin, hashPassword, getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const class_name = searchParams.get('class_name') || '';
    const session = searchParams.get('session') || '';

    let query = supabase.from('students').select('*');

    if (search) {
      query = query.or(`name.ilike.%${search}%,roll_no.ilike.%${search}%`);
    }
    if (class_name) query = query.eq('class_name', class_name);
    if (session) query = query.eq('session', session);

    const { data: students, error } = await query.limit(1000);
    if (error) throw error;

    return NextResponse.json(students || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

async function createParentLogin(studentRecord: any) {
  if (!studentRecord?.phone) return;
  try {
    const parentEmail = `${studentRecord.phone}@paul.edu`;
    const { data: existingParent } = await supabase.from('users').select('*').eq('email', parentEmail).single();

    const newChildrenIds = existingParent
      ? [...(existingParent.children_ids || []), studentRecord.id]
      : [studentRecord.id];

    if (existingParent) {
      await supabase.from('users').update({ children_ids: newChildrenIds }).eq('id', existingParent.id);
    } else {
      const passwordHash = await hashPassword('Parent@123');
      await supabase.from('users').insert({
        email: parentEmail,
        password_hash: passwordHash,
        name: studentRecord.father_name || `Parent of ${studentRecord.name}`,
        role: 'parent',
        children_ids: newChildrenIds
      });
    }
  } catch (_) {
    // Non-fatal: don't fail student insert if parent creation errors
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      throw new Error('Teacher or Admin access required');
    }
    const body = await request.json();
    const isBulk = Array.isArray(body);

    // Normalise: always work with an array
    const records = isBulk ? body : [body];

    const { data: insertedData, error: insertError } = await supabase
      .from('students')
      .insert(records)
      .select();

    if (insertError) throw insertError;

    // Create parent logins for all inserted students
    await Promise.all((insertedData || []).map(createParentLogin));

    if (isBulk) {
      return NextResponse.json({
        message: `${insertedData?.length ?? 0} students imported successfully`,
        count: insertedData?.length ?? 0,
      });
    }

    const studentRecord = Array.isArray(insertedData) ? insertedData[0] : insertedData;
    return NextResponse.json(studentRecord);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: error.message.includes('Admin') ? 403 : 500 });
  }
}
