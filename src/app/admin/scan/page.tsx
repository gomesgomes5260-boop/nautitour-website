import Scanner from './Scanner';

export const dynamic = 'force-dynamic';

export default function AdminScanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-charcoal-900)]">Check-in de embarque</h1>
        <p className="text-sm text-[var(--color-charcoal-500)] mt-1">
          Escaneie o QR do ticket (ou digite o código da reserva) pra confirmar
          o embarque. O check-in registra a comissão do vendedor, quando houver
          (pagamento manual em Comissões).
        </p>
      </div>
      <Scanner />
    </div>
  );
}
