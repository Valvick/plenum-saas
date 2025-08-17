'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthGate from '@/components/AuthGate';
import { useCompanyId } from '@/lib/useCompanyId';
import Link from 'next/link';
import { downloadCsv } from '@/lib/exportCsv';

type Row = {
  company_id: string;
  employee_id: string;
  full_name: string;
  item_type: 'curso' | 'exame';
  item_id: string;
  due_date: string;   // ISO date (YYYY-MM-DD)
  status: 'VENCIDO' | 'A VENCER' | 'EM DIA';
};

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardInner />
    </AuthGate>
  );
}

function DashboardInner() {
  const { companyId, loading } = useCompanyId();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'TODOS' | Row['status']>('TODOS');

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data, error } = await supabase
        .from('v_compliance')
        .select('company_id, employee_id, full_name, item_type, item_id, due_date, status')
        .eq('company_id', companyId)
        .order('due_date', { ascending: true });
      if (error) { console.error(error); return; }
      setRows((data ?? []) as Row[]);
    })();
  }, [companyId]);

  const stats = useMemo(() => {
    const total = rows.length;
    const vencido = rows.filter(r => r.status === 'VENCIDO').length;
    const avencer = rows.filter(r => r.status === 'A VENCER').length;
    const emdia = rows.filter(r => r.status === 'EM DIA').length;
    return { total, vencido, avencer, emdia };
  }, [rows]);

  const filtered = useMemo(() => {
    let x = rows;
    if (status !== 'TODOS') x = x.filter(r => r.status === status);
    if (q) {
      const s = q.toLowerCase();
      x = x.filter(r =>
        r.full_name.toLowerCase().includes(s) ||
        r.item_type.toLowerCase().includes(s)
      );
    }
    return x;
  }, [rows, q, status]);

  if (loading) return <div className="p-6">Carregando…</div>;

  const badge = (s: Row['status']) => {
    const base = 'px-2 py-1 rounded-lg text-xs font-semibold';
    if (s === 'VENCIDO') return <span className={`${base} bg-red-600/30 text-red-300 border border-red-600/50`}>VENCIDO</span>;
    if (s === 'A VENCER') return <span className={`${base} bg-amber-600/30 text-amber-200 border border-amber-600/50`}>A VENCER</span>;
    return <span className={`${base} bg-emerald-600/30 text-emerald-200 border border-emerald-600/50`}>EM DIA</span>;
  };

  const fmt = (d: string) => d;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Vencimentos</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por colaborador…"
            className="rounded-xl bg-slate-800 px-3 py-2 outline-none w-72 max-w-full"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-xl bg-slate-800 px-3 py-2 outline-none"
          >
            <option value="TODOS">Todos</option>
            <option value="A VENCER">A vencer (≤30d)</option>
            <option value="VENCIDO">Vencido</option>
            <option value="EM DIA">Em dia</option>
          </select>

          {/* Botão CSV ao lado do select */}
          <button
            onClick={() =>
              downloadCsv('vencimentos.csv', filtered, [
                { title: 'Colaborador', value: (r) => r.full_name },
                { title: 'Tipo', value: (r) => r.item_type },
                { title: 'Vencimento', value: (r) => r.due_date },
                { title: 'Status', value: (r) => r.status },
              ])
            }
            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600"
          >
            CSV
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl bg-[#0f172a] p-5 shadow">
          <div className="text-slate-400 text-sm">Total</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-2xl bg-[#0f172a] p-5 shadow">
          <div className="text-slate-400 text-sm">Vencido</div>
          <div className="text-3xl font-bold text-red-300">{stats.vencido}</div>
        </div>
        <div className="rounded-2xl bg-[#0f172a] p-5 shadow">
          <div className="text-slate-400 text-sm">A vencer (≤30d)</div>
          <div className="text-3xl font-bold text-amber-200">{stats.avencer}</div>
        </div>
        <div className="rounded-2xl bg-[#0f172a] p-5 shadow">
          <div className="text-slate-400 text-sm">Em dia</div>
          <div className="text-3xl font-bold text-emerald-200">{stats.emdia}</div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#0f172a] shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="text-slate-300 bg-slate-800/40">
            <tr>
              <th className="p-3">Colaborador</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Vencimento</th>
              <th className="p-3">Status</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={`${r.item_type}-${r.item_id}`} className="border-t border-slate-800/60">
                <td className="p-3">{r.full_name}</td>
                <td className="p-3 capitalize">{r.item_type}</td>
                <td className="p-3">{fmt(r.due_date)}</td>
                <td className="p-3">{badge(r.status)}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {r.item_type === 'curso' ? (
                      <Link href="/courses" className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600">Abrir cursos</Link>
                    ) : (
                      <Link href="/exams" className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600">Abrir exames</Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="p-4 text-slate-400" colSpan={5}>Nenhum item encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
