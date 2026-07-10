import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import Pagination from '@/components/Pagination';
import NewSellerForm from './NewSellerForm';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const PRICE = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function maskPix(key: string | null): string {
  if (!key) return '—';
  if (key.length <= 6) return `${key.slice(0, 2)}…`;
  return `${key.slice(0, 4)}…${key.slice(-3)}`;
}

export default async function AdminVendedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const admin = createAdminClient();
  const { data: sellers, count } = await admin
    .from('sellers')
    .select('id, role, agency_id, full_name, phone, neto_value_cents, pix_key, active, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const rows = sellers ?? [];
  const totalItems = count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Nome das agências (pra coluna) + lista pro form de criação
  const { data: agencies } = await admin
    .from('sellers')
    .select('id, full_name')
    .eq('role', 'agency')
    .eq('active', true)
    .order('full_name');
  const agencyName = new Map((agencies ?? []).map((a) => [a.id, a.full_name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-charcoal-900)]">Vendedores</h1>
          <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
            Vendedores e agências que registram reservas pelo painel. Comissão =
            total da venda menos o neto devido à empresa.
          </p>
        </div>
      </div>

      <NewSellerForm agencies={agencies ?? []} />

      <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-charcoal-50)] text-left text-[10px] uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
              <tr>
                <th className="px-4 py-3 font-bold">Nome</th>
                <th className="px-4 py-3 font-bold">Tipo</th>
                <th className="px-4 py-3 font-bold">Agência</th>
                <th className="px-4 py-3 font-bold">Neto/inteira</th>
                <th className="px-4 py-3 font-bold">Chave PIX</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--color-charcoal-500)]">
                    Nenhum vendedor cadastrado ainda.
                  </td>
                </tr>
              )}
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-[var(--color-charcoal-100)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-charcoal-900)]">
                    {s.full_name}
                    {s.phone && (
                      <span className="block text-xs text-[var(--color-charcoal-500)]">{s.phone}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.role === 'agency'
                          ? 'bg-violet-50 text-violet-700 border border-violet-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {s.role === 'agency' ? 'Agência' : 'Vendedor'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-charcoal-700)]">
                    {s.agency_id ? (agencyName.get(s.agency_id) ?? '—') : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-charcoal-700)]">
                    {PRICE.format(s.neto_value_cents / 100)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-charcoal-500)]">
                    {maskPix(s.pix_key)}
                  </td>
                  <td className="px-4 py-3">
                    {s.active ? (
                      <span className="inline-block rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 text-xs font-semibold">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-[var(--color-charcoal-50)] border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-500)] px-2.5 py-0.5 text-xs font-semibold">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/vendedores/${s.id}`}
                      className="text-xs font-semibold text-[var(--color-red-600)] hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        buildHref={(p) => `/admin/vendedores?page=${p}`}
        itemLabel={{ singular: 'vendedor', plural: 'vendedores' }}
      />
    </div>
  );
}
