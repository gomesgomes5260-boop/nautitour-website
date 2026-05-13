// Formata duração em minutos pra string amigável BR.
//   150 → "2h30"
//   180 → "3h"
//   45  → "45min"
//   90  → "1h30"
export function formatDuration(totalMinutes: number | null | undefined): string {
  if (totalMinutes == null || totalMinutes <= 0) return '—';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}
