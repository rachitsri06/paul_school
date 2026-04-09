export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase.from('communications').select('*').order('sent_at', { ascending: false }).limit(100);
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, recipient, message } = body;

    if (!type || !recipient || !message) {
      return NextResponse.json({ detail: "Missing type, recipient, or message" }, { status: 400 });
    }

    let status = 'sent';

    // Attempt to send via Twilio if configured
    try {
      if (type === 'sms' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'test') {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: recipient
        });
      } else if (type === 'whatsapp' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== 'test') {
        const twilio = require('twilio');
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: message,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
          to: `whatsapp:${recipient}`
        });
      }
    } catch (twilioErr: any) {
      status = 'failed';
    }

    const { data: record, error } = await supabase.from('communications').insert({
      type,
      recipient,
      message,
      status
    }).select().single();

    if (error) throw error;

    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
