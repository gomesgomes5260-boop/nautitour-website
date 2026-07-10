'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSellerAction } from './actions';

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2 text-sm text-[var(--color-charcoal-900)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

const labelClass =
  'block text-xs font-semibold text-[var(--color-charcoal-500)] mb-1';

export default function NewSellerForm({
  agencies,
}: {
  agencies: Array<{ id: string; full_name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openForm, setOpenForm] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'agency' | 'seller'>('seller');
  const [agencyId, setAgencyId] = useState('');
  const [netoBRL, setNetoBRL] = useState('');
  const [pixKey, setPixKey] = useState('');

  function submit() {
    setErr(null);
    setOk(null);
    const netoValueCents = Math.round((Number(netoBRL.replace(',', '.')) || 0) * 100);
    startTransition(async () => {
      const res = await createSellerAction({
        email,
        password,
        fullName,
        phone: phone || null,
        role,
        agencyId: role === 'seller' && agencyId ? agencyId : null,
        netoValueCents,
        pixKey: pixKey || null,
      });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(`Vendedor criado: ${fullName}`);
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setNetoBRL('');
      setPixKey('');
      setOpenForm(false);
      router.refresh();
    });
  }

  return (
    <div>
      {!openForm && (
        <button
          type="button"
          onClick={() => setOpenForm(true)}
          className="rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-2.5 px-5 hover:bg-[var(--color-red-700)] transition-colors"
        >
          Novo vendedor
        </button>
      )}

      {openForm && (
        <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6">
          <h3 className="text-sm font-bold text-[var(--color-charcoal-900)] mb-4">
            Novo vendedor / agência
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nome completo *</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Nome do vendedor"
              />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="(22) 99999-9999"
              />
            </div>
            <div>
              <label className={labelClass}>E-mail (login) *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className={labelClass}>Senha temporária * (mín. 8)</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Senha inicial do vendedor"
              />
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'agency' | 'seller')}
                className={inputClass}
              >
                <option value="seller">Vendedor</option>
                <option value="agency">Agência</option>
              </select>
            </div>
            {role === 'seller' && (
              <div>
                <label className={labelClass}>Agência (opcional)</label>
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
                placeholder="Ex.: 100,00 — meia paga metade"
              />
            </div>
            <div>
              <label className={labelClass}>Chave PIX (comissão)</label>
              <input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className={inputClass}
                placeholder="CPF, e-mail, telefone ou aleatória"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              type="button"
              onClick={submit}
              disabled={pending || !email.trim() || !fullName.trim() || password.length < 8}
              className="rounded-xl bg-[var(--color-red-600)] text-white text-sm font-semibold py-2.5 px-5 hover:bg-[var(--color-red-700)] transition-colors disabled:opacity-50"
            >
              {pending ? 'Criando…' : 'Criar vendedor'}
            </button>
            <button
              type="button"
              onClick={() => setOpenForm(false)}
              disabled={pending}
              className="text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-sm text-[var(--color-red-700)] mt-3">{err}</p>}
      {ok && <p className="text-sm text-emerald-700 mt-3">{ok}</p>}
    </div>
  );
}
