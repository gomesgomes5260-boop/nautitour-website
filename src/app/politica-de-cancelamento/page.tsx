import ContentPage from '@/components/ContentPage';

export const metadata = {
  title: 'Política de Cancelamento',
  description: 'Regras para cancelamento e remarcação de reservas.',
  alternates: { canonical: '/politica-de-cancelamento' },
};

// TODO: confirmar prazos e percentuais com a equipe da Nautitour
export default function CancelamentoPage() {
  return (
    <ContentPage
      title="Política de Cancelamento"
      intro="Última atualização: maio/2026. Esta política é preliminar; os prazos e percentuais devem ser confirmados pela equipe da Nautitour."
    >
      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">1. Cancelamento pelo cliente</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>Até 48h antes da saída: 100% de reembolso</li>
        <li>Entre 48h e 24h antes: 50% de reembolso</li>
        <li>Menos de 24h antes ou no-show: sem reembolso</li>
      </ul>
      <p className="mt-2">
        O reembolso é feito pelo mesmo meio do pagamento e pode levar até 7
        dias úteis para refletir.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">2. Cancelamento por condições climáticas</h2>
      <p>
        Em caso de cancelamento por motivos de segurança (mar agitado, alerta
        meteorológico, exigência da Marinha), oferecemos: (a) remarcação para
        outra data sem custo, ou (b) reembolso integral.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">3. Como cancelar</h2>
      <p>
        Entre em contato pelo WhatsApp informando o código da reserva (formato
        NTT-XXXXXX). Em breve, o cancelamento estará disponível também pela
        área &quot;Minhas reservas&quot; no site.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">4. Locação privativa</h2>
      <p>
        Para locação privativa da escuna, as regras de cancelamento são
        definidas no orçamento personalizado.
      </p>
    </ContentPage>
  );
}
