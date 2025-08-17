'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthGate from '@/components/AuthGate';
import { useCompanyId } from '@/lib/useCompanyId';
import { downloadCsv } from '@/lib/exportCsv';

type Course = {
  id: string;
  course_code: string;
  title: string;
  norm: string;
  workload_hours: number | null;
  validity_days: number;
  provider: string | null;
  observations: string | null;
};

export default function CoursesPage() {
  return (
    <AuthGate>
      <CoursesInner />
    </AuthGate>
  );
}

function CoursesInner() {
  const { companyId, loading } = useCompanyId();
  const [rows, setRows] = useState<Course[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const blank: Partial<Course> = {
    course_code: '',
    title: '',
    norm: '',
    workload_hours: null,
    validity_days: 365,
    provider: '',
    observations: '',
  };
  const [editing, setEditing] = useState<Partial<Course> | null>(null);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter(r =>
      r.course_code?.toLowerCase().includes(s) ||
      r.title?.toLowerCase().includes(s) ||
      r.norm?.toLowerCase().includes(s) ||
      (r.provider ?? '').toLowerCase().includes(s)
    );
  }, [rows, q]);

  const reload = async () => {
    if (!companyId) return;
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_code, title, norm, workload_hours, validity_days, provider, observations')
      .eq('company_id', companyId)
      .order('title', { ascending: true });
    if (error) { console.error(error); return; }
    setRows((data ?? []) as Course[]);
  };

  useEffect(() => { if (companyId) reload(); }, [companyId]);

  const save = async () => {
    if (!companyId || !editing) return;
    if (!editing.course_code || !editing.title || !editing.norm || !editing.validity_days) {
      alert('Preencha: Código, Título, Norma e Validade (dias).');
      return;
    }
    setBusy(true);
    const payload: any = {
      company_id: companyId,
      course_code: editing.course_code?.trim(),
      title: editing.title?.trim(),
      norm: editing.norm?.trim(),
      workload_hours: editing.workload_hours ? Number(editing.workload_hours) : null,
      validity_days: Number(editing.validity_days),
      provider: editing.provider?.trim() || null,
      observations: editing.observations?.trim() || null,
    };

    const resp = editing.id
      ? await supabase.from('courses').update(payload).eq('id', editing.id).eq('company_id', companyId).select('id')
      : await supabase.from('courses').insert(payload).select('id');

    setBusy(false);
    if (resp.error) { alert(resp.error.message); return; }
    setEditing(null);
    await reload();
  };

  const remove = async (id: string) => {
    if (!companyId) return;
    if (!confirm('Excluir este curso?')) return;
    const { error } = await supabase.from('courses').delete().eq('id', id).eq('company_id', companyId);
    if (error) { alert(error.message); return; }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  if (loading) return <div className="p-6">Carregando…</div>;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Cursos</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, título, norma…"
            className="rounded-xl bg-slate-800 px-3 py-2 outline-none w-72 max-w-full"
          />
          <button onClick={() => setEditing({ ...blank })} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">
            Novo
          </button>
          {/* CSV */}
          <button
            onClick={() =>
              downloadCsv('cursos.csv', filtered, [
                { title: 'Código', value: (r) => r.course_code },
                { title: 'Título', value: (r) => r.title },
                { title: 'Norma', value: (r) => r.norm },
                { title: 'Carga (h)', value: (r) => r.workload_hours ?? '' },
                { title: 'Validade (dias)', value: (r) => r.validity_days },
                { title: 'Fornecedor', value: (r) => r.provider ?? '' },
                { title: 'Obs', value: (r) => r.observations ?? '' },
              ])
            }
            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600"
          >
            CSV
          </button>
        </div>
      </header>

      <section className="rounded-2xl bg-[#0f172a] shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="text-slate-300 bg-slate-800/40">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Título</th>
              <th className="p-3">Norma</th>
              <th className="p-3">Carga (h)</th>
              <th className="p-3">Validade (dias)</th>
              <th className="p-3">Fornecedor</th>
              <th className="p-3 w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t border-slate-800/60">
                <td className="p-3">{c.course_code}</td>
                <td className="p-3">{c.title}</td>
                <td className="p-3">{c.norm}</td>
                <td className="p-3">{c.workload_hours ?? ''}</td>
                <td className="p-3">{c.validity_days}</td>
                <td className="p-3">{c.provider ?? ''}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(c)} className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600">Editar</button>
                    <button onClick={() => remove(c.id)} className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="p-4 text-slate-400" colSpan={7}>Nenhum curso encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {editing && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0f172a] p-5 shadow">
            <h2 className="text-xl font-semibold mb-3">{editing.id ? 'Editar' : 'Novo'} curso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-slate-300">Código*</span>
                <input value={editing.course_code || ''} onChange={(e) => setEditing({ ...editing, course_code: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none" required />
              </label>
              <label className="block">
                <span className="text-sm text-slate-300">Norma*</span>
                <input value={editing.norm || ''} onChange={(e) => setEditing({ ...editing, norm: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none" required />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-slate-300">Título*</span>
                <input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none" required />
              </label>
              <label className="block">
                <span className="text-sm text-slate-300">Carga horária (h)</span>
                <input type="number" min={0}
                  value={editing.workload_hours ?? ''} onChange={(e) => setEditing({ ...editing, workload_hours: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm text-slate-300">Validade (dias)*</span>
                <input type="number" min={1} required
                  value={editing.validity_days ?? 0} onChange={(e) => setEditing({ ...editing, validity_days: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm text-slate-300">Fornecedor</span>
                <input value={editing.provider || ''} onChange={(e) => setEditing({ ...editing, provider: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-slate-300">Observações</span>
                <textarea rows={3} value={editing.observations || ''} onChange={(e) => setEditing({ ...editing, observations: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none" />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Cancelar</button>
              <button onClick={save} disabled={busy} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">
                {busy ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
