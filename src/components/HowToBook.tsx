'use client';

import Image from 'next/image';

interface BookingCard {
  icon: string;
  title: string;
  description: string;
}

const bookingCards: BookingCard[] = [
  {
    icon: '/images/icons/escolha.svg',
    title: 'F\u00e1cil de escolher seu passeio',
    description: 'Decida em 1 minuto: Navegue pelo nosso site e escolha entre a anima\u00e7\u00e3o do Passeio de Escuna ou a exclusividade da Lancha Privativa. Tudo claro e sem letras mi\u00fadas.',
  },
  {
    icon: '/images/icons/pague.svg',
    title: 'F\u00e1cil de pagar',
    description: 'Reserva flex\u00edvel: Garanta sua vaga direto pelo site ou chame no WhatsApp. Aceitamos PIX, Cart\u00e3o de Cr\u00e9dito, reserve seu passeio com tranquilidade.',
  },
  {
    icon: '/images/icons/embarque.svg',
    title: 'F\u00e1cil de embarcar',
    description: 'Sem filas ou estresse: Nossa equipe te recebe na nossa loja com lista digital. \u00c9 s\u00f3 chegar, apresentar o voucher no celular e come\u00e7ar a navegar.',
  },
];

export default function HowToBook() {
  return (
    <section className="bg-white px-[60px] py-16">
      <div className="mx-auto max-w-7xl">
        <h2
          className="mb-12 text-center font-['Plus Jakarta Sans'] text-[57px] font-normal"
          style={{ color: 'rgb(9, 110, 171)' }}
        >
          Reservar o seu Passeio de Escuna \u00e9 F\u00e1cil e R\u00e1pido!
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {bookingCards.map((card, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center">
                <Image src={card.icon} alt={card.title} width={80} height={80} priority />
              </div>
              <h3 className="mb-4 text-lg font-bold text-gray-800">{card.title}</h3>
              <p className="text-gray-600 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
