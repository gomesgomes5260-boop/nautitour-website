'use client';

import { useState, useTransition } from 'react';
import { resetPasswordAction } from './actions';

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2.5 text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-400)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    startTransition(async () => {
      const result = await resetPasswordAction({ password });
      if (result && !result.ok) setError(result.error);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8 space-y-4 shadow-[var(--shadow-1)]"
    >
      <label className="block">
        <span className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          Nova senha{' '}
          <span className="text-[var(--color-charcoal-400)] font-normal">
            (mín. 8 caracteres)
          </span>
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          Confirmar senha
        </span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </label>
      {error && (
        <div className="rounded-xl bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] p-3 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-base font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[var(--shadow-2)]"
      >
        {isPending ? 'Salvando...' : 'Salvar nova senha'}
      </button>
    </form>
  );
}
