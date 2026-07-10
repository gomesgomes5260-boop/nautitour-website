/**
 * Fórmula de comissão do vendedor (Opção A, portada do painel antigo —
 * convertida de Float BRL pra centavos inteiros):
 *
 *   netoOwed    = neto_value_cents × inteiras + floor(neto/2) × meias
 *   sellerEarns = max(0, total − netoOwed)
 *   payout      = min(sinalPago, sellerEarns)
 *
 * O payout nunca excede o que a empresa já tem em mãos (o sinal): o resto
 * da comissão o vendedor já reteve na venda presencial.
 *
 * Puro e sem 'server-only' pra ser testável no Vitest.
 */
export function calcSellerPayoutCents(input: {
  netoValueCents: number;
  fullCount: number;
  childCount: number;
  totalCents: number;
  amountPaidCents: number;
}): number {
  const netoOwed =
    input.netoValueCents * input.fullCount +
    Math.floor(input.netoValueCents / 2) * input.childCount;
  const sellerEarns = Math.max(0, input.totalCents - netoOwed);
  return Math.min(input.amountPaidCents, sellerEarns);
}
