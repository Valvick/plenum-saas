'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) return alert(error.message);
    setSent(true);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    setLoading(false);
    if (error) return alert(error.message);
    if (data.session) {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl p-6 bg-[#0f172a] shadow">
        <h1 className="text-2xl font-bold mb-4">Entrar</h1>

        {!sent ? (
          <form onSubmit={sendCode} className="space-y-3">
            <label className="block">
              <span className="text-sm text-slate-300">E-mail</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                placeholder="voce@empresa.com.br"
              />
            </label>
            <button disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 font-semibold">
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
            <p className="text-xs text-slate-400">Enviaremos um código de 6 dígitos para seu e-mail.</p>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-slate-300">Código enviado para <strong>{email}</strong>.</p>
            <label className="block">
              <span className="text-sm text-slate-300">Código de 6 dígitos</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                placeholder="000000"
              />
            </label>
            <button disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-2 font-semibold">
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button type="button" onClick={() => setSent(false)} className="w-full rounded-xl bg-slate-700 hover:bg-slate-600 py-2">
              Voltar
            </button>
          </form>
        )}
      </div>
    </main>
  );
}