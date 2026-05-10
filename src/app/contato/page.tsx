import ContentPage from '@/components/ContentPage';

export const metadata = {
  title: 'Contato | Nautitour Passeios',
  description: 'Fale com a Nautitour Passeios — telefone, WhatsApp, e-mail e endereço em Búzios.',
};

const phones = [
  '(22) 99773-4466',
  '(22) 99996-3664',
  '(22) 98805-2238',
  '(22) 99908-7800',
];

export default function ContatoPage() {
  return (
    <ContentPage
      title="Fale conosco"
      intro="Estamos disponíveis por telefone, WhatsApp e e-mail. Para reservas privativas, use também o formulário de locação."
    >
      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">Telefones</h2>
      <ul className="list-disc list-inside">
        {phones.map((p) => (
          <li key={p}>
            <a
              href={`tel:${p.replace(/\D/g, '')}`}
              className="hover:underline"
              style={{ color: 'rgb(9, 110, 171)' }}
            >
              {p}
            </a>
          </li>
        ))}
      </ul>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">E-mail</h2>
      <p>
        <a
          href="mailto:passeiodeescuna.tx@gmail.com"
          className="hover:underline"
          style={{ color: 'rgb(9, 110, 171)' }}
        >
          passeiodeescuna.tx@gmail.com
        </a>
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">Endereço</h2>
      <p>Travessa dos Pescadores, 326 — Búzios/RJ, 28950-000</p>
    </ContentPage>
  );
}
