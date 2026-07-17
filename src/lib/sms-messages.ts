/**
 * Builders das mensagens de SMS transacional (Comtele).
 *
 * Regras de ouro do SMS BR:
 *  - Sem acentos: caracteres fora do GSM-7 (ã, ç, á...) rebaixam o limite
 *    de 160 pra 70 chars e a mensagem passa a custar 2-3 SMS.
 *  - ≤160 caracteres SEMPRE (1 SMS): os builders montam textos enxutos e
 *    os testes garantem o teto mesmo com URLs de produção.
 * Arquivo puro (sem server-only) pra ser testável no vitest.
 */

const SMS_MAX = 160;

/** Remove acentos/diacríticos → texto GSM-7-safe minúsculo custo 1 SMS. */
export function gsmSafe(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatShortDeparture(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
    }),
    time: d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function clamp(msg: string): string {
  if (msg.length <= SMS_MAX) return msg;
  return `${msg.slice(0, SMS_MAX - 3)}...`;
}

/** Lembrete D-1: "seu passeio e amanha" + ticket. */
export function buildReminderSms(p: {
  departureAt: string;
  bookingCode: string;
  ticketUrl: string;
}): string {
  const { date, time } = formatShortDeparture(p.departureAt);
  return clamp(
    gsmSafe(
      `Nautitour: seu passeio e amanha, ${date} as ${time}. Cod ${p.bookingCode}. Chegue 30min antes. Ticket: ${p.ticketUrl}`
    )
  );
}

/** Atualização: admin mudou data/hora da saída. */
export function buildScheduleChangedSms(p: {
  newDepartureAt: string;
  bookingCode: string;
  bookingUrl: string;
}): string {
  const { date, time } = formatShortDeparture(p.newDepartureAt);
  return clamp(
    gsmSafe(
      `Nautitour: o horario do seu passeio mudou para ${date} as ${time}. Reserva ${p.bookingCode}. Detalhes: ${p.bookingUrl}`
    )
  );
}

/** Atualização: saída cancelada pela operação (clima/Marinha). */
export function buildScheduleCancelledSms(p: {
  departureAt: string | null;
  bookingCode: string;
  rebookUrl: string;
}): string {
  const when = p.departureAt
    ? (() => {
        const { date, time } = formatShortDeparture(p.departureAt as string);
        return ` de ${date} ${time}`;
      })()
    : '';
  return clamp(
    gsmSafe(
      `Nautitour: saida${when} cancelada por seguranca (clima/Marinha). Cod ${p.bookingCode}. Reagende sem custo: ${p.rebookUrl}`
    )
  );
}
