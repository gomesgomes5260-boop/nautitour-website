import { describe, it, expect } from 'vitest';
import { normalizePhoneE164, buildUserData } from './analytics';

describe('normalizePhoneE164', () => {
  it('prefixa +55 em celular BR de 11 dígitos', () => {
    expect(normalizePhoneE164('22999963664')).toBe('+5522999963664');
  });

  it('prefixa +55 em fixo BR de 10 dígitos', () => {
    expect(normalizePhoneE164('2226231234')).toBe('+552226231234');
  });

  it('mantém número que já vem com DDI 55', () => {
    expect(normalizePhoneE164('5522999963664')).toBe('+5522999963664');
  });

  it('descarta máscara e formata', () => {
    expect(normalizePhoneE164('(22) 99996-3664')).toBe('+5522999963664');
  });

  it('retorna null pra vazio/nulo', () => {
    expect(normalizePhoneE164(null)).toBeNull();
    expect(normalizePhoneE164('')).toBeNull();
    expect(normalizePhoneE164('abc')).toBeNull();
  });
});

describe('buildUserData', () => {
  it('normaliza e-mail (trim + lowercase)', () => {
    expect(buildUserData({ email: '  Joao@Exemplo.COM ' })).toEqual({
      email: 'joao@exemplo.com',
    });
  });

  it('pula e-mail placeholder .invalid (venda de vendedor sem e-mail)', () => {
    expect(
      buildUserData({ email: 'sem-email+abc@no-email.invalid' })
    ).toBeNull();
  });

  it('pula e-mail sem @', () => {
    expect(buildUserData({ email: 'naoehemail' })).toBeNull();
  });

  it('quebra nome em first/last', () => {
    expect(buildUserData({ name: 'Maria da Silva' })).toEqual({
      address: { first_name: 'maria', last_name: 'da silva' },
    });
  });

  it('nome único vira só first_name', () => {
    expect(buildUserData({ name: 'Ana' })).toEqual({
      address: { first_name: 'ana' },
    });
  });

  it('combina e-mail, telefone e nome', () => {
    expect(
      buildUserData({
        email: 'cliente@teste.com',
        phone: '22999963664',
        name: 'Carlos Souza',
      })
    ).toEqual({
      email: 'cliente@teste.com',
      phone_number: '+5522999963664',
      address: { first_name: 'carlos', last_name: 'souza' },
    });
  });

  it('retorna null quando não há dado utilizável', () => {
    expect(buildUserData(undefined)).toBeNull();
    expect(buildUserData({})).toBeNull();
    expect(buildUserData({ email: null, phone: null, name: null })).toBeNull();
  });
});
