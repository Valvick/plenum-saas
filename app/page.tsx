'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Stat = { label: string; value: number; hint?: string };

export default function Home() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Em dia', value: 0 },
    { label: 'A vencer (≤ 30 dias)', value: 0 },
    { label: 'Vencidos', value: 0 },
  ]);

  useEffect(() => {
    setStats([
      { label: 'Em dia', value: 128 },
      { label: 'A vencer (≤ 30 dias)', value: 23 },
      { label: 'Vencidos', value: 7 },
    ]);
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestão de Vencimentos</h1>
          <p className="text-slate-300 mt-1">Exames médicos e cursos normativos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/employees" className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Colaboradores</Link>
          <Link href="/courses" className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Cursos</Link>
          <Link href="/exams" className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Exames</Link>
           <Link href="/dashboard" className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Vencimentos</Link>
          <Link href="/enrollments" className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Matrículas</Link>

          <a href="/setup" className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">Configurar</a>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-5 bg-[#0f172a] shadow">
            <div className="text-slate-300">{s.label}</div>
            <div className="text-3xl font-extrabold mt-2">{s.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl p-5 bg-[#0f172a] shadow">
        <h2 className="text-xl font-semibold mb-3">Importação Rápida (CSV)</h2>
        <p className="text-slate-300 mb-4">
          Importe colaboradores, cursos, matrículas e exames. Use os templates que já gerei para você.
        </p>
        <div className="flex gap-3 flex-wrap">
          <a href="/templates" className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Ver instruções</a>
          <a className="px-3 py-2 rounded-xl bg-slate-700 pointer-events-none opacity-60">Upload (em breve)</a>
        </div>
      </section>
    </main>
  );
}
