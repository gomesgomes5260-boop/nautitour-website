'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin';
import type { Database } from '@/lib/supabase/database.types';

type SellerUpdate = Database['public']['Tables']['sellers']['Update'];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/vendedores');
  if (!(await isAdminUser(user.id))) {
    throw new Error('Sem permissão');
  }
  return user;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function assertActiveAgency(agencyId: string): Promise<string | null> {
  const c = createAdminClient();
  const { data } = await c
    .from('sellers')
    .select('id, role, active')
    .eq('id', agencyId)
    .maybeSingle();
  if (!data || data.role !== 'agency' || !data.active) {
    return 'Agência inválida ou inativa';
  }
  return null;
}

export async function createSellerAction(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string | null;
  role: 'agency' | 'seller';
  agencyId: string | null;
  netoValueCents: number;
  pixKey: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'E-mail inválido' };
  if (input.password.length < 8) {
    return { ok: false, error: 'Senha precisa de pelo menos 8 caracteres' };
  }
  if (fullName.length < 3) return { ok: false, error: 'Nome muito curto' };
  if (input.role !== 'agency' && input.role !== 'seller') {
    return { ok: false, error: 'Tipo inválido' };
  }
  if (!Number.isInteger(input.netoValueCents) || input.netoValueCents < 0) {
    return { ok: false, error: 'Valor neto inválido' };
  }
  const agencyId = input.role === 'agency' ? null : input.agencyId || null;
  if (agencyId) {
    const agencyErr = await assertActiveAgency(agencyId);
    if (agencyErr) return { ok: false, error: agencyErr };
  }

  await requireAdmin();
  const c = createAdminClient();

  // Cria a conta de auth com senha temporária definida pelo admin.
  // O vendedor troca depois via /esqueci-senha se quiser.
  const { data: created, error: authErr } = await c.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (authErr || !created?.user) {
    console.error('[createSellerAction] auth error', authErr);
    const msg = authErr?.message?.includes('already')
      ? 'Este e-mail já tem conta no site. Vincular conta existente a vendedor ainda não é suportado — use outro e-mail.'
      : (authErr?.message ?? 'Falha ao criar usuário');
    return { ok: false, error: msg };
  }

  const { data: seller, error: insErr } = await c
    .from('sellers')
    .insert({
      user_id: created.user.id,
      role: input.role,
      agency_id: agencyId,
      full_name: fullName,
      phone: input.phone?.trim() || null,
      neto_value_cents: input.netoValueCents,
      pix_key: input.pixKey?.trim() || null,
    })
    .select('id')
    .single();
  if (insErr || !seller) {
    console.error('[createSellerAction] insert error', insErr);
    // Sem seller, a conta de auth criada agora ficaria órfã — desfaz.
    await c.auth.admin.deleteUser(created.user.id).catch((e) => {
      console.error('[createSellerAction] rollback deleteUser failed', e);
    });
    return { ok: false, error: insErr?.message ?? 'Falha ao criar vendedor' };
  }

  revalidatePath('/admin/vendedores');
  return { ok: true, id: seller.id };
}

export async function updateSellerAction(input: {
  id: string;
  fullName?: string;
  phone?: string | null;
  agencyId?: string | null;
  netoValueCents?: number;
  pixKey?: string | null;
  active?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.id) return { ok: false, error: 'Vendedor inválido' };

  await requireAdmin();
  const c = createAdminClient();

  const { data: current } = await c
    .from('sellers')
    .select('id, role')
    .eq('id', input.id)
    .maybeSingle();
  if (!current) return { ok: false, error: 'Vendedor não encontrado' };

  const patch: SellerUpdate = { updated_at: new Date().toISOString() };

  if (input.fullName !== undefined) {
    const name = input.fullName.trim();
    if (name.length < 3) return { ok: false, error: 'Nome muito curto' };
    patch.full_name = name;
  }
  if (input.phone !== undefined) patch.phone = input.phone?.trim() || null;
  if (input.pixKey !== undefined) patch.pix_key = input.pixKey?.trim() || null;
  if (input.active !== undefined) patch.active = input.active;
  if (input.netoValueCents !== undefined) {
    if (!Number.isInteger(input.netoValueCents) || input.netoValueCents < 0) {
      return { ok: false, error: 'Valor neto inválido' };
    }
    patch.neto_value_cents = input.netoValueCents;
  }
  if (input.agencyId !== undefined) {
    if (current.role === 'agency' && input.agencyId) {
      return { ok: false, error: 'Agência não pode pertencer a outra agência' };
    }
    if (input.agencyId) {
      if (input.agencyId === input.id) {
        return { ok: false, error: 'Vendedor não pode ser a própria agência' };
      }
      const agencyErr = await assertActiveAgency(input.agencyId);
      if (agencyErr) return { ok: false, error: agencyErr };
    }
    patch.agency_id = input.agencyId || null;
  }

  const { error } = await c.from('sellers').update(patch).eq('id', input.id);
  if (error) {
    console.error('[updateSellerAction]', error);
    return { ok: false, error: error.message };
  }

  revalidatePath('/admin/vendedores');
  revalidatePath(`/admin/vendedores/${input.id}`);
  return { ok: true };
}
