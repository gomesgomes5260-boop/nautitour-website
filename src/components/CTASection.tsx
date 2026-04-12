'use client';

export default function CTASection() {
  return (
    <section
      className="w-full py-20 px-4 md:py-[80px] md:px-[80px] text-center"
      style={{
        background: 'linear-gradient(135deg, #096EAB 0%, #075a8c 50%, #064d78 100%)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-white mb-6 md:mb-8"
          style={{ fontSize: '32px', fontWeight: 400 }}
        >
          A Melhor Experi\u00eancia de Passeio de Barco e Escuna em B\u00fazios
        </h2>
        <div className="text-white text-base md:text-lg mb-8 space-y-2">
          <p>Roteiros exclusivos pelas 12 praias mais famosas e 3 ilhas paradis\u00edacas.</p>
          <p>Seguran\u00e7a, divers\u00e3o e o melhor atendimento da Regi\u00e3o dos Lagos.</p>
        </div>
        <button
          className="text-white font-semibold hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: 'rgb(9, 110, 171)',
            borderRadius: '50px',
            padding: '15px 70px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Ver Datas e Reservar Agora
        </button>
      </div>
    </section>
  );
}
