'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { signupAction } from './actions';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">Nome completo</span>
        <input
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">Telefone (com DDD)</span>
        <input
          type="tel"
          required
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="(22) 99999-9999"
        />
      </label>

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
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Senha <span className="text-gray-500 font-normal">(mín. 8 caracteres)</span>
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-3 text-sm">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3 text-white text-base font-semibold rounded-full disabled:opacity-50"
        style={{ backgroundColor: 'rgb(9, 110, 171)' }}
      >
        {isPending ? 'Cadastrando...' : 'Cadastrar'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: 'rgb(9, 110, 171)' }}>
          Entrar
        </Link>
      </p>
    </form>
  );
}
