import { NextResponse } from 'next/server';
import { getGoogleCalendarEvents } from '@/lib/google-calendar';

export const revalidate = 300; // ISR: regenerate every 5 minutes

export async function GET() {
  const events = await getGoogleCalendarEvents();
  return NextResponse.json(events, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
  });
}
