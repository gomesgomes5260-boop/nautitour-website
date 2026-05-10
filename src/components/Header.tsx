import { createClient } from '@/lib/supabase/server';
import HeaderClient from './HeaderClient';

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  if (user) {
    const { data: customer } = await supabase
      .from('customers')
      .select('full_name')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    name = customer?.full_name ?? (user.user_metadata?.full_name as string | null) ?? null;
  }

  return (
    <HeaderClient
      user={user ? { email: user.email ?? null, name } : null}
    />
  );
}
