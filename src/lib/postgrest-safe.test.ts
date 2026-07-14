import { describe, it, expect } from 'vitest';
import { sanitizePostgrestPattern } from './postgrest-safe';

describe('sanitizePostgrestPattern', () => {
  it('mantém texto simples intacto', () => {
    expect(sanitizePostgrestPattern('maria')).toBe('maria');
    expect(sanitizePostgrestPattern('maria souza')).toBe('maria souza');
  });

  it('neutraliza tentativa de injeção de filtro PostgREST', () => {
    // Sem sanitizar, isto reescreveria o .or() pra referenciar outra coluna.
    expect(sanitizePostgrestPattern('a,email.eq.x@y.com')).toBe('a email eq x@y com');
  });

  it('remove parênteses, vírgulas, dois-pontos, asterisco e barra', () => {
    expect(sanitizePostgrestPattern('or(a,b):*\\')).toBe('or a b');
  });

  it('remove curinga % e aspas (evita quebrar o ilike)', () => {
    expect(sanitizePostgrestPattern("100% \"ok's\"")).toBe('100 ok s');
  });

  it('colapsa espaços e faz trim', () => {
    expect(sanitizePostgrestPattern('  a . , b  ')).toBe('a b');
  });

  it('string só de metacaracteres vira vazio (não filtra)', () => {
    expect(sanitizePostgrestPattern(',.():*')).toBe('');
  });
});
