import { describe, expect, it } from 'vitest';
import {
  buzziosTripDate,
  buzziosTripTime,
  normalizePhoneE164,
} from './nautitour-utils';

describe('normalizePhoneE164', () => {
  it('strips formatting from BR celular without country code', () => {
    expect(normalizePhoneE164('(22) 99847-9728')).toBe('+5522998479728');
  });

  it('handles BR celular já com 55', () => {
    expect(normalizePhoneE164('5522998479728')).toBe('+5522998479728');
  });

  it('preserves explicit + prefix', () => {
    expect(normalizePhoneE164('+5522998479728')).toBe('+5522998479728');
  });

  it('handles BR fixo (10 dígitos)', () => {
    expect(normalizePhoneE164('22 2623-0000')).toBe('+552226230000');
  });

  it('returns empty for null/undefined/empty', () => {
    expect(normalizePhoneE164(null)).toBe('');
    expect(normalizePhoneE164(undefined)).toBe('');
    expect(normalizePhoneE164('')).toBe('');
  });

  it('adds + to unknown-length foreign numbers', () => {
    expect(normalizePhoneE164('14155552671')).toBe('+5514155552671');
  });
});

describe('buzziosTripDate / buzziosTripTime', () => {
  // Búzios = America/Sao_Paulo = UTC-3 sem DST. Cobrir cruzamento de meia-noite.

  it('converte UTC 12:30 pra 09:30 BRT no mesmo dia', () => {
    const iso = '2026-06-15T12:30:00Z';
    expect(buzziosTripDate(iso)).toBe('2026-06-15');
    expect(buzziosTripTime(iso)).toBe('09:30');
  });

  it('converte UTC 15:00 pra 12:00 BRT', () => {
    const iso = '2026-06-15T15:00:00Z';
    expect(buzziosTripDate(iso)).toBe('2026-06-15');
    expect(buzziosTripTime(iso)).toBe('12:00');
  });

  it('cruzamento meia-noite: UTC 02:00 vira 23:00 do dia anterior', () => {
    const iso = '2026-06-16T02:00:00Z';
    expect(buzziosTripDate(iso)).toBe('2026-06-15');
    expect(buzziosTripTime(iso)).toBe('23:00');
  });
});
