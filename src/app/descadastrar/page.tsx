import Link from 'next/link';
import ContentPage from '@/components/ContentPage';
import { unsubscribeByToken } from '@/lib/marketing-consent';

export const metadata = {
  title: 'Descadastrar e-mails',
  description: 'Cancelar o recebimento de ofertas e novidades da Nautitour por e-mail.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ t?: string | string[] }> };

/**
 * Descadastro de e-mail marketing em 1 clique (link do rodapé dos e-mails
 * promocionais). O token é um UUID por cliente (customers.unsubscribe_token);
 * a RPC é idempotente, então reabrir o link só reconfirma.
 */
export default async function DescadastrarPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = Array.isArray(params.t) ? params.t[0] : params.t;
  const masked = raw ? await unsubscribeByToken(raw) : null;

  return (
    <ContentPage title={masked ? 'Pronto, descadastrado' : 'Link inválido'}>
      {masked ? (
        <>
          <p>
            O e-mail <strong>{masked}</strong> não vai mais receber ofertas e
            novidades da Nautitour.
          </p>
          <p>
            E-mails sobre reservas que você fizer (confirmação, lembrete do
            passeio, alterações) continuam chegando normalmente — eles não são
            marketing.
          </p>
          <p>
            Mudou de ideia? É só marcar a opção de novo na sua próxima reserva.
          </p>
        </>
      ) : (
        <>
          <p>
            Não encontramos esse link de descadastro. Ele pode ter sido copiado
            incompleto.
          </p>
          <p>
            Se quiser parar de receber nossos e-mails, responda a qualquer um
            deles pedindo o descadastro ou fale com a gente pela página de{' '}
            <Link href="/contato" className="text-[var(--color-red-600)] underline-offset-2 hover:underline">
              contato
            </Link>
            .
          </p>
        </>
      )}
      <p className="mt-6">
        <Link href="/" className="text-[var(--color-red-600)] underline-offset-2 hover:underline">
          Voltar pro site
        </Link>
      </p>
    </ContentPage>
  );
}
