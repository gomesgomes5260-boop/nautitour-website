import { describe, expect, it } from 'vitest';
import { isValidCpf, normalizeCpf } from './cpf';

describe('normalizeCpf', () => {
  it('remove máscara e não-dígitos', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
    expect(normalizeCpf(' 529 982 247 25 ')).toBe('52998224725');
  });

  it('null/undefined viram string vazia', () => {
    expect(normalizeCpf(null)).toBe('');
    expect(normalizeCpf(undefined)).toBe('');
  });
});

describe('isValidCpf', () => {
  it('aceita CPF válido com e sem máscara', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('52998224725')).toBe(true);
  });

  it('rejeita dígito verificador errado', () => {
    expect(isValidCpf('529.982.247-24')).toBe(false);
    expect(isValidCpf('52998224726')).toBe(false);
  });

  it('rejeita sequências repetidas', () => {
    expect(isValidCpf('000.000.000-00')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
  });

  it('rejeita comprimento errado e vazio', () => {
    expect(isValidCpf('1234567890')).toBe(false);
    expect(isValidCpf('123456789012')).toBe(false);
    expect(isValidCpf('')).toBe(false);
    expect(isValidCpf(null)).toBe(false);
    expect(isValidCpf(undefined)).toBe(false);
  });
});
