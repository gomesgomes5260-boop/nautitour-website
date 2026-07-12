import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOwnerUser } from '@/lib/admin';
import ImageLibrary from './ImageLibrary';
import { listSiteImagesAction } from './actions';

export const dynamic = 'force-dynamic';

const INITIAL_FOLDER = '__all__';

export default async function AdminImagensPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/imagens');
  // Gate de admin já vem do layout; aqui só decidimos quem pode gerenciar.
  const canManage = await isOwnerUser(user.id);

  // Pastas já existentes no bucket (entradas sem id = "diretórios")
  const admin = createAdminClient();
  const { data: rootItems } = await admin.storage.from('site-images').list('', { limit: 200 });
  const initialFolders = (rootItems ?? [])
    .filter((item) => item.id == null)
    .map((item) => item.name);

  // Carga inicial server-side — o client só refaz fetch ao trocar de pasta
  // (evita setState em effect, regra react-hooks/set-state-in-effect).
  const initialList = await listSiteImagesAction(INITIAL_FOLDER);
  const initialImages = initialList.ok ? initialList.images : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-charcoal-900)]">Imagens</h1>
        <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
          Biblioteca de imagens do site (blog, capas e galeria), servida pelo
          Supabase Storage com CDN. Clique numa foto pra selecionar; use a barra
          pra excluir ou copiar a URL.
          {!canManage && ' Upload e exclusão são restritos ao admin master.'}
        </p>
      </div>
      <ImageLibrary
        canManage={canManage}
        initialFolders={initialFolders}
        initialFolder={INITIAL_FOLDER}
        initialImages={initialImages}
      />
    </div>
  );
}
