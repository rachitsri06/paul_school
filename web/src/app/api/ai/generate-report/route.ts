export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, student_id } = body;

    let context = '';
    if (student_id) {
      const { data: student } = await supabase.from('students').select('*').eq('id', student_id).single();
      const { data: grades } = await supabase.from('grades').select('*').eq('student_id', student_id);
      const { data: attendance } = await supabase.from('attendance').select('*').eq('student_id', student_id);
      context = `Student: ${JSON.stringify(student)}\nGrades: ${JSON.stringify(grades)}\nAttendance: ${JSON.stringify(attendance)}`;
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        report: "AI report generation requires an OpenAI API key. Please set OPENAI_API_KEY in environment variables."
      });
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a school report generator. Generate detailed, professional academic reports.' },
        { role: 'user', content: `${prompt || 'Generate a student report'}\n\nContext:\n${context}` }
      ]
    });

    return NextResponse.json({ report: completion.choices[0]?.message?.content || 'No report generated' });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
