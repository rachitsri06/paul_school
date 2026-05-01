export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Self-registration is disabled. Teachers are added by admin only.
export async function POST() {
  return NextResponse.json({ detail: "Self-registration is disabled. Contact your administrator." }, { status: 403 });
}
