import ContentPage from '@/components/ContentPage';

export const metadata = {
  title: 'Termos de Uso | Nautitour Passeios',
  description:
    'Termos de uso do site Nautitour Passeios e condições de contratação dos passeios.',
};

// TODO: revisar com assessoria jurídica antes de divulgar como definitivo.
export default function TermosDeUsoPage() {
  return (
    <ContentPage
      title="Termos de Uso"
      intro="Última atualização: maio/2026. Este documento estabelece as regras gerais de uso do site e de contratação dos passeios oferecidos pela Nautitour. Versão preliminar — sujeita a revisão jurídica."
    >
      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        1. Identificação
      </h2>
      <p>
        A <strong>Nautitour Passeios</strong> é uma empresa especializada em
        passeios de escuna e lancha privativa em Armação dos Búzios — RJ,
        atendendo turistas e moradores. Todo contato comercial pode ser feito
        pelos canais listados na página{' '}
        <a href="/contato" className="text-[var(--color-red-600)] underline-offset-2 hover:underline">
          Contato
        </a>
        .
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        2. Reservas e pagamento
      </h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          A reserva só é considerada confirmada após a confirmação do pagamento
          (Pix ou cartão de crédito).
        </li>
        <li>
          A reserva pendente de pagamento expira em 10 minutos (escuna) ou 24
          horas (lancha privativa convertida pelo admin).
        </li>
        <li>
          Pagamentos são processados pela <strong>Pagar.me</strong>. Não
          armazenamos dados de cartão em nossos servidores.
        </li>
        <li>
          O valor cobrado é o exibido na tela de checkout no momento da
          finalização — sem taxas escondidas. Taxas de embarque informadas em
          alguns píeres são cobradas presencialmente.
        </li>
      </ul>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        3. Embarque e segurança
      </h2>
      <ul className="list-disc list-inside space-y-1">
        <li>
          Os passageiros devem chegar ao píer indicado com pelo menos 30 minutos
          de antecedência.
        </li>
        <li>
          A Nautitour reserva o direito de recusar embarque em caso de
          comportamento perigoso, intoxicação ou desrespeito à equipe.
        </li>
        <li>
          Crianças menores de 12 anos devem estar acompanhadas por responsável
          legal a bordo.
        </li>
        <li>
          Em caso de cancelamento por motivos de segurança (mar agitado, alerta
          meteorológico, exigência da Marinha), aplicam-se as regras da{' '}
          <a
            href="/politica-de-cancelamento"
            className="text-[var(--color-red-600)] underline-offset-2 hover:underline"
          >
            Política de Cancelamento
          </a>
          .
        </li>
      </ul>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        4. Cancelamento e reembolso
      </h2>
      <p>
        Consulte a{' '}
        <a
          href="/politica-de-cancelamento"
          className="text-[var(--color-red-600)] underline-offset-2 hover:underline"
        >
          Política de Cancelamento
        </a>{' '}
        para prazos e percentuais aplicáveis. O cancelamento até 48 horas antes
        da saída pode ser feito pelo próprio cliente em sua conta.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        5. Dados pessoais
      </h2>
      <p>
        O tratamento de dados pessoais (LGPD) está descrito na{' '}
        <a
          href="/politica-de-privacidade"
          className="text-[var(--color-red-600)] underline-offset-2 hover:underline"
        >
          Política de Privacidade
        </a>
        . Ao reservar, você concorda com essa política.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        6. Limitação de responsabilidade
      </h2>
      <p>
        A Nautitour não se responsabiliza por objetos pessoais perdidos a
        bordo, mal-estar causado por condições do mar, ou alterações de
        itinerário decorrentes de causas externas (clima, ordem da Marinha,
        força maior).
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        7. Alterações destes termos
      </h2>
      <p>
        Estes termos podem ser atualizados a qualquer momento. A versão vigente
        é sempre a publicada nesta página com a data &quot;Última
        atualização&quot;. O uso continuado do site implica aceitação dos
        termos vigentes.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        8. Foro
      </h2>
      <p>
        Fica eleito o foro da Comarca de Armação dos Búzios — RJ para dirimir
        quaisquer controvérsias decorrentes da aplicação destes termos.
      </p>
    </ContentPage>
  );
}
