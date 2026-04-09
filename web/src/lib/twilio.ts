import twilio from 'twilio';

export function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token) {
    return twilio(sid, token);
  }
  return null;
}

export const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '';
export const TWILIO_WA = process.env.TWILIO_WHATSAPP_NUMBER || '';

export async function sendSms(toNumber: string, message: string) {
  try {
    const client = getTwilioClient();
    if (!client || !TWILIO_PHONE) {
      return { success: false, error: 'Twilio not configured', sid: null };
    }
    let toFormatted = toNumber;
    if (!toFormatted.startsWith('+')) {
      toFormatted = '+91' + toFormatted.replace(/^0+/, '');
    }
    const msg = await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: toFormatted
    });
    console.log(`SMS sent to ${toFormatted}: SID=${msg.sid}`);
    return { success: true, sid: msg.sid, status: msg.status };
  } catch (error: any) {
    console.error(`SMS error to ${toNumber}: ${error.message}`);
    return { success: false, error: error.message, sid: null };
  }
}

export async function sendWhatsapp(toNumber: string, message: string) {
  try {
    const client = getTwilioClient();
    if (!client || !TWILIO_WA) {
      return { success: false, error: 'Twilio WhatsApp not configured', sid: null };
    }
    let toFormatted = toNumber;
    if (!toFormatted.startsWith('+')) {
      toFormatted = '+91' + toFormatted.replace(/^0+/, '');
    }
    const msg = await client.messages.create({
      body: message,
      from: `whatsapp:${TWILIO_WA}`,
      to: `whatsapp:${toFormatted}`
    });
    console.log(`WhatsApp sent to ${toFormatted}: SID=${msg.sid}`);
    return { success: true, sid: msg.sid, status: msg.status };
  } catch (error: any) {
    console.error(`WhatsApp error to ${toNumber}: ${error.message}`);
    return { success: false, error: error.message, sid: null };
  }
}
