'use client';
import { useEffect, useState } from 'react';

export default function SupaTest() {
  const [result, setResult] = useState('testando...');

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    fetch(url, { headers: { apikey: key } })
      .then((r) => setResult(`OK • status ${r.status}`))
      .catch((e) => setResult(`ERRO • ${e?.message || e}`));
  }, []);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="rounded-2xl p-6 bg-[#0f172a] shadow">
        <h1 className="text-xl font-bold mb-2">Teste Supabase</h1>
        <p className="text-slate-300">{result}</p>
      </div>
    </main>
  );
}