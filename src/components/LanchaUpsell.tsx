import Image from 'next/image';
import Container from '@/components/Container';
import WhatsAppLeadLink from '@/components/WhatsAppLeadLink';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { LANCHA_PRICE_FROM } from '@/lib/pricing';

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
              <strong className="text-[var(--color-red-300)] text-lg">{LANCHA_PRICE_FROM}</strong>{' '}
              pelo barco
            </p>

            <WhatsAppLeadLink
              href="/api/wa?s=escuna-lancha"
              source="escuna-lancha"
              className="inline-flex items-center gap-2.5 mt-6 rounded-full bg-[#25D366] px-6 py-3.5 font-sans text-sm sm:text-base font-bold text-[#08301d] shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Consultar lancha no WhatsApp
            </WhatsAppLeadLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
