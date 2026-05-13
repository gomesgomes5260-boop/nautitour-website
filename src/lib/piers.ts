// Helpers de píer de embarque. Tabela embarkation_piers tem RLS de
// leitura pública, então pode usar createClient() em qualquer contexto
// (server ou anon).

export type Pier = {
  id: string;
  slug: string;
  name: string;
  fee_cents: number;
  address: string | null;
  google_maps_url: string | null;
  notes: string | null;
  is_default: boolean;
  active: boolean;
};

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatPierFee(cents: number): string {
  if (cents <= 0) return 'Sem taxa de embarque';
  return `Taxa de embarque ${PRICE.format(cents / 100)} por pessoa`;
}

export function formatPierFeeShort(cents: number): string {
  if (cents <= 0) return 'Sem taxa';
  return `+${PRICE.format(cents / 100)}/pax`;
}
