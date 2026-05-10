'use server';

import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();

  const { error } = await supabase.rpc('create_inquiry_request', {
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

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppMessage(input)
  )}`;
  return { ok: true, whatsappUrl };
}
