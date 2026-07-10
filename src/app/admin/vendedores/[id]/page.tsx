import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import EditSellerForm, { type SellerForEdit } from './EditSellerForm';

export const dynamic = 'force-dynamic';

export default async function AdminVendedorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
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

      <EditSellerForm
        seller={seller as SellerForEdit}
        agencies={agencies ?? []}
      />
    </div>
  );
}
