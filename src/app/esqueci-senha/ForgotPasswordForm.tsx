'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from './actions';

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
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-6">
        <p className="font-semibold mb-2">Verifique seu e-mail</p>
        <p className="text-sm">
          Se houver uma conta com este endereço, enviamos um link para
          redefinir sua senha. O link expira em 1 hora.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">E-mail</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </label>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3 text-white text-base font-semibold rounded-full disabled:opacity-50"
        style={{ backgroundColor: 'rgb(9, 110, 171)' }}
      >
        {isPending ? 'Enviando...' : 'Enviar link de redefinição'}
      </button>
      <p className="text-center text-sm text-gray-600">
        Lembrou a senha?{' '}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: 'rgb(9, 110, 171)' }}>
          Entrar
        </Link>
      </p>
    </form>
  );
}
