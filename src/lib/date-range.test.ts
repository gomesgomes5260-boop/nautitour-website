import { describe, expect, it } from 'vitest';
import { compareRange, deltaPct, parseDateRange, rangeDays, shortDay } from './date-range';

describe('compareRange prev', () => {
  it('período anterior equivalente com mesmo nº de dias', () => {
    const range = parseDateRange('2026-08-01', '2026-08-12'); // 12 dias
    const prev = compareRange(range, 'prev');
    expect(prev.from).toBe('2026-07-20');
    expect(prev.to).toBe('2026-07-31');
    expect(rangeDays(prev)).toHaveLength(12);
  });

  it('atravessa virada de mês/ano', () => {
    const range = parseDateRange('2026-01-01', '2026-01-07'); // 7 dias
    const prev = compareRange(range, 'prev');
    expect(prev.from).toBe('2025-12-25');
    expect(prev.to).toBe('2025-12-31');
  });

  it('dia único compara com a véspera', () => {
    const range = parseDateRange('2026-08-12', '2026-08-12');
    const prev = compareRange(range, 'prev');
    expect(prev.from).toBe('2026-08-11');
    expect(prev.to).toBe('2026-08-11');
  });
});

describe('compareRange yoy', () => {
  it('mesmas datas do ano anterior', () => {
    const range = parseDateRange('2026-08-01', '2026-08-12');
    const yoy = compareRange(range, 'yoy');
    expect(yoy.from).toBe('2025-08-01');
    expect(yoy.to).toBe('2025-08-12');
  });

  it('29/fev vira 28/fev no ano não-bissexto', () => {
    const range = parseDateRange('2028-02-29', '2028-02-29');
    const yoy = compareRange(range, 'yoy');
    expect(yoy.from).toBe('2027-02-28');
    expect(yoy.to).toBe('2027-02-28');
  });
});

describe('deltaPct', () => {
  it('calcula a variação percentual', () => {
    expect(deltaPct(120, 100)).toBe(20);
    expect(deltaPct(80, 100)).toBe(-20);
    expect(deltaPct(0, 100)).toBe(-100);
  });

  it('base zero → null (sem Infinity)', () => {
    expect(deltaPct(50, 0)).toBeNull();
    expect(deltaPct(0, 0)).toBeNull();
  });
});

describe('shortDay', () => {
  it('DD/MM', () => {
    expect(shortDay('2026-08-12')).toBe('12/08');
  });
});
