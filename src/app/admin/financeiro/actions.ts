'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';

const METHOD_LABEL: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  boleto: 'Boleto',
};

export async function exportFinanceXlsxAction(filters: {
  fromIso: string;
  toIso: string;
  label: string;
}): Promise<
  { ok: true; base64: string; filename: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/financeiro');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const { getFinanceData } = await import('./data');
  const data = await getFinanceData(filters.fromIso, filters.toIso);

  const DT = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const { buildXlsxBase64 } = await import('@/lib/xlsx');
  const base64 = await buildXlsxBase64([
    {
      name: 'Resumo',
      columns: [{ header: 'Métrica', width: 30 }, { header: 'Valor', width: 22 }],
      rows: [
        ['Período', filters.label],
        ['Receita (R$)', data.revenueCents / 100],
        ['A receber (R$)', data.pendingTotalCents / 100],
        ['Reembolsos (qtd)', data.refundsCount],
        ['Reembolsos (R$)', data.refundsTotalCents / 100],
        ['Cancelamentos (qtd)', data.cancelledCount],
      ],
    },
    {
      name: 'Por método',
      columns: [
        { header: 'Método', width: 22 },
        { header: 'Receita (R$)', width: 16, money: true },
        { header: '%', width: 8 },
      ],
      rows: data.methodRows.map((m) => [
        METHOD_LABEL[m.method] ?? m.method,
        m.cents / 100,
        Math.round(m.pct * 100),
      ]),
    },
    {
      name: 'Por produto',
      columns: [
        { header: 'Produto', width: 30 },
        { header: 'Receita (R$)', width: 16, money: true },
        { header: '%', width: 8 },
      ],
      rows: data.tourRows.map((t) => [t.name, t.cents / 100, Math.round(t.pct * 100)]),
    },
    {
      name: 'Transações',
      columns: [
        { header: 'Quando', width: 18 },
        { header: 'Reserva', width: 14 },
        { header: 'Cliente', width: 28 },
        { header: 'Tour', width: 26 },
        { header: 'Método', width: 16 },
        { header: 'Valor (R$)', width: 14, money: true },
      ],
      rows: data.transactions.map((t) => [
        t.paidAt ? DT.format(new Date(t.paidAt)) : '',
        t.bookingCode ?? '',
        t.customerName,
        t.tourName,
        METHOD_LABEL[t.method] ?? t.method,
        t.amountCents / 100,
      ]),
    },
  ]);

  return {
    ok: true,
    base64,
    filename: `financeiro-nautitour-${filters.label.replace(/[^\w-]+/g, '-').toLowerCase()}.xlsx`,
  };
}
