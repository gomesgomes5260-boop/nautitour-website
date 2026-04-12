'use client';

import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="w-full bg-white">
      <div className="px-[60px] max-w-7xl mx-auto py-12">
        <div className="mb-12 text-center">
          <h1
            className="font-[family-name:var(--font-plus-jakarta-sans)] text-[41px] font-normal leading-[49.2px] mb-4"
            style={{ color: 'rgb(219, 56, 44)' }}
          >
            O Passeio de Barco mais Procurado em B\u00fazios
          </h1>
          <p className="text-[26px]" style={{ color: 'rgb(9, 110, 171)' }}>
            Tenha uma experi\u00eancia inesquec\u00edvel com a Fam\u00edlia e Amigos com a Nautitour Passeios.
          </p>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          <div className="flex-1">
            <div className="relative w-full h-[300px] md:h-[400px] mb-6 rounded-lg overflow-hidden">
              <Image src="/images/escuna-tour.jpg" alt="Passeio de Escuna em B\u00fazios" fill className="object-cover" priority />
            </div>
            <h2 className="text-[24px] font-bold mb-4" style={{ color: 'rgb(219, 56, 44)' }}>
              Passeio de Escuna em B\u00fazios
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Explore as 12 praias mais famosas e ilhas paradis\u00edacas em um roteiro cl\u00e1ssico e divertido, com paradas para mergulho e bar a bordo.
            </p>
            <p className="text-xs font-semibold text-gray-600 mb-6">DE R$70,00 | POR APENAS R$60,00</p>
            <div className="flex gap-4 flex-col sm:flex-row">
              <button className="px-[30px] py-[20px] bg-white border-2 text-sm font-medium rounded-full" style={{ color: 'rgb(9, 110, 171)', borderColor: 'rgb(9, 110, 171)' }}>Mais detalhes</button>
              <button className="px-[30px] py-[20px] text-white text-sm font-medium rounded-full" style={{ backgroundColor: 'rgb(9, 110, 171)' }}>Comprar Agora</button>
            </div>
          </div>

          <div className="flex-1">
            <div className="relative w-full h-[300px] md:h-[400px] mb-6 rounded-lg overflow-hidden">
              <Image src="/images/lancha-tour.jpg" alt="Passeio de Lancha (Meia Di\u00e1ria 3hs)" fill className="object-cover" priority />
            </div>
            <h2 className="text-[24px] font-bold mb-4" style={{ color: 'rgb(219, 56, 44)' }}>
              Passeio de Lancha (Meia Di\u00e1ria 3hs)
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Desfrute de total exclusividade e liberdade criando seu pr\u00f3prio roteiro pelas \u00e1guas cristalinas de B\u00fazios com conforto VIP.
            </p>
            <p className="text-xs font-semibold text-gray-600 mb-6">A PARTIR DE: R$1.200</p>
            <div className="flex gap-4 flex-col sm:flex-row">
              <button className="px-[30px] py-[20px] bg-white border-2 text-sm font-medium rounded-full" style={{ color: 'rgb(9, 110, 171)', borderColor: 'rgb(9, 110, 171)' }}>Mais detalhes</button>
              <button className="px-[30px] py-[20px] text-white text-sm font-medium rounded-full" style={{ backgroundColor: 'rgb(9, 110, 171)' }}>Comprar Agora</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
