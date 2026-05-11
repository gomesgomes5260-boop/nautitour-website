import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';
import HeaderClient from './HeaderClient';

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  let isAdmin = false;
  if (user) {
    const [{ data: customer }, adminCheck] = await Promise.all([
      supabase
        .from('customers')
        .select('full_name')
        .eq('auth_user_id', user.id)
        .maybeSingle(),
      isAdminUser(user.id),
    ]);
    name = customer?.full_name ?? (user.user_metadata?.full_name as string | null) ?? null;
    isAdmin = adminCheck;
  }

  return (
    <HeaderClient
      user={user ? { email: user.email ?? null, name } : null}
      isAdmin={isAdmin}
    />
  );
}
