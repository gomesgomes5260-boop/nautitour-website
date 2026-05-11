'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAdminAction, removeAdminAction } from './actions';

export type AdminRow = {
  user_id: string;
  email: string;
  role: 'owner' | 'operator';
  created_at: string;
  created_by_email: string | null;
};

const DATE = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export default function AdminsTable({
  admins,
  currentUserId,
  isOwner,
}: {
  admins: AdminRow[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'operator'>('operator');

  function add() {
    setErr(null);
    setOk(null);
    startTransition(async () => {
      const res = await addAdminAction(email, role);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(`Adicionado: ${email}`);
      setEmail('');
      router.refresh();
    });
  }

  function remove(userId: string, emailLabel: string) {
    if (!confirm(`Remover ${emailLabel} dos administradores?`)) return;
    setErr(null);
    setOk(null);
    startTransition(async () => {
      const res = await removeAdminAction(userId);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(`Removido: ${emailLabel}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-gray-200 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Adicionado</th>
              <th className="px-3 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  Nenhum admin cadastrado.
                </td>
              </tr>
            )}
            {admins.map((a) => {
              const isSelf = a.user_id === currentUserId;
              return (
                <tr key={a.user_id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{a.email}{isSelf && <span className="ml-2 text-xs text-gray-500">(você)</span>}</td>
                  <td className="px-3 py-2 capitalize">{a.role}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {DATE.format(new Date(a.created_at))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {isOwner && !isSelf && (
                      <button
                        type="button"
                        onClick={() => remove(a.user_id, a.email)}
                        disabled={pending}
                        className="text-red-600 hover:underline text-xs disabled:opacity-50"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isOwner && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h3 className="text-sm font-semibold mb-3">Adicionar novo admin</h3>
          <p className="text-xs text-gray-600 mb-3">
            A pessoa precisa ter feito cadastro em <code>/signup</code> antes.
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-600 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'owner' | 'operator')}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="operator">Operator</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <button
              type="button"
              onClick={add}
              disabled={pending || !email.trim()}
              className="bg-[rgb(9,110,171)] text-white text-sm px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50"
            >
              {pending ? 'Adicionando…' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {err && <p className="text-sm text-red-700">{err}</p>}
      {ok && <p className="text-sm text-green-700">{ok}</p>}
    </div>
  );
}
