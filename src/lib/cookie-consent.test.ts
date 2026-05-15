import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock minimalista de `document` — evita dep jsdom só pra teste de cookie.
let cookieStore = '';
beforeEach(() => {
  cookieStore = '';
  vi.stubGlobal('document', {
    get cookie() {
      return cookieStore;
    },
    set cookie(value: string) {
      // Mimica navegador: cada `document.cookie = "foo=bar; ..."` faz
      // SET (não replace) de um único cookie. Implementação minimalista:
      // se Max-Age=0, remove; senão sobrescreve o cookie com mesmo nome.
      const [pair, ...attrs] = value.split('; ');
      const [name] = pair.split('=');
      const maxAge = attrs.find((a) => a.startsWith('Max-Age='));
      const isRemoval = maxAge === 'Max-Age=0';
      const existing = cookieStore
        .split('; ')
        .filter((c) => c && !c.startsWith(`${name}=`));
      cookieStore = isRemoval ? existing.join('; ') : [...existing, pair].join('; ');
    },
  });
  vi.stubGlobal('window', {
    location: { protocol: 'http:' },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal('CustomEvent', class CustomEvent {});
  // Reseta o cache interno do módulo entre testes carregando-o de novo.
  vi.resetModules();
});

describe('cookie-consent', () => {
  it('getConsent retorna null quando não há cookie', async () => {
    const { getConsent } = await import('./cookie-consent');
    expect(getConsent()).toBeNull();
  });

  it('CRITICAL: getConsent retorna a MESMA referência em chamadas consecutivas (cache)', async () => {
    // Regressão crítica: useSyncExternalStore exige que getSnapshot retorne
    // a mesma referência se nada mudou. Caso contrário entra em loop infinito
    // e crasha a página (caiu pro global-error.tsx em prod 2026-05-15).
    const { getConsent, acceptAll } = await import('./cookie-consent');
    acceptAll();
    const a = getConsent();
    const b = getConsent();
    const c = getConsent();
    expect(a).not.toBeNull();
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('getConsent retorna NOVA referência quando o cookie muda', async () => {
    const { getConsent, setConsent } = await import('./cookie-consent');
    setConsent({ analytics: false, retargeting: false });
    const a = getConsent();
    setConsent({ analytics: true, retargeting: false });
    const b = getConsent();
    expect(a).not.toBe(b);
    expect(a?.analytics).toBe(false);
    expect(b?.analytics).toBe(true);
  });

  it('acceptAll persiste analytics=true e retargeting=true', async () => {
    const { acceptAll, getConsent } = await import('./cookie-consent');
    acceptAll();
    const c = getConsent();
    expect(c?.analytics).toBe(true);
    expect(c?.retargeting).toBe(true);
    expect(c?.essential).toBe(true);
  });

  it('declineAll persiste analytics=false e retargeting=false', async () => {
    const { declineAll, getConsent } = await import('./cookie-consent');
    declineAll();
    const c = getConsent();
    expect(c?.analytics).toBe(false);
    expect(c?.retargeting).toBe(false);
  });

  it('null leituras consecutivas mantém estabilidade referencial', async () => {
    const { getConsent } = await import('./cookie-consent');
    const a = getConsent();
    const b = getConsent();
    expect(a).toBeNull();
    expect(b).toBeNull();
    expect(a).toBe(b);
  });

  it('getConsentOrDefault retorna mesma referência de DEFAULT quando sem consent', async () => {
    // Importante pro useCookieConsentOrDefault — também precisa ref estável.
    const { getConsentOrDefault } = await import('./cookie-consent');
    const a = getConsentOrDefault();
    const b = getConsentOrDefault();
    expect(a).toBe(b);
    expect(a.analytics).toBe(false);
  });
});
