'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSellerAction } from '../actions';

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

const labelClass =
  'block text-xs font-semibold text-[var(--color-charcoal-500)] mb-1';

export type SellerForEdit = {
  id: string;
  role: 'agency' | 'seller';
  agency_id: string | null;
  full_name: string;
  phone: string | null;
  neto_value_cents: number;
  pix_key: string | null;
  active: boolean;
};

export default function EditSellerForm({
  seller,
  agencies,
}: {
  seller: SellerForEdit;
  agencies: Array<{ id: string; full_name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [fullName, setFullName] = useState(seller.full_name);
  const [phone, setPhone] = useState(seller.phone ?? '');
  const [agencyId, setAgencyId] = useState(seller.agency_id ?? '');
  const [netoBRL, setNetoBRL] = useState(
    (seller.neto_value_cents / 100).toFixed(2).replace('.', ',')
  );
  const [pixKey, setPixKey] = useState(seller.pix_key ?? '');

  function save() {
    setErr(null);
    setOk(null);
    const netoValueCents = Math.round((Number(netoBRL.replace(',', '.')) || 0) * 100);
    startTransition(async () => {
      const res = await updateSellerAction({
        id: seller.id,
        fullName,
        phone: phone || null,
        agencyId: seller.role === 'seller' ? agencyId || null : undefined,
        netoValueCents,
        pixKey: pixKey || null,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk('Alterações salvas.');
      router.refresh();
    });
  }

  function toggleActive() {
    const verb = seller.active ? 'Desativar' : 'Reativar';
    if (!confirm(`${verb} ${seller.full_name}? ${seller.active ? 'Ele perde o acesso ao painel de vendedor.' : ''}`)) {
      return;
    }
    setErr(null);
    setOk(null);
    startTransition(async () => {
      const res = await updateSellerAction({ id: seller.id, active: !seller.active });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(seller.active ? 'Vendedor desativado.' : 'Vendedor reativado.');
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nome completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Telefone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
        {seller.role === 'seller' && (
          <div>
            <label className={labelClass}>Agência</label>
            <select
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              className={inputClass}
            >
              <option value="">Independente</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={labelClass}>Neto por inteira (R$)</label>
          <input
            inputMode="decimal"
            value={netoBRL}
            onChange={(e) => setNetoBRL(e.target.value)}
            className={inputClass}
          />
          <p className="text-[11px] text-[var(--color-charcoal-400)] mt-1">
            Valor devido à empresa por passageiro inteira. Meia paga metade.
            Comissão do vendedor = total da venda − neto.
          </p>
        </div>
        <div>
          <label className={labelClass}>Chave PIX (comissão)</label>
          <input
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-[var(--color-charcoal-100)]">
        <button
          type="button"
          onClick={save}
          disabled={pending || fullName.trim().length < 3}
          className="rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-2.5 px-5 hover:bg-[var(--color-red-700)] transition-colors disabled:opacity-50"
        >
          {pending ? 'Salvando…' : 'Salvar alterações'}
        </button>
        <button
          type="button"
          onClick={toggleActive}
          disabled={pending}
          className={`text-sm font-semibold ${
            seller.active
              ? 'text-[var(--color-red-600)] hover:underline'
              : 'text-emerald-700 hover:underline'
          }`}
        >
          {seller.active ? 'Desativar vendedor' : 'Reativar vendedor'}
        </button>
      </div>

      {err && <p className="text-sm text-[var(--color-red-700)] mt-3">{err}</p>}
      {ok && <p className="text-sm text-emerald-700 mt-3">{ok}</p>}
    </div>
  );
}
