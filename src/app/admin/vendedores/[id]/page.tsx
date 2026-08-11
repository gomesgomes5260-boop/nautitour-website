import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDateRange } from '@/lib/date-range';
import AdminPrintButton from '@/components/AdminPrintButton';
import XlsxDownloadButton from '@/components/XlsxDownloadButton';
import EditSellerForm, { type SellerForEdit } from './EditSellerForm';
import { getSellerReport } from './report-data';
import { exportSellerReportXlsxAction } from '../actions';

export const dynamic = 'force-dynamic';

const PRICE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const DATETIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pendente',
  confirmed: 'Confirmada',
  completed: 'Embarcada',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

const inputClass =
  'border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

export default async function AdminVendedorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const range = parseDateRange(sp.from, sp.to);

  const admin = createAdminClient();

  const { data: seller } = await admin
    .from('sellers')
    .select('id, user_id, role, agency_id, full_name, phone, neto_value_cents, pix_key, active, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!seller) notFound();

  const { data: authUser } = await admin.auth.admin.getUserById(seller.user_id);
  const email = authUser?.user?.email ?? null;

  const { data: agencies } = await admin
    .from('sellers')
    .select('id, full_name')
    .eq('role', 'agency')
    .eq('active', true)
    .neq('id', seller.id)
    .order('full_name');

  const report = await getSellerReport(seller.id, range);
  const t = report.totals;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link
          href="/admin/vendedores"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] mb-3"
        >
          <ArrowLeft size={14} /> Vendedores
        </Link>
        <h1 className="text-xl font-bold text-[var(--color-charcoal-900)]">
          {seller.full_name}
        </h1>
        <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
          {seller.role === 'agency' ? 'Agência' : 'Vendedor'}
          {email && (
            <>
              {' · '}
              <span className="font-mono text-xs">{email}</span>
            </>
          )}
        </p>
      </div>

      <div className="max-w-3xl print:hidden">
        <EditSellerForm
          seller={seller as SellerForEdit}
          agencies={agencies ?? []}
        />
      </div>

      {/* ===== Relatório de vendas do período ===== */}
      <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-6 print:border-0 print:p-0">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)]">
              Vendas de {seller.full_name}
            </h2>
            <p className="text-xs text-[var(--color-charcoal-500)] mt-1">
              Período {range.from.split('-').reverse().join('/')} a{' '}
              {range.to.split('-').reverse().join('/')} · por data de registro da reserva
            </p>
          </div>
          <div className="flex items-end gap-3 flex-wrap print:hidden">
            <form className="flex items-end gap-2">
              <div>
                <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
                  De
                </label>
                <input type="date" name="from" defaultValue={range.from} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-charcoal-700)] mb-1.5">
                  Até
                </label>
                <input type="date" name="to" defaultValue={range.to} className={inputClass} />
              </div>
              <button
                type="submit"
                className="bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
              >
                Filtrar
              </button>
            </form>
            <XlsxDownloadButton
              exportAction={exportSellerReportXlsxAction.bind(null, {
                sellerId: seller.id,
                from: range.from,
                to: range.to,
              })}
            />
            <AdminPrintButton />
          </div>
        </div>

        {/* Somatórios */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Stat label="Reservas" value={String(t.bookings)} />
          <Stat label="Passageiros" value={String(t.pax)} />
          <Stat label="Valor das reservas" value={PRICE.format(t.totalCents / 100)} />
          <Stat label="Sinal recebido" value={PRICE.format(t.paidCents / 100)} />
          <Stat label="Comissão paga" value={PRICE.format(t.commissionSentCents / 100)} tone="text-emerald-700" />
          <Stat
            label="Comissão a receber"
            value={PRICE.format(t.commissionPendingCents / 100)}
            tone="text-amber-700"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm print:text-[10px]">
            <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
              <tr>
                <th className="px-3 py-2.5 print:px-1.5 print:py-1">Reserva</th>
                <th className="px-3 py-2.5 print:px-1.5 print:py-1">Criada</th>
                <th className="px-3 py-2.5 print:px-1.5 print:py-1">Saída</th>
                <th className="px-3 py-2.5 print:px-1.5 print:py-1">Cliente</th>
                <th className="px-3 py-2.5 print:px-1.5 print:py-1 text-center">Pax</th>
                <th className="px-3 py-2.5 print:px-1.5 print:py-1 text-right">Total</th>
                <th className="px-3 py-2.5 print:px-1.5 print:py-1 text-right">Sinal</th>
                <th className="px-3 py-2.5 print:px-1.5 print:py-1">Status</th>
                <th className="px-3 py-2.5 print:px-1.5 print:py-1 text-right">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-[var(--color-charcoal-500)]">
                    Nenhuma venda no período.
                  </td>
                </tr>
              )}
              {report.rows.map((r) => (
                <tr key={r.bookingCode} className="border-t border-[var(--color-charcoal-100)]">
                  <td className="px-3 py-2.5 print:px-1.5 print:py-1">
                    <Link
                      href={`/admin/reservas/${r.bookingCode}`}
                      className="font-mono text-xs text-[var(--color-red-600)] hover:underline"
                    >
                      {r.bookingCode}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 print:px-1.5 print:py-1 text-xs text-[var(--color-charcoal-500)]">
                    {DATETIME.format(new Date(r.createdAt))}
                  </td>
                  <td className="px-3 py-2.5 print:px-1.5 print:py-1 text-xs text-[var(--color-charcoal-700)]">
                    {r.departureAt ? DATETIME.format(new Date(r.departureAt)) : '—'}
                  </td>
                  <td className="px-3 py-2.5 print:px-1.5 print:py-1 text-[var(--color-charcoal-900)]">
                    {r.customerName}
                  </td>
                  <td className="px-3 py-2.5 print:px-1.5 print:py-1 text-center tabular-nums">
                    {r.pax}
                  </td>
                  <td className="px-3 py-2.5 print:px-1.5 print:py-1 text-right font-mono">
                    {PRICE.format(r.totalCents / 100)}
                  </td>
                  <td className="px-3 py-2.5 print:px-1.5 print:py-1 text-right font-mono">
                    {r.paidCents > 0 ? PRICE.format(r.paidCents / 100) : '—'}
                  </td>
                  <td className="px-3 py-2.5 print:px-1.5 print:py-1 text-xs">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </td>
                  <td className="px-3 py-2.5 print:px-1.5 print:py-1 text-right font-mono">
                    {r.payoutCents != null ? (
                      <span
                        className={
                          r.payoutStatus === 'sent' ? 'text-emerald-700' : 'text-amber-700'
                        }
                      >
                        {PRICE.format(r.payoutCents / 100)}
                        <span className="block text-[10px] font-sans">
                          {r.payoutStatus === 'sent' ? 'paga' : 'a receber'}
                        </span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--color-charcoal-500)] mt-3 print:hidden">
          Somatórios excluem reservas canceladas. Comissão aparece após o
          check-in da reserva.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-charcoal-100)] bg-[var(--color-charcoal-50)]/60 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-charcoal-500)]">
        {label}
      </p>
      <p className={`text-sm font-bold mt-0.5 ${tone ?? 'text-[var(--color-charcoal-900)]'}`}>
        {value}
      </p>
    </div>
  );
}
