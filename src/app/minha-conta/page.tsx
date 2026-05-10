import { redirect } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import AccountForm from './AccountForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Minha conta | Nautitour Passeios',
};

export default async function MinhaContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/minha-conta');

  const { data: customer, error } = await supabase
    .from('customers')
    .select('full_name, phone, cpf, email')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="px-[60px] py-12 max-w-2xl mx-auto">
          <div className="flex items-baseline justify-between mb-8 flex-wrap gap-2">
            <h1 className="text-[36px] font-normal" style={{ color: 'rgb(219, 56, 44)' }}>
              Minha conta
            </h1>
            <Link
              href="/minhas-reservas"
              className="text-sm hover:underline"
              style={{ color: 'rgb(9, 110, 171)' }}
            >
              Ver minhas reservas →
            </Link>
          </div>
          <AccountForm
            email={customer?.email ?? user.email ?? ''}
            initialFullName={customer?.full_name ?? ''}
            initialPhone={customer?.phone ?? ''}
            initialCpf={customer?.cpf ?? ''}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
