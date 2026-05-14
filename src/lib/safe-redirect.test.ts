import { describe, it, expect } from 'vitest';
import { safeRedirectPath } from './safe-redirect';

describe('safeRedirectPath', () => {
  it('aceita paths internos absolutos', () => {
    expect(safeRedirectPath('/')).toBe('/');
    expect(safeRedirectPath('/admin')).toBe('/admin');
    expect(safeRedirectPath('/admin/reservas/NTT-ABC123')).toBe(
      '/admin/reservas/NTT-ABC123'
    );
    expect(safeRedirectPath('/passeio-escuna?q=foo')).toBe(
      '/passeio-escuna?q=foo'
    );
  });

  it('rejeita URLs externas com schema (http/https/etc)', () => {
    expect(safeRedirectPath('https://evil.com')).toBe('/');
    expect(safeRedirectPath('http://evil.com/foo')).toBe('/');
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/');
    expect(safeRedirectPath('data:text/html,foo')).toBe('/');
  });

  it('rejeita protocol-relative URLs (//evil.com)', () => {
    expect(safeRedirectPath('//evil.com')).toBe('/');
    expect(safeRedirectPath('//evil.com/foo')).toBe('/');
  });

  it('rejeita paths relativos sem leading slash', () => {
    expect(safeRedirectPath('foo')).toBe('/');
    expect(safeRedirectPath('admin/foo')).toBe('/');
  });

  it('rejeita valores vazios, null, undefined', () => {
    expect(safeRedirectPath('')).toBe('/');
    expect(safeRedirectPath(null)).toBe('/');
    expect(safeRedirectPath(undefined)).toBe('/');
  });

  it('rejeita backslashes e control chars', () => {
    expect(safeRedirectPath('/admin\\evil')).toBe('/');
    expect(safeRedirectPath('/admin foo')).toBe('/');
  });
});
