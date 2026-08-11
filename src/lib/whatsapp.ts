/**
 * Números de WhatsApp do atendimento — RODÍZIO por clique (decisão 05/ago).
 *
 * O número antigo único (5522992467880) não tem WhatsApp cadastrado; os
 * contatos reais são os 4 da equipe (os mesmos do rodapé). Cada chamada de
 * buildWaUrl() sem número explícito sorteia um deles, distribuindo o
 * atendimento. Como os links do cliente passam pela rota /api/wa (ou são
 * montados por server action no momento do envio), o sorteio acontece a cada
 * clique — não fica congelado no build.
 *
 * Override opcional via NEXT_PUBLIC_WHATSAPP_NUMBERS (lista separada por
 * vírgula, dígitos com DDI). A env antiga NEXT_PUBLIC_WHATSAPP_NUMBER
 * (singular) foi aposentada e é ignorada.
 */
const DEFAULT_NUMBERS =
  // Kaline · Thaina · Willian · Patricia
  '5522999963664,5522997734466,5522999087800,5522988052238';

export const WHATSAPP_NUMBERS: string[] = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBERS ?? DEFAULT_NUMBERS
)
  .split(',')
  .map((n) => n.replace(/\D/g, ''))
  .filter(Boolean);

export function pickWhatsAppNumber(): string {
  return WHATSAPP_NUMBERS[Math.floor(Math.random() * WHATSAPP_NUMBERS.length)];
}

/** "5522999963664" → "(22) 99996-3664" (exibição no admin). */
export function formatWaNumber(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return '—';
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (local.length < 10) return local;
  const ddd = local.slice(0, 2);
  const rest = local.slice(2);
  return `(${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
}

export function buildWaUrl(text?: string, number?: string): string {
  const base = `https://wa.me/${number ?? pickWhatsAppNumber()}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
