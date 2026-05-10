import ContentPage from '@/components/ContentPage';

export const metadata = {
  title: 'Perguntas Frequentes | Nautitour Passeios',
  description: 'Tire suas dúvidas sobre os passeios, reservas, pagamento e cancelamento.',
};

// TODO: revisar lista com a equipe da Nautitour
const faqs: Array<{ q: string; a: string }> = [
  {
    q: 'Como faço uma reserva?',
    a: 'Pelo site, escolha o passeio (Escuna ou Lancha), selecione a data e clique em Reservar. Você pode reservar como visitante ou criar uma conta.',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'PIX e cartão de crédito (em breve). Para locação privativa, o pagamento é combinado diretamente com o representante.',
  },
  {
    q: 'Quanto tempo dura cada passeio?',
    a: 'A escuna pública dura cerca de 5 horas. A lancha privativa é vendida em pacotes de 3 horas. A locação privativa da escuna tem duração mínima de 3 horas, definida por você.',
  },
  {
    q: 'O que acontece em caso de chuva ou mar agitado?',
    a: 'Por segurança, podemos cancelar o passeio. Nesses casos, oferecemos remarcação ou reembolso integral.',
  },
  {
    q: 'Crianças pagam?',
    a: 'Marque a opção “criança” no formulário de reserva para que o atendimento entre em contato com as condições aplicáveis.',
  },
  {
    q: 'Posso cancelar a reserva?',
    a: 'Sim. Consulte nossa Política de Cancelamento para conhecer prazos e regras de reembolso.',
  },
];

export default function FaqPage() {
  return (
    <ContentPage
      title="Perguntas frequentes"
      intro="Reunimos as dúvidas mais comuns. Não encontrou a sua? Fale com a gente pelo WhatsApp."
    >
      <dl>
        {faqs.map((item) => (
          <div key={item.q} className="border-b border-gray-200 py-4">
            <dt className="font-semibold text-gray-800 mb-1">{item.q}</dt>
            <dd className="text-gray-700">{item.a}</dd>
          </div>
        ))}
      </dl>
    </ContentPage>
  );
}
