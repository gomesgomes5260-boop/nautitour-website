import 'server-only';
import { Resend } from 'resend';

export type SendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string };

let cached: Resend | null = null;
function client(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export type SendPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(payload: SendPayload): Promise<SendResult> {
  const c = client();
  if (!c) {
    console.warn('[email] RESEND_API_KEY ausente — skip envio');
    return { ok: false, skipped: true, reason: 'RESEND_API_KEY ausente' };
  }
  const from = process.env.RESEND_SENDER || 'Nautitour <onboarding@resend.dev>';
  try {
    const { data, error } = await c.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    if (error) {
      console.error('[email] resend error', error);
      return { ok: false, error: error.message ?? String(error) };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('[email] throw', err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
