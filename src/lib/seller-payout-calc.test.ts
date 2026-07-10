import { describe, it, expect } from 'vitest';
import { calcSellerPayoutCents } from './seller-payout-calc';

describe('calcSellerPayoutCents', () => {
  it('caso base: 2 inteiras, sinal cobre a comissão', () => {
    // total 2×R$150 = R$300; neto R$100/inteira → devido R$200; earns R$100
    // sinal R$150 ≥ earns → payout = earns = R$100
    expect(
      calcSellerPayoutCents({
        netoValueCents: 10000,
        fullCount: 2,
        childCount: 0,
        totalCents: 30000,
        amountPaidCents: 15000,
      })
    ).toBe(10000);
  });

  it('sinal menor que a comissão limita o payout ao sinal', () => {
    // earns R$100, sinal R$60 → payout R$60
    expect(
      calcSellerPayoutCents({
        netoValueCents: 10000,
        fullCount: 2,
        childCount: 0,
        totalCents: 30000,
        amountPaidCents: 6000,
      })
    ).toBe(6000);
  });

  it('meia conta metade do neto (floor em centavos)', () => {
    // neto R$99,99 → meia floor(9999/2)=4999
    // 1 inteira + 1 meia: devido 9999+4999=14998; total R$250 → earns 10002
    // sinal R$200 → payout 10002
    expect(
      calcSellerPayoutCents({
        netoValueCents: 9999,
        fullCount: 1,
        childCount: 1,
        totalCents: 25000,
        amountPaidCents: 20000,
      })
    ).toBe(10002);
  });

  it('neto maior que o total → payout zero (nunca negativo)', () => {
    expect(
      calcSellerPayoutCents({
        netoValueCents: 20000,
        fullCount: 2,
        childCount: 0,
        totalCents: 30000,
        amountPaidCents: 30000,
      })
    ).toBe(0);
  });

  it('sem sinal registrado → payout zero', () => {
    expect(
      calcSellerPayoutCents({
        netoValueCents: 10000,
        fullCount: 1,
        childCount: 0,
        totalCents: 15000,
        amountPaidCents: 0,
      })
    ).toBe(0);
  });

  it('neto zero (vendedor do site/casa) → payout = min(sinal, total)', () => {
    expect(
      calcSellerPayoutCents({
        netoValueCents: 0,
        fullCount: 2,
        childCount: 1,
        totalCents: 25000,
        amountPaidCents: 10000,
      })
    ).toBe(10000);
  });
});
