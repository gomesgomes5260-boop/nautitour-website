import { describe, it, expect } from 'vitest';
import {
  gsmSafe,
  buildReminderSms,
  buildScheduleChangedSms,
  buildScheduleCancelledSms,
} from './sms-messages';

const SITE = 'https://nautitour-website.vercel.app';
const CODE = 'NTT-4F8K2A';
// sáb 18/jul 09:30 BRT
const DEPARTURE = '2026-07-18T12:30:00.000Z';

describe('gsmSafe', () => {
  it('remove acentos preservando o texto', () => {
    expect(gsmSafe('amanhã às 09:30 — atenção, segurança!')).toBe(
      'amanha as 09:30 atencao, seguranca!'
    );
  });

  it('remove emoji e caracteres não-ASCII', () => {
    expect(gsmSafe('passeio ⛵ confirmado 🎉')).toBe('passeio confirmado');
  });

  it('colapsa espaços', () => {
    expect(gsmSafe('a   b\n c')).toBe('a b c');
  });
});

describe('builders — sempre 1 SMS (≤160 chars, sem acento)', () => {
  const assertSingleSms = (msg: string) => {
    expect(msg.length).toBeLessThanOrEqual(160);
    // GSM-safe: nada fora do ASCII imprimível
    expect(msg).toMatch(/^[\x20-\x7E]+$/);
  };

  it('lembrete D-1 cabe em 1 SMS com URL real do ticket', () => {
    const msg = buildReminderSms({
      departureAt: DEPARTURE,
      bookingCode: CODE,
      ticketUrl: `${SITE}/ticket/${CODE}`,
    });
    assertSingleSms(msg);
    expect(msg).toContain('amanha');
    expect(msg).toContain('18/07');
    expect(msg).toContain('09:30');
    expect(msg).toContain(CODE);
    expect(msg).toContain(`${SITE}/ticket/${CODE}`);
  });

  it('mudança de horário cabe em 1 SMS com URL da reserva', () => {
    const msg = buildScheduleChangedSms({
      newDepartureAt: '2026-07-18T18:00:00.000Z', // 15:00 BRT
      bookingCode: CODE,
      bookingUrl: `${SITE}/reserva/${CODE}`,
    });
    assertSingleSms(msg);
    expect(msg).toContain('mudou para 18/07 as 15:00');
    expect(msg).toContain(CODE);
  });

  it('cancelamento de saída cabe em 1 SMS com URL de reagendamento', () => {
    const msg = buildScheduleCancelledSms({
      departureAt: DEPARTURE,
      bookingCode: CODE,
      rebookUrl: `${SITE}/passeio-escuna`,
    });
    assertSingleSms(msg);
    expect(msg).toContain('cancelada');
    expect(msg).toContain('de 18/07 09:30');
    expect(msg).toContain(CODE);
    expect(msg).toContain(`${SITE}/passeio-escuna`);
  });

  it('cancelamento sem data (departureAt null) também funciona', () => {
    const msg = buildScheduleCancelledSms({
      departureAt: null,
      bookingCode: CODE,
      rebookUrl: `${SITE}/passeio-escuna`,
    });
    assertSingleSms(msg);
    expect(msg).not.toContain('de undefined');
  });
});
