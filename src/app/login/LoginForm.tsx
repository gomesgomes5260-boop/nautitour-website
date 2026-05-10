'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { loginAction } from './actions';

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction({ email, password, redirectTo });
      if (result && !result.ok) setError(result.error);
    });
  };

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

      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">Senha</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {isPending ? 'Entrando...' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-gray-600">
        <Link href="/esqueci-senha" className="hover:underline" style={{ color: 'rgb(9, 110, 171)' }}>
          Esqueci minha senha
        </Link>
      </p>
      <p className="text-center text-sm text-gray-600">
        Não tem conta?{' '}
        <Link href="/signup" className="font-semibold hover:underline" style={{ color: 'rgb(9, 110, 171)' }}>
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
