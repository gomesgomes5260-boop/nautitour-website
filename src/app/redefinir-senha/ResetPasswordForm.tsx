'use client';

import { useState, useTransition } from 'react';
import { resetPasswordAction } from './actions';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Nova senha <span className="text-gray-500 font-normal">(mín. 8 caracteres)</span>
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
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
        {isPending ? 'Salvando...' : 'Salvar nova senha'}
      </button>
    </form>
  );
}
