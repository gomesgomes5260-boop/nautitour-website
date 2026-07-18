import { describe, it, expect } from 'vitest';
import { buildWaUrl, WHATSAPP_NUMBER } from './whatsapp';

describe('buildWaUrl', () => {
  it('returns base wa.me URL with WHATSAPP_NUMBER when no text', () => {
    expect(buildWaUrl()).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
  });

  it('treats empty string as no text (returns base URL)', () => {
    expect(buildWaUrl('')).toBe(`https://wa.me/${WHATSAPP_NUMBER}`);
  });

  it('appends ?text= with URL-encoded payload', () => {
    expect(buildWaUrl('Olá!')).toBe(
      `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1!`
    );
  });

  it('encodes whitespace and special characters', () => {
    const result = buildWaUrl('reserva NTT-AB12 ok?');
    expect(result).toBe(
      `https://wa.me/${WHATSAPP_NUMBER}?text=reserva%20NTT-AB12%20ok%3F`
    );
  });

  it('uses canonical number (no env override)', () => {
    expect(WHATSAPP_NUMBER).toMatch(/^\d{10,13}$/);
  });
});
