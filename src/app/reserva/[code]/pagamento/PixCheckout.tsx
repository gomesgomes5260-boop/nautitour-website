'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
          <p className="text-3xl font-bold" style={{ color: 'rgb(219, 56, 44)' }}>
            {PRICE_FORMATTER.format(totalCents / 100)}
          </p>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="w-full px-6 py-4 text-white text-base font-semibold rounded-full disabled:opacity-50"
          style={{ backgroundColor: 'rgb(9, 110, 171)' }}
        >
          {isPending ? 'Gerando PIX...' : 'Gerar PIX'}
        </button>
        <p className="text-xs text-center text-gray-500">
          O QR code expira em 1 hora. Você poderá copiar o código ou escanear
          com seu app do banco.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pix.qrCodeUrl && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-center">
          {/* qr_code_url is an image returned by Pagar.me */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pix.qrCodeUrl} alt="QR Code PIX" width={240} height={240} />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ou copie o código PIX
        </label>
        <div className="flex gap-2">
          <input
            readOnly
            value={pix.qrCode}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 font-mono text-xs"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 text-sm font-medium rounded-md border-2"
            style={{ color: 'rgb(9, 110, 171)', borderColor: 'rgb(9, 110, 171)' }}
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm">
        Aguardando confirmação do pagamento... A página atualiza automaticamente
        quando recebermos o aviso do banco.
      </div>
    </div>
  );
}
