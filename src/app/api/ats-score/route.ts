import { NextResponse } from 'next/server';
// ATS scoring API disabled temporarily

export const runtime = 'nodejs';

// ATS scoring API disabled; implementation removed temporarily

export async function POST(req: Request) {
  // ATS scoring disabled temporarily
  return NextResponse.json({ error: 'ATS scoring temporarily disabled' }, { status: 503 });
}