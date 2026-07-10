import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSellerForUser } from '@/lib/staff';
import Logo from '@/components/Logo';
import Container from '@/components/Container';

export const metadata: Metadata = {
  title: 'Painel do vendedor — Nautitour',
  robots: { index: false, follow: false },
};

export default async function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/vendedor');

  const seller = await getSellerForUser(user.id);
  if (!seller) redirect('/');

  return (
    <div className="min-h-screen bg-[var(--color-charcoal-50)]">
      <header className="bg-[var(--color-charcoal-900)] text-white">
        <Container className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Logo size="sm" variant="white" href="/vendedor" />
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/vendedor" className="text-white/80 hover:text-white font-medium">
                Painel
              </Link>
              <Link href="/vendedor/reservas" className="text-white/80 hover:text-white font-medium">
                Reservas
              </Link>
              <Link
                href="/vendedor/reservas/nova"
                className="rounded-full bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white font-semibold px-4 py-1.5 transition-colors"
              >
                Nova reserva
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-white/70">
              {seller.full_name.split(' ')[0]}
              {seller.role === 'agency' && (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-white/50">
                  Agência
                </span>
              )}
            </span>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                aria-label="Sair"
                className="p-1.5 text-white/60 hover:text-white"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </Container>
      </header>
      <Container as="main" className="py-8">
        {children}
      </Container>
    </div>
  );
}
