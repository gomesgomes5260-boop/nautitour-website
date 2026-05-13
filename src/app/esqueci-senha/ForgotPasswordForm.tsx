'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { forgotPasswordAction } from './actions';

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2.5 text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-400)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await forgotPasswordAction({ email });
      if (!result.ok) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8 shadow-[var(--shadow-1)]">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
            <Mail size={18} />
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-[var(--color-charcoal-900)] mb-1">
              Verifique seu e-mail
            </p>
            <p className="text-sm text-[var(--color-charcoal-700)] leading-relaxed">
              Se houver uma conta com este endereço, enviamos um link para
              redefinir sua senha. O link expira em 1 hora.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8 space-y-4 shadow-[var(--shadow-1)]"
    >
      <label className="block">
        <span className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          E-mail
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        {isPending ? 'Enviando...' : 'Enviar link de redefinição'}
      </button>
      <p className="text-center text-sm text-[var(--color-charcoal-500)] pt-2">
        Lembrou a senha?{' '}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-red-600)] hover:text-[var(--color-red-700)] hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
