/**
 * CPF — normalização e validação com dígitos verificadores.
 *
 * A adquirente (Stone, via Pagar.me) exige o documento do cliente em toda
 * cobrança: sem CPF o pedido nasce e a cobrança falha na hora com
 * "The customer Document is required" (PIX e cartão — visto em produção
 * 04/ago). Por isso o CPF é obrigatório no checkout e validado nos dois
 * lados (client e server action).
 */

/** Remove tudo que não é dígito ("123.456.789-00" → "12345678900"). */
export function normalizeCpf(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\D/g, '');
}

/** Valida comprimento + dígitos verificadores. Aceita com ou sem máscara. */
export function isValidCpf(raw: string | null | undefined): boolean {
  const cpf = normalizeCpf(raw);
  if (cpf.length !== 11) return false;
  // Sequências repetidas (000..., 111...) passam no checksum mas são inválidas.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split('').map(Number);
  for (const position of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < position; i++) {
      sum += digits[i] * (position + 1 - i);
    }
    const expected = ((sum * 10) % 11) % 10;
    if (digits[position] !== expected) return false;
  }
  return true;
}
