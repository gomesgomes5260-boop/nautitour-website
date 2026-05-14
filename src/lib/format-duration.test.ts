import { describe, it, expect } from 'vitest';
import { formatDuration } from './format-duration';

describe('formatDuration', () => {
  it('formats minutos < 1h como "Nmin"', () => {
    expect(formatDuration(30)).toBe('30min');
    expect(formatDuration(45)).toBe('45min');
    expect(formatDuration(59)).toBe('59min');
  });

  it('formats horas exatas como "Nh"', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(180)).toBe('3h');
  });

  it('formats horas + minutos como "NhMM" com pad 2 dígitos', () => {
    expect(formatDuration(90)).toBe('1h30');
    expect(formatDuration(150)).toBe('2h30');
    expect(formatDuration(65)).toBe('1h05');
    expect(formatDuration(125)).toBe('2h05');
  });

  it('retorna "—" pra null, undefined, 0 ou negativo', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(undefined)).toBe('—');
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(-10)).toBe('—');
  });
});
