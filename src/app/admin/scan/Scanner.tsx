'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Camera, CheckCircle2, XCircle, RotateCcw, Keyboard } from 'lucide-react';
import type { Html5Qrcode } from 'html5-qrcode';
import { lookupBookingAction, checkInBookingAction, type ScannedBooking } from './actions';

type ScanState = 'idle' | 'scanning' | 'loading' | 'found' | 'success' | 'already' | 'error';

const PRICE = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  completed: 'Já embarcou',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
  pending_payment: 'Não paga',
};

export default function Scanner() {
  const [state, setState] = useState<ScanState>('idle');
  const [booking, setBooking] = useState<ScannedBooking | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [pending, startTransition] = useTransition();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // scanner já parado
      }
      scannerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  function lookup(code: string) {
    setState('loading');
    startTransition(async () => {
      const res = await lookupBookingAction(code);
      if (!res.ok) {
        setErrorMsg(res.error);
        setState('error');
        return;
      }
      setBooking(res.booking);
      setState('found');
    });
  }

  async function startScanner() {
    setErrorMsg('');
    setState('scanning');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          void stopScanner().then(() => lookup(decodedText.trim()));
        },
        () => {}
      );
    } catch {
      setState('error');
      setErrorMsg('Não foi possível acessar a câmera. Verifique as permissões ou use o código manual.');
    }
  }

  function confirmCheckIn() {
    if (!booking) return;
    startTransition(async () => {
      const res = await checkInBookingAction(booking.bookingCode);
      if (!res.ok) {
        setErrorMsg(res.error);
        setState('error');
        return;
      }
      setState(res.firstCheckin ? 'success' : 'already');
    });
  }

  async function reset() {
    await stopScanner();
    setBooking(null);
    setErrorMsg('');
    setManualCode('');
    setState('idle');
  }

  return (
    <div className="max-w-md mx-auto">
      {state === 'idle' && (
        <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-charcoal-50)] flex items-center justify-center mx-auto mb-5">
            <Camera size={34} className="text-[var(--color-charcoal-700)]" />
          </div>
          <p className="text-sm text-[var(--color-charcoal-500)] mb-6">
            Aponte a câmera pro QR code do ticket do cliente pra confirmar o embarque.
          </p>
          <button
            type="button"
            onClick={startScanner}
            className="w-full rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-3 hover:bg-[var(--color-red-700)] transition-colors"
          >
            Iniciar scanner
          </button>

          <div className="mt-6 pt-5 border-t border-[var(--color-charcoal-100)]">
            <label className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-charcoal-500)] mb-2">
              <Keyboard size={13} /> Ou digite o código
            </label>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="NTT-XXXXXX"
                className="flex-1 border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-[var(--color-red-600)]"
              />
              <button
                type="button"
                onClick={() => manualCode.trim() && lookup(manualCode)}
                disabled={!manualCode.trim() || pending}
                className="rounded-lg border border-[var(--color-charcoal-200)] px-4 text-sm font-semibold text-[var(--color-charcoal-700)] hover:bg-[var(--color-charcoal-50)] disabled:opacity-50"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
      )}

      {state === 'scanning' && (
        <div className="space-y-4">
          <div id="qr-reader" className="rounded-2xl overflow-hidden border border-[var(--color-charcoal-100)]" />
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl border border-[var(--color-charcoal-200)] text-sm font-semibold text-[var(--color-charcoal-700)] py-3 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}

      {state === 'loading' && (
        <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-12 text-center">
          <div className="w-10 h-10 border-4 border-[var(--color-red-600)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[var(--color-charcoal-500)]">Buscando reserva…</p>
        </div>
      )}

      {state === 'found' && booking && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white overflow-hidden">
            <div className="bg-[var(--color-charcoal-900)] text-white text-center py-4">
              <p className="font-mono text-2xl font-bold">{booking.bookingCode}</p>
            </div>
            <dl className="p-5 space-y-2.5 text-sm">
              <Row label="Status">
                <span
                  className={
                    booking.status === 'confirmed'
                      ? 'text-emerald-700 font-semibold'
                      : booking.status === 'completed'
                        ? 'text-sky-700 font-semibold'
                        : 'text-[var(--color-red-700)] font-semibold'
                  }
                >
                  {STATUS_LABEL[booking.status] ?? booking.status}
                </span>
              </Row>
              {booking.customerName && <Row label="Cliente">{booking.customerName}</Row>}
              {booking.departureAt && (
                <Row label="Saída">{DATE_TIME.format(new Date(booking.departureAt))}</Row>
              )}
              <Row label="Passageiros">
                {booking.passengerCount}
                {booking.childCount > 0 && ` (${booking.childCount} meia)`}
              </Row>
              {booking.sellerName && <Row label="Vendedor">{booking.sellerName}</Row>}
              {booking.totalCents - booking.paidCents > 0 && (
                <Row label="Falta pagar">
                  <span className="text-[var(--color-red-600)] font-bold">
                    {PRICE.format((booking.totalCents - booking.paidCents) / 100)}
                  </span>
                </Row>
              )}
              {booking.needsPickup && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2.5">
                  Pickup: {booking.pickupAddress}
                  {booking.pickupRoom && ` · quarto ${booking.pickupRoom}`}
                </div>
              )}
            </dl>
          </div>

          {booking.status === 'confirmed' ? (
            <button
              type="button"
              onClick={confirmCheckIn}
              disabled={pending}
              className="w-full rounded-xl bg-emerald-600 text-white text-sm font-semibold py-3 hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {pending ? 'Confirmando…' : 'Confirmar embarque'}
            </button>
          ) : booking.status === 'completed' ? (
            <div className="rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-center text-sm font-semibold p-4">
              Embarque já confirmado anteriormente.
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] text-center text-sm font-semibold p-4">
              Embarque não permitido para esta reserva.
            </div>
          )}

          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl border border-[var(--color-charcoal-200)] text-sm font-semibold text-[var(--color-charcoal-700)] py-3 hover:bg-white transition-colors"
          >
            Escanear outro
          </button>
        </div>
      )}

      {(state === 'success' || state === 'already') && (
        <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-10 text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
              state === 'success' ? 'bg-emerald-50' : 'bg-sky-50'
            }`}
          >
            <CheckCircle2
              size={42}
              className={state === 'success' ? 'text-emerald-600' : 'text-sky-600'}
            />
          </div>
          <h2
            className={`text-lg font-bold mb-1 ${
              state === 'success' ? 'text-emerald-700' : 'text-sky-700'
            }`}
          >
            {state === 'success' ? 'Embarque confirmado!' : 'Já estava embarcado'}
          </h2>
          <p className="text-sm text-[var(--color-charcoal-500)] mb-8">
            {booking?.customerName ?? ''} — {booking?.bookingCode}
          </p>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-3 hover:bg-[var(--color-red-700)] transition-colors inline-flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Escanear próximo
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-red-50)] flex items-center justify-center mx-auto mb-5">
            <XCircle size={42} className="text-[var(--color-red-600)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-red-700)] mb-1">Erro</h2>
          <p className="text-sm text-[var(--color-charcoal-500)] mb-8">{errorMsg}</p>
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-3 hover:bg-[var(--color-red-700)] transition-colors inline-flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--color-charcoal-500)]">{label}</dt>
      <dd className="text-right font-medium text-[var(--color-charcoal-900)]">{children}</dd>
    </div>
  );
}
