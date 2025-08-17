'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthGate from '@/components/AuthGate';
import { useCompanyId } from '@/lib/useCompanyId';
import { downloadCsv } from '@/lib/exportCsv';

type Employee = {
  id: string;
  company_id: string;
  employee_code: string | null;
  full_name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  site: string | null;           // base/unidade
  role: string | null;           // função/cargo
  admission_date: string | null; // YYYY-MM-DD
  manager_name: string | null;
  manager_email: string | null;
  notes: string | null;
  created_at: string;
};

export default function EmployeesPage() {
  return (
    <AuthGate>
      <EmployeesInner />
    </AuthGate>
  );
}

function EmployeesInner() {
  const { companyId, loading } = useCompanyId();
  const [rows, setRows] = useState<Employee[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const blank: Partial<Employee> = {
    employee_code: '',
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    site: '',
    role: '',
    admission_date: '',
    manager_name: '',
    manager_email: '',
    notes: '',
  };
  const [editing, setEditing] = useState<Partial<Employee> | null>(null);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) =>
      (r.full_name ?? '').toLowerCase().includes(s) ||
      (r.email ?? '').toLowerCase().includes(s) ||
      (r.role ?? '').toLowerCase().includes(s) ||
      (r.site ?? '').toLowerCase().includes(s) ||
      (r.employee_code ?? '').toLowerCase().includes(s) ||
      (r.cpf ?? '').toLowerCase().includes(s)
    );
  }, [rows, q]);

  const reload = async () => {
    if (!companyId) return;
    const { data, error } = await supabase
      .from('employees')
      .select('id, company_id, employee_code, full_name, cpf, email, phone, site, role, admission_date, manager_name, manager_email, notes, created_at')
      .eq('company_id', companyId)
      .order('full_name', { ascending: true });

    if (error) {
      console.error(error);
      return;
    }
    setRows((data ?? []) as Employee[]);
  };

  useEffect(() => {
    if (companyId) reload();
  }, [companyId]);

  const save = async () => {
    if (!companyId || !editing) return;
    if (!editing.full_name) {
      alert('Informe o nome completo.');
      return;
    }
    setBusy(true);

    const payload: any = {
      company_id: companyId,
      employee_code: (editing.employee_code ?? '').trim() || null,
      full_name: (editing.full_name ?? '').trim(),
      cpf: (editing.cpf ?? '').trim() || null,
      email: (editing.email ?? '').trim() || null,
      phone: (editing.phone ?? '').trim() || null,
      site: (editing.site ?? '').trim() || null,
      role: (editing.role ?? '').trim() || null,
      admission_date: editing.admission_date || null,
      manager_name: (editing.manager_name ?? '').trim() || null,
      manager_email: (editing.manager_email ?? '').trim() || null,
      notes: (editing.notes ?? '').trim() || null,
    };

    const resp = editing.id
      ? await supabase.from('employees').update(payload).eq('id', editing.id).eq('company_id', companyId).select('id')
      : await supabase.from('employees').insert(payload).select('id');

    setBusy(false);
    if ((resp as any).error) {
      alert((resp as any).error.message);
      return;
    }
    setEditing(null);
    await reload();
  };

  const remove = async (id: string) => {
    if (!companyId) return;
    if (!confirm('Excluir este colaborador?')) return;
    const { error } = await supabase.from('employees').delete().eq('id', id).eq('company_id', companyId);
    if (error) {
      alert(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="p-6">Carregando…</div>;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Colaboradores</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, e-mail, função, base…"
            className="rounded-xl bg-slate-800 px-3 py-2 outline-none w-72 max-w-full"
          />
          <button onClick={() => setEditing({ ...blank })} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">
            Novo
          </button>
          {/* CSV */}
          <button
            type="button"
            onClick={() =>
              downloadCsv('colaboradores.csv', filtered, [
                { title: 'Nome', value: (r) => r.full_name },
                { title: 'E-mail', value: (r) => r.email ?? '' },
                { title: 'Função', value: (r) => r.role ?? '' },
                { title: 'Base', value: (r) => r.site ?? '' },
                { title: 'Admissão', value: (r) => r.admission_date ?? '' },
                { title: 'Matrícula', value: (r) => r.employee_code ?? '' },
                { title: 'CPF', value: (r) => r.cpf ?? '' },
                { title: 'Telefone', value: (r) => r.phone ?? '' },
                { title: 'Gestor', value: (r) => r.manager_name ?? '' },
                { title: 'E-mail Gestor', value: (r) => r.manager_email ?? '' },
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
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Função</th>
              <th className="p-3">Base</th>
              <th className="p-3">Admissão</th>
              <th className="p-3 w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-slate-800/60">
                <td className="p-3">{e.full_name}</td>
                <td className="p-3">{e.email ?? ''}</td>
                <td className="p-3">{e.role ?? ''}</td>
                <td className="p-3">{e.site ?? ''}</td>
                <td className="p-3">{e.admission_date ?? ''}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(e)} className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600">
                      Editar
                    </button>
                    <button onClick={() => remove(e.id)} className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500">
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-4 text-slate-400" colSpan={6}>
                  Nenhum colaborador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {editing && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0f172a] p-5 shadow">
            <h2 className="text-xl font-semibold mb-3">{editing.id ? 'Editar' : 'Novo'} colaborador</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-slate-300">Nome completo*</span>
                <input
                  value={editing.full_name || ''}
                  onChange={(e) => setEditing({ ...editing!, full_name: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Matrícula</span>
                <input
                  value={editing.employee_code || ''}
                  onChange={(e) => setEditing({ ...editing!, employee_code: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">CPF</span>
                <input
                  value={editing.cpf || ''}
                  onChange={(e) => setEditing({ ...editing!, cpf: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">E-mail</span>
                <input
                  type="email"
                  value={editing.email || ''}
                  onChange={(e) => setEditing({ ...editing!, email: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Telefone</span>
                <input
                  value={editing.phone || ''}
                  onChange={(e) => setEditing({ ...editing!, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Base/Unidade</span>
                <input
                  value={editing.site || ''}
                  onChange={(e) => setEditing({ ...editing!, site: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Função/Cargo</span>
                <input
                  value={editing.role || ''}
                  onChange={(e) => setEditing({ ...editing!, role: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Admissão</span>
                <input
                  type="date"
                  value={editing.admission_date || ''}
                  onChange={(e) => setEditing({ ...editing!, admission_date: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Gestor</span>
                <input
                  value={editing.manager_name || ''}
                  onChange={(e) => setEditing({ ...editing!, manager_name: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">E-mail do Gestor</span>
                <input
                  type="email"
                  value={editing.manager_email || ''}
                  onChange={(e) => setEditing({ ...editing!, manager_email: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm text-slate-300">Observações</span>
                <textarea
                  rows={3}
                  value={editing.notes || ''}
                  onChange={(e) => setEditing({ ...editing!, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">
                Cancelar
              </button>
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

