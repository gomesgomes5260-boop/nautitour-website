import { describe, expect, it } from 'vitest';
import { buildWaUrl, pickWhatsAppNumber, WHATSAPP_NUMBERS } from './whatsapp';

describe('WHATSAPP_NUMBERS', () => {
  it('tem os 4 números da equipe, só dígitos com DDI', () => {
    expect(WHATSAPP_NUMBERS).toHaveLength(4);
    for (const n of WHATSAPP_NUMBERS) {
      expect(n).toMatch(/^55\d{10,11}$/);
    }
  });
});

describe('pickWhatsAppNumber', () => {
  it('sempre devolve um número da lista', () => {
    for (let i = 0; i < 50; i++) {
      expect(WHATSAPP_NUMBERS).toContain(pickWhatsAppNumber());
    }
  });

  it('o rodízio alcança todos os números', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500 && seen.size < WHATSAPP_NUMBERS.length; i++) {
      seen.add(pickWhatsAppNumber());
    }
    expect(seen.size).toBe(WHATSAPP_NUMBERS.length);
  });
});

describe('buildWaUrl', () => {
  it('sem texto: base wa.me com um número da lista', () => {
    const url = buildWaUrl();
    const match = url.match(/^https:\/\/wa\.me\/(\d+)$/);
    expect(match).not.toBeNull();
    expect(WHATSAPP_NUMBERS).toContain(match![1]);
  });

  it('string vazia vale como sem texto (base URL)', () => {
    expect(buildWaUrl('', '5522999963664')).toBe('https://wa.me/5522999963664');
  });

  it('com número explícito é determinístico', () => {
    expect(buildWaUrl(undefined, '5522999963664')).toBe(
      'https://wa.me/5522999963664'
    );
  });

  it('encoda o texto da mensagem', () => {
    expect(buildWaUrl('Olá!', '5522999963664')).toBe(
      'https://wa.me/5522999963664?text=Ol%C3%A1!'
    );
  });

  it('encoda espaços e caracteres especiais', () => {
    expect(buildWaUrl('reserva NTT-AB12 ok?', '5522999963664')).toBe(
      'https://wa.me/5522999963664?text=reserva%20NTT-AB12%20ok%3F'
    );
  });
});

describe('formatWaNumber', () => {
  it('formata número BR com DDI', async () => {
    const { formatWaNumber } = await import('./whatsapp');
    expect(formatWaNumber('5522999963664')).toBe('(22) 99996-3664');
  });

  it('vazio/null vira travessão', async () => {
    const { formatWaNumber } = await import('./whatsapp');
    expect(formatWaNumber(null)).toBe('—');
    expect(formatWaNumber('')).toBe('—');
  });
});
