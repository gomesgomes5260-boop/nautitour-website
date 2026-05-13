'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signupAction } from './actions';

const inputClass =
  'w-full border border-[var(--color-charcoal-200)] rounded-lg px-3 py-2.5 text-[var(--color-charcoal-900)] placeholder:text-[var(--color-charcoal-400)] focus:outline-none focus:border-[var(--color-red-600)] focus:ring-2 focus:ring-[var(--color-red-100)] transition-colors';

export default function SignupForm() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    startTransition(async () => {
      const result = await signupAction({ email, password, fullName, phone });
      if (!result) return; // redirected
      if (!result.ok) {
        setError(result.error);
      } else if (result.needsEmailConfirmation) {
        setSuccess(
          'Cadastro feito! Enviamos um e-mail para você confirmar antes de entrar.'
        );
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-charcoal-100)] bg-white p-6 sm:p-8 space-y-4 shadow-[var(--shadow-1)]"
    >
      <label className="block">
        <span className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          Nome completo
        </span>
        <input
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          Telefone (com DDD)
        </span>
        <input
          type="tel"
          required
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder="(22) 99999-9999"
        />
      </label>

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

      <label className="block">
        <span className="block text-sm font-medium text-[var(--color-charcoal-700)] mb-1.5">
          Senha{' '}
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

      {error && (
        <div className="rounded-xl bg-[var(--color-red-50)] border border-[var(--color-red-100)] text-[var(--color-red-900)] p-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 text-sm">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3 bg-[var(--color-red-600)] hover:bg-[var(--color-red-700)] text-white text-base font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[var(--shadow-2)]"
      >
        {isPending ? 'Cadastrando...' : 'Cadastrar'}
      </button>

      <p className="text-center text-sm text-[var(--color-charcoal-500)] pt-2">
        Já tem conta?{' '}
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
