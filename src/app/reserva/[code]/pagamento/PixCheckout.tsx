'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Clock } from 'lucide-react';
import { createPixForBookingAction } from './actions';

type Props = {
  bookingCode: string;
  totalCents: number;
};

const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function PixCheckout({ bookingCode, totalCents }: Props) {
  const router = useRouter();
  const [pix, setPix] = useState<{
    qrCode: string;
    qrCodeUrl?: string;
    expiresAt?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createPixForBookingAction(bookingCode);
      if (!result.ok) setError(result.error);
      else setPix(result);
    });
  };

  // Poll booking status every 5s once a PIX is generated; redirect to the
  // confirmation page when the webhook flips status to 'confirmed'.
  useEffect(() => {
    if (!pix) return;
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [pix, router]);

  const handleCopy = async () => {
    if (!pix?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!pix) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--color-charcoal-900)] text-white p-6 sm:p-8">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60 mb-2">
            Total a pagar
          </p>
          <p className="font-sans text-3xl sm:text-4xl font-black text-[var(--color-red-300)] leading-none">
            {PRICE_FORMATTER.format(totalCents / 100)}
          </p>
        </div>
        {error && (
          <div className="rounded-xl bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] p-3 text-sm">
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="w-full px-6 py-4 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-base font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[var(--shadow-2)]"
        >
          {isPending ? 'Gerando PIX...' : 'Gerar PIX'}
        </button>
        <p className="text-xs text-center text-[var(--color-charcoal-500)]">
          O QR code expira em 1 hora. Você poderá copiar o código ou escanear
          com seu app do banco.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pix.qrCodeUrl && (
        <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 flex justify-center">
          {/* qr_code_url is an image returned by Pagar.me */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pix.qrCodeUrl} alt="QR Code PIX" width={240} height={240} />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          Ou copie o código PIX
        </label>
        <div className="flex gap-2">
          <input
            readOnly
            value={pix.qrCode}
            className="flex-1 border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2.5 font-mono text-xs text-[var(--color-charcoal-700)] bg-white"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--color-red-600)] text-[var(--color-red-600)] hover:bg-[var(--color-red-50)] transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-4 flex items-start gap-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-red-50)] text-[var(--color-red-600)] shrink-0">
          <Clock size={16} />
        </span>
        <p className="text-sm text-[var(--color-charcoal-700)] leading-relaxed">
          Aguardando confirmação do pagamento. A página atualiza automaticamente
          quando recebermos o aviso do banco.
        </p>
      </div>
    </div>
  );
}
