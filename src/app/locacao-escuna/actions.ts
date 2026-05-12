'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyTurnstile } from '@/lib/turnstile';
import { inquiryLimiter, getClientIp } from '@/lib/rate-limit';

export type CreateInquiryInput = {
  email: string;
  fullName: string;
  phone: string;
  requestedDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  passengerCount: number;
  interestedInOpenBar: boolean;
  message?: string;
  turnstileToken: string | null;
};

export type CreateInquiryResult =
  | { ok: true; whatsappUrl: string }
  | { ok: false; error: string };

const WHATSAPP_NUMBER = '5522998479728';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

function buildWhatsAppMessage(input: CreateInquiryInput): string {
  // requestedDate is a YYYY-MM-DD string. Parse safely as a local-day date.
  const [y, m, d] = input.requestedDate.split('-').map(Number);
  const dateStr = DATE_FORMATTER.format(new Date(y, (m ?? 1) - 1, d ?? 1));
  const lines = [
    'Olá! Tenho interesse na *locação privativa da escuna*.',
    '',
    `*Nome:* ${input.fullName}`,
    `*Data:* ${dateStr}`,
    `*Horário:* ${input.startTime} às ${input.endTime}`,
    `*Pessoas:* ${input.passengerCount}`,
    `*Open bar:* ${input.interestedInOpenBar ? 'Sim, tenho interesse' : 'Não'}`,
  ];
  if (input.message?.trim()) {
    lines.push('', `*Observações:* ${input.message.trim()}`);
  }
  return lines.join('\n');
}

export async function createInquiryAction(
  input: CreateInquiryInput
): Promise<CreateInquiryResult> {
  const headersList = await headers();
  const ip = getClientIp(headersList);

  const captcha = await verifyTurnstile(input.turnstileToken, ip);
  if (!captcha.ok) {
    return { ok: false, error: captcha.error };
  }
  const limit = await inquiryLimiter.limit(ip);
  if (!limit.success) {
    return {
      ok: false,
      error: 'Muitas solicitações. Tente novamente em alguns minutos.',
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('create_inquiry_request', {
    p_email: input.email.trim(),
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.trim(),
    p_requested_date: input.requestedDate,
    p_start_time: input.startTime,
    p_end_time: input.endTime,
    p_passenger_count: input.passengerCount,
    p_interested_in_open_bar: input.interestedInOpenBar,
    p_message: input.message?.trim() || undefined,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Marca whatsapp_contacted_at — cliente sai daqui pro WhatsApp agora.
  // Service-role bypassa RLS (inquiry_requests não permite UPDATE direto).
  const inquiryId = (data?.[0] as { inquiry_id?: string } | undefined)?.inquiry_id;
  if (inquiryId) {
    const admin = createAdminClient();
    await admin
      .from('inquiry_requests')
      .update({ whatsapp_contacted_at: new Date().toISOString() })
      .eq('id', inquiryId)
      .is('whatsapp_contacted_at', null);
  }

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppMessage(input)
  )}`;
  return { ok: true, whatsappUrl };
}
