'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      setAuthed(!!data.user);
      setChecking(false);
    };
    run();
  }, []);

  if (checking) {
    return <div className="p-6">Carregando…</div>;
  }

  if (!authed) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-md rounded-2xl p-6 bg-[#0f172a] shadow text-center">
          <h2 className="text-xl font-semibold mb-2">Faça login para continuar</h2>
          <Link href="/login" className="inline-block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">
            Ir para Login
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}