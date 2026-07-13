import { describe, it, expect } from 'vitest';
import { buildWaUrl, normalizeBrPhoneE164, WHATSAPP_NUMBER } from './whatsapp';

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

describe('normalizeBrPhoneE164', () => {
  it('converte máscara BR de celular pra E.164 sem +', () => {
    expect(normalizeBrPhoneE164('(22) 99847-9728')).toBe('5522998479728');
  });

  it('aceita espaços e traços soltos', () => {
    expect(normalizeBrPhoneE164('22 99847 9728')).toBe('5522998479728');
  });

  it('mantém número já em E.164 (com ou sem +)', () => {
    expect(normalizeBrPhoneE164('5522998479728')).toBe('5522998479728');
    expect(normalizeBrPhoneE164('+55 22 99847-9728')).toBe('5522998479728');
  });

  it('aceita fixo (10 dígitos, sem o 9)', () => {
    expect(normalizeBrPhoneE164('(22) 2623-1234')).toBe('552226231234');
  });

  it('remove prefixo internacional 00', () => {
    expect(normalizeBrPhoneE164('0055 22 99847-9728')).toBe('5522998479728');
  });

  it('rejeita lixo, vazio e tamanhos inválidos', () => {
    expect(normalizeBrPhoneE164(null)).toBeNull();
    expect(normalizeBrPhoneE164(undefined)).toBeNull();
    expect(normalizeBrPhoneE164('')).toBeNull();
    expect(normalizeBrPhoneE164('sem telefone')).toBeNull();
    expect(normalizeBrPhoneE164('99847')).toBeNull();
    expect(normalizeBrPhoneE164('5522998479728000')).toBeNull();
  });

  it('rejeita DDD inválido (começando com 0)', () => {
    expect(normalizeBrPhoneE164('(02) 99847-9728')).toBeNull();
  });
});
