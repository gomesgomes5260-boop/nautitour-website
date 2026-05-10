/**
 * Returns a redirect target safe for `redirect()` / `NextResponse.redirect()`.
 * Only allows internal absolute paths starting with a single "/", rejecting
 * protocol-relative ("//evil.com"), absolute URLs ("https://evil.com"), and
 * empty values. Falls back to "/" when the input is unsafe.
 */
export function safeRedirectPath(target: string | null | undefined): string {
  if (!target) return '/';
  if (typeof target !== 'string') return '/';
  // Must start with "/" and not "//" (protocol-relative)
  if (!target.startsWith('/') || target.startsWith('//')) return '/';
  // Reject backslashes, control chars, schemes
  if (/[\s\\]/.test(target)) return '/';
  if (/^[a-z]+:/i.test(target)) return '/';
  return target;
}
