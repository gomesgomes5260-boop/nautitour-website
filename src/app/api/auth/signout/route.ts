import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  // CSRF protection: validate the request originated from our own site by
  // comparing Origin (or Referer as fallback) against the request's own host.
  // A cross-site form POST won't include a matching Origin.
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const refererOrigin = referer
    ? (() => {
        try {
          return new URL(referer).origin;
        } catch {
          return null;
        }
      })()
    : null;

  const sameOrigin =
    origin === expectedOrigin || refererOrigin === expectedOrigin;

  if (!sameOrigin) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${expectedOrigin}/`, { status: 303 });
}
