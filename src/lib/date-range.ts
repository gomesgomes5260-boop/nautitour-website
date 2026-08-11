/**
 * Faixa de datas (BRT, UTC-3 fixo sem DST) pros filtros personalizados do
 * admin. Entrada = strings YYYY-MM-DD dos <input type="date">; saída = bounds
 * ISO inclusivos-exclusivos [fromIso, toIso) e a lista de dias pra séries.
 */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function brtTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export type DateRange = {
  /** YYYY-MM-DD normalizados (BRT). */
  from: string;
  to: string;
  /** Bounds UTC: [fromIso, toIso) — to é exclusivo (dia seguinte 00:00 BRT). */
  fromIso: string;
  toIso: string;
};

/**
 * Normaliza from/to da query string. Defaults: início do mês corrente até
 * hoje (BRT). from > to é corrigido invertendo.
 */
export function parseDateRange(
  rawFrom: string | undefined,
  rawTo: string | undefined
): DateRange {
  const today = brtTodayISO();
  const monthStart = `${today.slice(0, 7)}-01`;
  let from = rawFrom && DAY_RE.test(rawFrom) ? rawFrom : monthStart;
  let to = rawTo && DAY_RE.test(rawTo) ? rawTo : today;
  if (from > to) [from, to] = [to, from];

  const fromIso = new Date(`${from}T00:00:00-03:00`).toISOString();
  const toNext = new Date(`${to}T00:00:00-03:00`);
  toNext.setDate(toNext.getDate() + 1);
  return { from, to, fromIso, toIso: toNext.toISOString() };
}

/** Lista de dias YYYY-MM-DD do range (inclusivo), máx `cap` dias. */
export function rangeDays(range: DateRange, cap = 92): string[] {
  const days: string[] = [];
  const d = new Date(`${range.from}T12:00:00-03:00`);
  const end = new Date(`${range.to}T12:00:00-03:00`);
  while (d <= end && days.length < cap) {
    days.push(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d)
    );
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** YYYY-MM-DD (BRT) de um timestamp ISO. */
export function brtDayOf(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

/** Label curto DD/MM. */
export function shortDay(day: string): string {
  return `${day.slice(8)}/${day.slice(5, 7)}`;
}
