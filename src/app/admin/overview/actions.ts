'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';
import { parseDateRange } from '@/lib/date-range';
import { getOverviewData } from './data';

export type XlsxExportResult =
  | { ok: true; base64: string; filename: string }
  | { ok: false; error: string };

export async function exportOverviewXlsxAction(filters: {
  from?: string;
  to?: string;
}): Promise<XlsxExportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/overview');
  if (!(await isAdminUser(user.id))) return { ok: false, error: 'Sem permissão' };

  const range = parseDateRange(filters.from, filters.to);
  const data = await getOverviewData(range);

  const { buildXlsxBase64 } = await import('@/lib/xlsx');
  const base64 = await buildXlsxBase64([
    {
      name: 'Resumo',
      columns: [{ header: 'Métrica', width: 30 }, { header: 'Valor', width: 20 }],
      rows: [
        ['Período', `${range.from} a ${range.to}`],
        ['Receita (R$)', data.revenueCents / 100],
        ['Passageiros embarcados', data.paxTotal],
        ['Ocupação média (%)', data.occPct],
        ['Reembolsos (qtd)', data.refundsCount],
        ['Reembolsos (R$)', data.refundsTotalCents / 100],
        ['Chats WhatsApp', data.chatsCount],
      ],
    },
    {
      name: 'Por dia',
      columns: [
        { header: 'Dia', width: 12 },
        { header: 'Receita (R$)', width: 16, money: true },
        { header: 'Passageiros', width: 14 },
        { header: 'Ocupação (%)', width: 14 },
        { header: 'Reembolsos', width: 12 },
        { header: 'Chats WhatsApp', width: 16 },
      ],
      rows: data.days.map((day, i) => [
        day,
        data.revenueByDay[i].value / 100,
        data.paxByDay[i].value,
        data.occByDay[i].value,
        data.refundsByDay[i].value,
        data.chatsByDay[i].value,
      ]),
    },
  ]);

  return {
    ok: true,
    base64,
    filename: `dashboard-nautitour-${range.from}-a-${range.to}.xlsx`,
  };
}
