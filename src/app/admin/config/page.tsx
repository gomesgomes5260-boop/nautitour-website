import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isOwnerUser } from '@/lib/admin';
import RegenerateButton from './RegenerateButton';
import AdminsTable, { type AdminRow } from './AdminsTable';
import TourPricingForm, { type TourRow } from './TourPricingForm';
import TemplatesEditor, {
  type TemplateRow,
  type TourOption,
} from './TemplatesEditor';

export const dynamic = 'force-dynamic';

const DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export default async function AdminConfigPage() {
  const admin = createAdminClient();

  // Auth contexto: precisamos saber se é owner pra mostrar form de add admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/config');
  const isOwner = await isOwnerUser(user.id);

  const [
    { data: templates },
    { data: lastSchedule },
    { data: nextSchedule },
    { data: adminsRaw },
    { data: toursRaw },
  ] = await Promise.all([
      admin
        .from('schedule_templates')
        .select(`id, tour_id, weekday, departure_time, capacity, price_cents, active, tour:tours ( name, slug, tour_type )`)
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
      admin
        .from('admins_with_email')
        .select('user_id, email, role, created_at, created_by_email')
        .order('created_at', { ascending: true }),
      admin
        .from('tours')
        .select('id, name, slug, base_price_cents, max_capacity, tour_type')
        .eq('active', true)
        .order('name', { ascending: true }),
    ]);

  const admins: AdminRow[] = (adminsRaw ?? []).flatMap((a) => {
    if (!a.user_id || !a.email || !a.role || !a.created_at) return [];
    if (a.role !== 'owner' && a.role !== 'operator') return [];
    return [{
      user_id: a.user_id,
      email: a.email,
      role: a.role,
      created_at: a.created_at,
      created_by_email: a.created_by_email ?? null,
    }];
  });

  const tours: TourRow[] = (toursRaw ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    base_price_cents: t.base_price_cents,
    max_capacity: t.max_capacity,
  }));

  type Tpl = {
    id: string;
    tour_id: string;
    weekday: number;
    departure_time: string;
    capacity: number;
    price_cents: number | null;
    active: boolean;
    tour: { name: string; slug: string; tour_type: string } | { name: string; slug: string; tour_type: string }[] | null;
  };

  const rows = (templates ?? []) as unknown as Tpl[];

  const templateRows: TemplateRow[] = rows.map((r) => {
    const t = Array.isArray(r.tour) ? r.tour[0] : r.tour;
    return {
      id: r.id,
      tour_id: r.tour_id,
      tour_name: t?.name ?? '—',
      tour_type: t?.tour_type ?? '—',
      weekday: r.weekday,
      departure_time: r.departure_time,
      capacity: r.capacity,
      price_cents: r.price_cents,
      active: r.active,
    };
  });

  const tourOptions: TourOption[] = (toursRaw ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    tour_type: t.tour_type,
    base_price_cents: t.base_price_cents,
  }));

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
        <h2 className="text-lg font-semibold mb-2">Templates de horário</h2>
        <p className="text-sm text-gray-600 mb-4">
          O cron gera saídas para cada combinação abaixo. Edite capacidade, horário,
          preço ou desative aqui — o próximo job pega as mudanças.
        </p>
        <TemplatesEditor templates={templateRows} tours={tourOptions} />
      </section>

      <section className="bg-white border border-gray-200 rounded-md p-6">
        <h2 className="text-lg font-semibold mb-2">Preços e capacidade</h2>
        <p className="text-sm text-gray-600 mb-4">
          Editar aqui altera o <strong>preço base</strong> e <strong>capacidade máxima</strong> de
          cada tour. Marque a opção pra aplicar também às saídas futuras já agendadas
          (caso contrário, só novas saídas geradas pelo cron usarão os novos valores).
        </p>
        <div className="space-y-4">
          {tours.map((t) => (
            <TourPricingForm key={t.id} tour={t} />
          ))}
          {tours.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum tour ativo.</p>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-md p-6">
        <h2 className="text-lg font-semibold mb-2">Administradores</h2>
        <p className="text-sm text-gray-600 mb-4">
          <strong>Owners</strong> podem adicionar/remover outros admins. <strong>Operators</strong>{' '}
          têm acesso ao painel mas não gerenciam admins.
          {!isOwner && (
            <span className="block mt-1 text-amber-700">
              Você não é owner — visualização somente.
            </span>
          )}
        </p>
        <AdminsTable
          admins={admins}
          currentUserId={user.id}
          isOwner={isOwner}
        />
      </section>
    </div>
  );
}
