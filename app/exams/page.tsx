'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthGate from '@/components/AuthGate';
import { useCompanyId } from '@/lib/useCompanyId';
import { downloadCsv } from '@/lib/exportCsv';

type Employee = { id: string; full_name: string };
type Exam = {
  id: string;
  employee_id: string;
  exam_type: string;
  exam_date: string;
  validity_days: number;
  clinic: string | null;
  aso_url: string | null;
  due_date: string;
};

export default function ExamsPage() {
  return (
    <AuthGate>
      <ExamsInner />
    </AuthGate>
  );
}

function ExamsInner() {
  const { companyId, loading } = useCompanyId();
  const [rows, setRows] = useState<Exam[]>([]);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const blank: Partial<Exam> = {
    employee_id: '',
    exam_type: '',
    exam_date: '',
    validity_days: 365,
    clinic: '',
    aso_url: '',
  };
  const [editing, setEditing] = useState<Partial<Exam> | null>(null);

  const empMap = useMemo(() => new Map(emps.map(e => [e.id, e.full_name])), [emps]);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter(r =>
      empMap.get(r.employee_id)?.toLowerCase().includes(s) ||
      r.exam_type?.toLowerCase().includes(s) ||
      (r.clinic ?? '').toLowerCase().includes(s)
    );
  }, [rows, q, empMap]);

  const loadAll = async () => {
    if (!companyId) return;
    const [{ data: e1 }, { data: e2 }] = await Promise.all([
      supabase.from('employees').select('id, full_name').eq('company_id', companyId).order('full_name'),
      supabase.from('medical_exams').select('id, employee_id, exam_type, exam_date, validity_days, clinic, aso_url, due_date').eq('company_id', companyId).order('exam_date', { ascending: false }),
    ]);
    setEmps((e1 ?? []) as Employee[]);
    setRows((e2 ?? []) as Exam[]);
  };

  useEffect(() => { if (companyId) loadAll(); }, [companyId]);

  const save = async () => {
    if (!companyId || !editing) return;
    if (!editing.employee_id || !editing.exam_type || !editing.exam_date || !editing.validity_days) {
      alert('Preencha: Colaborador, Tipo, Data do exame e Validade (dias).');
      return;
    }
    setBusy(true);
    const payload: any = {
      company_id: companyId,
      employee_id: editing.employee_id,
      exam_type: editing.exam_type.trim(),
      exam_date: editing.exam_date,
      validity_days: Number(editing.validity_days),
      clinic: editing.clinic?.trim() || null,
      aso_url: editing.aso_url?.trim() || null,
    };

    const resp = editing.id
      ? await supabase.from('medical_exams').update(payload).eq('id', editing.id).eq('company_id', companyId).select('id')
      : await supabase.from('medical_exams').insert(payload).select('id');

    setBusy(false);
    if (resp.error) { alert(resp.error.message); return; }
    setEditing(null);
    await loadAll();
  };

  const remove = async (id: string) => {
    if (!companyId) return;
    if (!confirm('Excluir este exame?')) return;
    const { error } = await supabase.from('medical_exams').delete().eq('id', id).eq('company_id', companyId);
    if (error) { alert(error.message); return; }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  if (loading) return <div className="p-6">Carregando…</div>;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Exames Médicos</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por colaborador, tipo, clínica…"
            className="rounded-xl bg-slate-800 px-3 py-2 outline-none w-72 max-w-full"
          />
          <button onClick={() => setEditing({ ...blank })} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">
            Novo
          </button>
          {/* CSV */}
          <button
            onClick={() =>
              downloadCsv('exames.csv', filtered, [
                { title: 'Colaborador', value: (r) => empMap.get(r.employee_id) ?? r.employee_id },
                { title: 'Tipo', value: (r) => r.exam_type },
                { title: 'Data', value: (r) => r.exam_date },
                { title: 'Validade (dias)', value: (r) => r.validity_days },
                { title: 'Vence em', value: (r) => r.due_date },
                { title: 'Clínica', value: (r) => r.clinic ?? '' },
                { title: 'ASO', value: (r) => r.aso_url ?? '' },
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
              <th className="p-3">Colaborador</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Data</th>
              <th className="p-3">Validade (dias)</th>
              <th className="p-3">Vence em</th>
              <th className="p-3">Clínica</th>
              <th className="p-3 w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(x => (
              <tr key={x.id} className="border-t border-slate-800/60">
                <td className="p-3">{empMap.get(x.employee_id) ?? x.employee_id}</td>
                <td className="p-3">{x.exam_type}</td>
                <td className="p-3">{x.exam_date}</td>
                <td className="p-3">{x.validity_days}</td>
                <td className="p-3">{x.due_date}</td>
                <td className="p-3">{x.clinic ?? ''}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(x)} className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600">Editar</button>
                    <button onClick={() => remove(x.id)} className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="p-4 text-slate-400" colSpan={7}>Nenhum exame encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {editing && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0f172a] p-5 shadow">
            <h2 className="text-xl font-semibold mb-3">{editing.id ? 'Editar' : 'Novo'} exame</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-slate-300">Colaborador*</span>
                <select
                  value={editing.employee_id || ''}
                  onChange={(e) => setEditing({ ...editing!, employee_id: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  required
                >
                  <option value="" disabled>Selecione…</option>
                  {emps.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-slate-300">Tipo de exame*</span>
                <input
                  value={editing.exam_type || ''}
                  onChange={(e) => setEditing({ ...editing!, exam_type: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  placeholder="Periódico, Admissional, Retorno..."
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-300">Data do exame*</span>
                <input
                  type="date"
                  value={editing.exam_date || ''}
                  onChange={(e) => setEditing({ ...editing!, exam_date: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-300">Validade (dias)*</span>
                <input
                  type="number" min={1}
                  value={editing.validity_days ?? 0}
                  onChange={(e) => setEditing({ ...editing!, validity_days: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-300">Clínica</span>
                <input
                  value={editing.clinic || ''}
                  onChange={(e) => setEditing({ ...editing!, clinic: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-slate-300">ASO (URL)</span>
                <input
                  type="url"
                  value={editing.aso_url || ''}
                  onChange={(e) => setEditing({ ...editing!, aso_url: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  placeholder="https://..."
                />
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
