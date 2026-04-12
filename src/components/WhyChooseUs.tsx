'use client';

import Image from 'next/image';

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    icon: '/images/icons/tripulacao.svg',
    title: 'Seguran\u00e7a Certificada e Tripula\u00e7\u00e3o Treinada',
    description: 'Sua paz de esp\u00edrito \u00e9 nossa prioridade. Nossas embarca\u00e7\u00f5es seguem rigorosamente as normas da Marinha, com coletes para todos e marinheiros experientes prontos para garantir um passeio 100% seguro.',
  },
  {
    icon: '/images/icons/drinks.svg',
    title: 'Bar a Bordo com Drinks Tropicais',
    description: 'Relaxe enquanto preparamos as melhores caipirinhas e petiscos frescos na hora. Oferecemos um servi\u00e7o de bar completo (opcional) para que voc\u00ea s\u00f3 se preocupe em brindar \u00e0 vida com a vista perfeita.',
  },
  {
    icon: '/images/icons/bilingue.svg',
    title: 'Guias Bil\u00edngues e Hist\u00f3rias Locais',
    description: 'Recebemos turistas do mundo todo com a mesma hospitalidade calorosa. Nossa equipe fala Portugu\u00eas e Espanhol, garantindo que ningu\u00e9m perca os detalhes, curiosidades e a divers\u00e3o do roteiro.',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-white px-[60px] py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-4 font-['Plus Jakarta Sans'] text-[41px] font-normal" style={{ color: 'rgb(219, 56, 44)' }}>
          Por que escolher a Nautitour Passeios?
        </h2>
        <p className="mb-12 text-gray-700 leading-relaxed">
          Seguran\u00e7a, divers\u00e3o e estrutura completa para voc\u00ea relaxar e transformar seu passeio na melhor mem\u00f3ria da sua viagem.
        </p>
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center">
                <Image src={feature.icon} alt={feature.title} width={80} height={80} priority />
              </div>
              <h3 className="mb-4 text-lg font-bold text-gray-800">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        <h3 className="mb-8 text-center text-2xl font-bold text-gray-800">O que nossos clientes dizem:</h3>
        <div className="mt-12 border-t border-gray-200 pt-12">
          <p className="mb-8 text-center text-gray-700 font-semibold">Somos certificados pelos principais \u00f3rg\u00e3os reguladores.</p>
          <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
            <div className="flex items-center justify-center">
              <Image src="/images/cert-buzios.png" alt="Certifica\u00e7\u00e3o B\u00fazios" width={150} height={150} />
            </div>
            <div className="flex items-center justify-center">
              <Image src="/images/cert-cadastur.png" alt="Certifica\u00e7\u00e3o CADASTUR" width={150} height={150} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
