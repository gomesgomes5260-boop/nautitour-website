import Link from 'next/link';
import { Wallet, Send, AlertTriangle } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import KpiCard from '@/components/KpiCard';
import RetryButton from './RetryButton';

export const dynamic = 'force-dynamic';

const PRICE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const STATUS: Record<string, { label: string; cls: string }> = {
  sent: { label: 'Enviado', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  pending: {
    label: 'Pendente',
    cls: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  failed: {
    label: 'Falhou',
    cls: 'bg-[var(--color-red-50)] border-[var(--color-red-100)] text-[var(--color-red-900)]',
  },
  skipped: {
    label: 'Sem comissão',
    cls: 'bg-[var(--color-charcoal-50)] border-[var(--color-charcoal-200)] text-[var(--color-charcoal-500)]',
  },
};

export default async function AdminComissoesPage() {
  const admin = createAdminClient();
  const { data: payouts } = await admin
    .from('seller_payouts')
    .select(
      `
      id, amount_cents, status, e2e_id, error, sent_at, created_at, pix_key,
      seller:sellers ( full_name ),
      booking:bookings ( booking_code )
      `
    )
    .order('created_at', { ascending: false })
    .limit(200);

  type Row = {
    id: string;
    amount_cents: number;
    status: string;
    e2e_id: string | null;
    error: string | null;
    sent_at: string | null;
    created_at: string;
    pix_key: string | null;
    seller: { full_name: string } | { full_name: string }[] | null;
    booking: { booking_code: string } | { booking_code: string }[] | null;
  };
  const rows = (payouts ?? []) as unknown as Row[];

  const sentTotal = rows
    .filter((r) => r.status === 'sent')
    .reduce((acc, r) => acc + r.amount_cents, 0);
  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const failedCount = rows.filter((r) => r.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-charcoal-900)]">Comissões</h1>
        <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
          Payouts PIX de comissão aos vendedores, disparados no primeiro
          check-in de cada reserva. Falhas ficam aqui pra reenvio manual.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          Icon={Send}
          label="Comissão enviada"
          value={PRICE.format(sentTotal / 100)}
          sub="últimos 200 payouts"
        />
        <KpiCard Icon={Wallet} label="Pendentes" value={String(pendingCount)} />
        <KpiCard
          Icon={AlertTriangle}
          label="Falharam"
          value={String(failedCount)}
          iconTone={failedCount > 0 ? 'bg-[var(--color-red-50)] text-[var(--color-red-600)]' : undefined}
        />
      </div>

      <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
              <tr>
                <th className="px-4 py-3 font-bold">Reserva</th>
                <th className="px-4 py-3 font-bold">Vendedor</th>
                <th className="px-4 py-3 font-bold">Valor</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Quando</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-charcoal-500)]">
                    Nenhum payout ainda — eles aparecem após o primeiro
                    check-in de reservas de vendedor.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const seller = Array.isArray(r.seller) ? r.seller[0] : r.seller;
                const booking = Array.isArray(r.booking) ? r.booking[0] : r.booking;
                const st = STATUS[r.status] ?? STATUS.skipped;
                return (
                  <tr key={r.id} className="border-t border-[var(--color-charcoal-100)]">
                    <td className="px-4 py-3">
                      {booking ? (
                        <Link
                          href={`/admin/reservas/${booking.booking_code}`}
                          className="font-mono text-xs font-semibold text-[var(--color-red-600)] hover:underline"
                        >
                          {booking.booking_code}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-charcoal-900)]">
                      {seller?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--color-charcoal-900)]">
                      {PRICE.format(r.amount_cents / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                      {r.error && (r.status === 'failed' || r.status === 'pending') && (
                        <span className="block text-[11px] text-[var(--color-charcoal-500)] mt-1 max-w-[260px] truncate">
                          {r.error}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-charcoal-500)]">
                      {DATE_TIME.format(new Date(r.sent_at ?? r.created_at))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(r.status === 'failed' || r.status === 'pending') &&
                        r.amount_cents > 0 && <RetryButton payoutId={r.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
