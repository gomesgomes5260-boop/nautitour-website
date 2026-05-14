import ContentPage from '@/components/ContentPage';

export const metadata = {
  title: 'Sobre nós | Nautitour Passeios',
  description:
    'Conheça a Nautitour Passeios — empresa de passeios de escuna e lancha privativa em Armação dos Búzios, RJ.',
};

// TODO: substituir os parágrafos por texto definitivo (história real, valores,
// nomes da equipe). O placeholder atual é narrativo o suficiente pra produção
// mas evita números/datas que possam ser imprecisos.
export default function SobreNosPage() {
  return (
    <ContentPage
      title="Sobre a Nautitour"
      intro="Passeios de escuna e lancha privativa em Armação dos Búzios — RJ. Tripulação experiente, embarcações cuidadas, foco em segurança e em uma experiência inesquecível pra família e amigos."
    >
      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        Nossa história
      </h2>
      <p>
        Nascemos em Búzios da paixão pelo mar e pelas ilhas da região. Há
        anos recebemos brasileiros e turistas do mundo todo a bordo dos nossos
        passeios — sempre com atendimento próximo, embarcações cuidadas e o
        compromisso de fazer cada saída valer o dia inteiro.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        Nossa equipe
      </h2>
      <p>
        Capitães credenciados, marinheiros experientes e equipe de atendimento
        em português e espanhol. Treinamento contínuo em segurança e
        primeiros socorros faz parte da nossa rotina.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        O que nos diferencia
      </h2>
      <ul className="list-disc list-inside space-y-1">
        <li>Embarcações em conformidade com as normas da Marinha do Brasil</li>
        <li>Coletes salva-vidas para todos os passageiros</li>
        <li>Bar a bordo com drinks tropicais (opcional)</li>
        <li>Roteiros que privilegiam paradas para banho nas ilhas mais bonitas</li>
        <li>Reserva 100% online, com Pix ou cartão de crédito</li>
      </ul>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">
        Onde nos encontrar
      </h2>
      <p>
        <strong>Píer da Rua das Pedras</strong> (embarque padrão sem taxa
        adicional), Armação dos Búzios — RJ. Saídas alternativas no Porto
        Veleiro e Píer do Pescador, sob consulta. Consulte a página de{' '}
        <a
          href="/contato"
          className="text-[var(--color-red-600)] underline-offset-2 hover:underline"
        >
          contato
        </a>{' '}
        para nossos canais diretos.
      </p>
    </ContentPage>
  );
}
