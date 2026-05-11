import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin';
import Header from '@/components/Header';

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
    redirect('/login?redirect=/admin/reservas');
  }

  const admin = await isAdminUser(user.id);
  if (!admin) {
    redirect('/');
  }

  return (
    <>
      <Header />
      <div className="bg-gray-50 border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex gap-6 text-sm">
          <Link
            href="/admin/reservas"
            className="text-gray-700 hover:text-[rgb(9,110,171)] font-medium"
          >
            Reservas
          </Link>
          <Link
            href="/admin/manifesto"
            className="text-gray-700 hover:text-[rgb(9,110,171)] font-medium"
          >
            Manifesto
          </Link>
          <Link
            href="/admin/config"
            className="text-gray-700 hover:text-[rgb(9,110,171)] font-medium"
          >
            Configurações
          </Link>
        </nav>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6">{children}</main>
    </>
  );
}
