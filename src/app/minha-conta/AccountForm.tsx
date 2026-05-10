'use client';

import { useState, useTransition } from 'react';
import { updateProfileAction, changePasswordAction } from './actions';

type Props = {
  email: string;
  initialFullName: string;
  initialPhone: string;
  initialCpf: string;
};

export default function AccountForm({
  email,
  initialFullName,
  initialPhone,
  initialCpf,
}: Props) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [cpf, setCpf] = useState(initialCpf);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [savingProfile, startProfile] = useTransition();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [savingPw, startPw] = useTransition();

  const handleProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    startProfile(async () => {
      const result = await updateProfileAction({ fullName, phone, cpf: cpf || undefined });
      if (!result.ok) setProfileErr(result.error);
      else setProfileMsg('Dados atualizados.');
    });
  };

  const handlePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    if (newPassword.length < 8) {
      setPwErr('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr('As novas senhas não coincidem.');
      return;
    }
    startPw(async () => {
      const result = await changePasswordAction({ currentPassword, newPassword });
      if (!result.ok) {
        setPwErr(result.error);
      } else {
        setPwMsg('Senha alterada com sucesso.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(9, 110, 171)' }}>
          Dados pessoais
        </h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <Field label="E-mail">
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-500"
            />
          </Field>
          <Field label="Nome completo" required>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </Field>
          <Field label="Telefone (com DDD)" required>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </Field>
          <Field label="CPF (opcional)">
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </Field>
          {profileErr && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
              {profileErr}
            </div>
          )}
          {profileMsg && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-3 text-sm">
              {profileMsg}
            </div>
          )}
          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-3 text-white text-sm font-semibold rounded-full disabled:opacity-50"
            style={{ backgroundColor: 'rgb(9, 110, 171)' }}
          >
            {savingProfile ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(9, 110, 171)' }}>
          Alterar senha
        </h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <Field label="Senha atual" required>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </Field>
          <Field label="Nova senha (mín. 8)" required>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </Field>
          <Field label="Confirmar nova senha" required>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </Field>
          {pwErr && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
              {pwErr}
            </div>
          )}
          {pwMsg && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-3 text-sm">
              {pwMsg}
            </div>
          )}
          <button
            type="submit"
            disabled={savingPw}
            className="px-6 py-3 text-white text-sm font-semibold rounded-full disabled:opacity-50"
            style={{ backgroundColor: 'rgb(9, 110, 171)' }}
          >
            {savingPw ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
