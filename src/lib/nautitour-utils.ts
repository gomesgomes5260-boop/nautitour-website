/**
 * Helpers puros (sem server-only) usados pela integração Nautitour:
 * - normalização de telefone E.164 (+55...)
 * - conversão de timestamps UTC pro fuso de Búzios (UTC-3 sem DST)
 *
 * Ficam aqui pra serem testáveis no vitest sem o boilerplate de mockar
 * 'server-only'. A lógica de fetch fica em `src/lib/nautitour.ts`.
 */

/**
 * Normaliza telefones brasileiros pro formato E.164 (+55...).
 * Aceita: "(11) 99999-9999", "11999999999", "+5511999999999", "5511...".
 * Se o input já tem código de país (12-13 dígitos começando com 55), preserva.
 * Se vier sem (10-11 dígitos), assume Brasil e prefixa 55.
 */
export function normalizePhoneE164(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D+/g, '');
  if (!digits) return '';
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return `+${digits}`;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  return `+${digits}`;
}

/** Converte timestamp UTC pra "YYYY-MM-DD" no fuso de Búzios. */
export function buzziosTripDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    timeZone: 'America/Sao_Paulo',
  });
}

/** Converte timestamp UTC pra "HH:MM" no fuso de Búzios. */
export function buzziosTripTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
}
