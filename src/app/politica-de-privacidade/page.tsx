import ContentPage from '@/components/ContentPage';

export const metadata = {
  title: 'Política de Privacidade',
  description: 'Como tratamos seus dados pessoais conforme a LGPD.',
  alternates: { canonical: '/politica-de-privacidade' },
};

// TODO: validar redação com assessoria jurídica antes de tratar como versão final.
export default function PrivacidadePage() {
  return (
    <ContentPage
      title="Política de Privacidade"
      intro="Última atualização: maio/2026. Como a Nautitour Passeios trata seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018)."
    >
      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">1. Dados que coletamos</h2>
      <p>
        Quando você reserva um passeio ou solicita um orçamento, coletamos: nome
        completo, e-mail, telefone, CPF (opcional) e dados dos passageiros. Em
        pagamentos online, dados financeiros são processados pelo gateway
        Pagar.me — não armazenamos números de cartão em nossos servidores.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">2. Como usamos seus dados</h2>
      <p>
        Usamos seus dados para confirmar reservas, organizar embarque, enviar
        comunicações relacionadas ao passeio e cumprir obrigações legais.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">3. Compartilhamento</h2>
      <p>
        Não vendemos seus dados. Compartilhamos apenas com prestadores
        necessários para a operação do passeio (gateway de pagamento,
        infraestrutura de hospedagem) e quando exigido por lei.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">4. Seus direitos</h2>
      <p>
        Conforme a LGPD, você pode solicitar acesso, correção, exclusão ou
        portabilidade dos seus dados a qualquer momento entrando em contato
        pelo e-mail listado em nossa página de contato.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">5. Retenção</h2>
      <p>
        Mantemos seus dados pelo tempo necessário para cumprir as finalidades
        descritas e obrigações legais (mínimo de 5 anos para registros fiscais).
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        6. Cookies e tecnologias similares
      </h2>
      <p>
        Usamos três categorias de cookies, conforme detalhado abaixo. Você pode
        rever ou revogar seu consentimento a qualquer momento pela página{' '}
        <a
          href="/cookie-preferences"
          className="text-[var(--color-red-600)] underline-offset-2 hover:underline"
        >
          Preferências de cookies
        </a>
        .
      </p>
      <ul className="list-disc list-inside space-y-1 mt-2">
        <li>
          <strong>Essenciais</strong>: necessários para o funcionamento do site
          (sessão de login, proteção contra fraude, carrinho de reserva).
          Sempre ativos, conforme art. 7º, IX da LGPD (legítimo interesse para
          execução de contrato).
        </li>
        <li>
          <strong>Analíticos</strong>: Google Analytics 4 e Microsoft Clarity.
          Coletam métricas agregadas e anônimas (IP anonimizado) para
          entendermos como melhorar o site. Só carregam se você der
          consentimento.
        </li>
        <li>
          <strong>Marketing</strong>: reservado para futuras integrações de
          remarketing (Meta Pixel, Google Ads). Hoje não utilizamos. Opção
          disponível na página de preferências.
        </li>
      </ul>
      <p className="mt-3">
        Em qualquer momento você pode revogar o consentimento — as preferências
        valem por 6 meses e podem ser revistas a qualquer instante na página de{' '}
        <a
          href="/cookie-preferences"
          className="text-[var(--color-red-600)] underline-offset-2 hover:underline"
        >
          Preferências de cookies
        </a>
        .
      </p>
    </ContentPage>
  );
}
