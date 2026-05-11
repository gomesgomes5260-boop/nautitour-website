import { createAdminClient } from '@/lib/supabase/admin';
import RegenerateButton from './RegenerateButton';

export const dynamic = 'force-dynamic';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export default async function AdminConfigPage() {
  const admin = createAdminClient();

  const [{ data: templates }, { data: lastSchedule }, { data: nextSchedule }] =
    await Promise.all([
      admin
        .from('schedule_templates')
        .select(`id, weekday, departure_time, capacity, active, tour:tours ( name, slug, tour_type )`)
        .order('weekday', { ascending: true })
        .order('departure_time', { ascending: true }),
      admin
        .from('tour_schedules')
        .select('departure_at')
        .order('departure_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('tour_schedules')
        .select('departure_at')
        .gte('departure_at', new Date().toISOString())
        .order('departure_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  type Tpl = {
    id: string;
    weekday: number;
    departure_time: string;
    capacity: number;
    active: boolean;
    tour: { name: string; slug: string; tour_type: string } | { name: string; slug: string; tour_type: string }[] | null;
  };

  const rows = (templates ?? []) as unknown as Tpl[];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <section className="bg-white border border-gray-200 rounded-md p-6">
        <h2 className="text-lg font-semibold mb-2">Saídas — geração automática</h2>
        <p className="text-sm text-gray-600 mb-4">
          O sistema mantém <strong>28 dias</strong> de saídas adiante baseado nos templates abaixo. Um job
          diário às <strong>04:00 BRT</strong> roda automaticamente; o botão abaixo dispara manualmente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
          <div className="border border-gray-200 rounded p-3">
            <div className="text-xs text-gray-500 uppercase">Próxima saída</div>
            <div className="text-base">
              {nextSchedule?.departure_at
                ? DATE.format(new Date(nextSchedule.departure_at))
                : '—'}
            </div>
          </div>
          <div className="border border-gray-200 rounded p-3">
            <div className="text-xs text-gray-500 uppercase">Última saída agendada</div>
            <div className="text-base">
              {lastSchedule?.departure_at
                ? DATE.format(new Date(lastSchedule.departure_at))
                : '—'}
            </div>
          </div>
        </div>
        <RegenerateButton />
      </section>

      <section className="bg-white border border-gray-200 rounded-md p-6">
        <h2 className="text-lg font-semibold mb-4">Templates de horário</h2>
        <p className="text-sm text-gray-600 mb-4">
          O cron gera saídas para cada combinação abaixo. Editar templates (capacidade, horário) será
          adicionado em uma próxima entrega — por enquanto a alteração é via SQL.
        </p>
        <div className="overflow-hidden border border-gray-200 rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Tour</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Dia da semana</th>
                <th className="px-3 py-2">Horário</th>
                <th className="px-3 py-2 text-right">Capacidade</th>
                <th className="px-3 py-2 text-center">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    Nenhum template configurado.
                  </td>
                </tr>
              )}
              {rows.map((t) => {
                const tour = Array.isArray(t.tour) ? t.tour[0] : t.tour;
                return (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{tour?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-600 capitalize">
                      {tour?.tour_type ?? '—'}
                    </td>
                    <td className="px-3 py-2">{WEEKDAYS[t.weekday]}</td>
                    <td className="px-3 py-2 font-mono">
                      {t.departure_time.slice(0, 5)}
                    </td>
                    <td className="px-3 py-2 text-right">{t.capacity}</td>
                    <td className="px-3 py-2 text-center">
                      {t.active ? '✓' : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
