export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Legacy mapping uses sent_at or created_at. We gracefully sort without crashing.
    const { data, error } = await supabase.from('communications').select('*').order('id', { ascending: false }).limit(100);
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, recipient, message } = body; // Dropped sender & title to avoid fatal missing column errors

    if (!type || !recipient || !message) {
      return NextResponse.json({ detail: "Missing type, recipient, or message" }, { status: 400 });
    }

    let status = 'sent';

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
        const waRecipient = recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${recipient}`;
        await client.messages.create({
          body: message,
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || '+14155238886'}`,
          to: waRecipient
        });
      }
    } catch (twilioErr: any) {
      status = 'failed';
    }

    // Insert payload strictly matching legacy MongoDB mapped schema
    const { data: record, error } = await supabase.from('communications').insert({
      type,
      message,
      recipient: recipient, 
      status
    }).select().single();

    if (error) throw error;

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("Comm API Error:", error.message);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
