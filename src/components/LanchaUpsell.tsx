import Image from 'next/image';
import Container from '@/components/Container';
import WhatsAppLeadLink from '@/components/WhatsAppLeadLink';

// Foto real da lancha (mesma do herói de /passeio-lancha, bucket site-images).
// Host já liberado em next.config remotePatterns.
const LANCHA_COVER =
  'https://hpinfkvfzezuizmeqsfm.supabase.co/storage/v1/object/public/site-images/misc/seq-0002-f334831e.webp';

// Cross-sell na página da escuna: quem chega pelo passeio em grupo (mais
// barato) e quer algo exclusivo é convidado a fechar a LANCHA PRIVATIVA — que
// só fecha por WhatsApp. O CTA usa WhatsAppLeadLink com origem 'escuna-lancha'
// pra medir esse funil separado + disparar a conversão de WhatsApp do Ads
// (via WhatsAppClickTracker global). Mensagem da origem em /api/wa/route.ts.
export default function LanchaUpsell() {
  return (
    <section className="pb-12 sm:pb-16 md:pb-20">
      <Container>
        <div
          className="relative grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl shadow-[var(--shadow-3)]"
          style={{ background: 'var(--gradient-iron)' }}
        >
          {/* Foto */}
          <div className="relative min-h-[240px] md:min-h-full">
            <span className="absolute top-4 left-4 z-10 rounded-full bg-[var(--color-red-600)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
              Exclusivo
            </span>
            <Image
              src={LANCHA_COVER}
              alt="Lancha privativa em Búzios"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>

          {/* Conteúdo */}
          <div className="p-8 sm:p-10 lg:p-12">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-red-300)]">
              Quer algo mais exclusivo?
            </span>
            <h2
              className="font-display text-white font-semibold tracking-tight mt-3"
              style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.35rem)', lineHeight: '1.1' }}
            >
              Só o seu grupo a bordo. Faça de lancha privativa.
            </h2>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed mt-4 max-w-md">
              Sem dividir o barco com ninguém: roteiro sob medida, saída no
              horário que você quiser e o ritmo do seu grupo. Capitão e
              tripulação inclusos.
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              {['Capitão incluso', 'Roteiro sob medida', 'Cadastur & Marinha'].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white/90"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>

            <p className="text-white text-sm sm:text-base mt-5">
              A partir de{' '}
              <strong className="text-[var(--color-red-300)] text-lg">R$ 1.200</strong>{' '}
              pelo barco
            </p>

            <WhatsAppLeadLink
              href="/api/wa?s=escuna-lancha"
              source="escuna-lancha"
              className="inline-flex items-center gap-2.5 mt-6 rounded-full bg-[#25D366] px-6 py-3.5 font-sans text-sm sm:text-base font-bold text-[#08301d] shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="w-5 h-5 fill-current">
                <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 01-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 01-1.44-5.01c0-5.18 4.22-9.4 9.41-9.4 2.51 0 4.87.98 6.64 2.76a9.34 9.34 0 012.75 6.65c0 5.18-4.22 9.4-9.4 9.4zm5.5-14.9A11.06 11.06 0 0012.05 3.5C6.16 3.5 1.37 8.29 1.37 14.18c0 1.88.49 3.72 1.43 5.34L1.28 25l5.6-1.47a10.65 10.65 0 005.16 1.32h.01c5.89 0 10.68-4.79 10.68-10.68 0-2.85-1.11-5.53-3.13-7.55z" />
              </svg>
              Consultar lancha no WhatsApp
            </WhatsAppLeadLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
