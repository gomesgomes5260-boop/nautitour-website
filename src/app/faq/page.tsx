import ContentPage from '@/components/ContentPage';
import JsonLd from '@/components/JsonLd';
import { FAQS } from '@/lib/faq-data';
import { faqPageJsonLd } from '@/lib/site-jsonld';

export const metadata = {
  // Sem sufixo — o title.template do layout completa "| Nautitour Passeios".
  title: 'Perguntas Frequentes',
  description: 'Tire suas dúvidas sobre os passeios, reservas, pagamento e cancelamento.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FAQS)} />
      <ContentPage
        title="Perguntas frequentes"
        intro="Reunimos as dúvidas mais comuns. Não encontrou a sua? Fale com a gente pelo WhatsApp."
      >
        <dl>
          {FAQS.map((item) => (
            <div key={item.q} className="border-b border-gray-200 py-4">
              <dt className="font-semibold text-gray-800 mb-1">{item.q}</dt>
              <dd className="text-gray-700">{item.a}</dd>
            </div>
          ))}
        </dl>
      </ContentPage>
    </>
  );
}
