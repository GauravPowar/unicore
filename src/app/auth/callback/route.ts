import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error('Error exchanging code for session:', error.message);
    } catch (err) {
      console.error('Unexpected auth callback error:', err);
    }
  }

  // If code exchange fails or no code is present, redirect to feed or login with notice
  return NextResponse.redirect(`${origin}${next}`);
}

