import { describe, expect, it } from 'vitest';
import { GALLERY_TAGS, SUGGESTED_TAGS, TAG_RE, sanitizeTag } from './image-tags';

describe('TAG_RE', () => {
  it('aceita slugs válidos', () => {
    for (const tag of ['galeria-home', 'lancha', 'drone-escuna', 'a', 'x1']) {
      expect(tag).toMatch(TAG_RE);
    }
  });

  it('rejeita formatos inválidos', () => {
    for (const tag of ['', 'Galeria', 'a/b', 'com espaço', '-comeca-hifen', 'a'.repeat(41)]) {
      expect(tag).not.toMatch(TAG_RE);
    }
  });

  it('todas as tags sugeridas passam no regex', () => {
    for (const tag of SUGGESTED_TAGS) {
      expect(tag).toMatch(TAG_RE);
    }
    expect(SUGGESTED_TAGS).toEqual(expect.arrayContaining([...GALLERY_TAGS]));
  });
});

describe('sanitizeTag', () => {
  it('normaliza acento, caixa e espaços', () => {
    expect(sanitizeTag('  Drone Escuna ')).toBe('drone-escuna');
    expect(sanitizeTag('Locação')).toBe('locacao');
  });

  it('remove hífens das pontas e trunca em 40', () => {
    expect(sanitizeTag('--bar--')).toBe('bar');
    expect(sanitizeTag('x'.repeat(60))).toBe('x'.repeat(40));
  });

  it('devolve null pra entrada irrecuperável', () => {
    expect(sanitizeTag('')).toBeNull();
    expect(sanitizeTag('   ')).toBeNull();
    expect(sanitizeTag('!!!')).toBeNull();
  });
});
