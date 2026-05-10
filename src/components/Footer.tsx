'use client';

import Image from 'next/image';

export function MapSection() {
  return (
    <section className="w-full py-12 px-4 md:px-16 bg-white">
      <h3
        className="text-lg md:text-2xl font-semibold mb-6 text-center"
        style={{ color: 'rgb(9, 110, 171)', fontFamily: 'var(--font-jakarta)' }}
      >
        Venha nos visitar em nosso endere\u00e7o
      </h3>
      <div className="max-w-6xl mx-auto">
        <iframe
          src="https://maps.google.com/maps?q=Tv.%20dos%20Pescadores%2C%20326%20-%20Lot.%20Triangulo%20de%20Buzios&t=&z=15&ie=UTF8&iwloc=&output=embed"
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-lg"
        ></iframe>
      </div>
    </section>
  );
}

export default function Footer() {
  return (
    <footer className="w-full" style={{ backgroundColor: 'rgb(192, 0, 0)' }}>
      <div className="px-4 py-12 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-white">
              <h4 className="text-lg font-semibold mb-4">Institucional</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:opacity-80 transition-opacity">Home</a></li>
                <li><a href="#" className="hover:opacity-80 transition-opacity">Quem somos</a></li>
                <li><a href="#" className="hover:opacity-80 transition-opacity">Politica de Privacidade</a></li>
                <li><a href="#" className="hover:opacity-80 transition-opacity">Politica de Cancelamento</a></li>
              </ul>
            </div>
            <div className="text-white">
              <h4 className="text-lg font-semibold mb-4">Atendimento</h4>
              <ul className="space-y-2">
                <li><a href="tel:+5522999963664" className="hover:opacity-80 transition-opacity">(22) 99996-3664</a></li>
                <li><a href="tel:+5522988052238" className="hover:opacity-80 transition-opacity">(22) 98805-2238</a></li>
                <li><a href="tel:+5522997734466" className="hover:opacity-80 transition-opacity">(22) 99773-4466</a></li>
                <li><a href="tel:+5522999087800" className="hover:opacity-80 transition-opacity">(22) 99908-7800</a></li>
              </ul>
            </div>
            <div className="text-white">
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-4">E-mail</h4>
                <a href="mailto:passeiodeescuna.tx@gmail.com" className="hover:opacity-80 transition-opacity">passeiodeescuna.tx@gmail.com</a>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Endere\u00e7o</h4>
                <p className="text-sm">Travessa dos Pescadores, 326<br />B\u00fazios - RJ, 28950-000</p>
              </div>
            </div>
            <div className="text-white flex justify-center lg:justify-start">
              <Image src="/images/logos/logo-white.png" alt="Nautitour Logo" width={120} height={150} className="h-auto" />
            </div>
          </div>
          <div className="border-t border-white border-opacity-30 pt-8 pb-8">
            <div className="flex justify-center gap-6 mb-8">
              <a href="#" className="text-white hover:opacity-80 transition-opacity" aria-label="Facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a href="#" className="text-white hover:opacity-80 transition-opacity" aria-label="Instagram">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0" /></svg>
              </a>
              <a href="#" className="text-white hover:opacity-80 transition-opacity" aria-label="Youtube">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>
          <div className="text-center text-white text-sm pb-8">
            <p>\u00a92025 Todos os direitos reservados. Nautitour Passeios.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
