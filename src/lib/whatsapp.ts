export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522992467880';

export function buildWaUrl(text?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Normaliza um telefone brasileiro digitado livremente pra E.164 sem "+"
 * (formato que a Cloud API espera em `to`, ex.: "5522998479728").
 * `customers.phone` é texto livre (o checkout só faz trim), então aceita
 * máscara "(22) 99999-9999", "22 99999 9999", já-com-55 etc.
 * Retorna null quando não dá pra tratar como número BR válido.
 */
export function normalizeBrPhoneE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  // Prefixo internacional digitado como 0055 / 055
  digits = digits.replace(/^0+(?=55\d{10,11}$)/, '');
  // DDD + número (10 = fixo, 11 = celular com 9)
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  if (!/^55\d{10,11}$/.test(digits)) return null;
  const ddd = Number(digits.slice(2, 4));
  if (ddd < 11 || ddd > 99) return null;
  return digits;
}
