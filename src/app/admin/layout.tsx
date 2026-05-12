import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';
import AdminSidebar from '@/components/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin/overview');
  }

  const admin = await isAdminUser(user.id);
  if (!admin) {
    redirect('/');
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('full_name')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  const name =
    customer?.full_name ?? (user.user_metadata?.full_name as string | null) ?? null;

  return (
    <div className="min-h-screen bg-[var(--color-charcoal-50)]">
      <AdminSidebar user={{ email: user.email ?? null, name }} />
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 sm:py-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
