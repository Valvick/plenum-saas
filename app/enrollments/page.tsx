'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthGate from '@/components/AuthGate';
import { useCompanyId } from '@/lib/useCompanyId';
import { downloadCsv } from '@/lib/exportCsv';

type Employee = { id: string; full_name: string };
type Course = { id: string; title: string; course_code: string; validity_days: number };
type Enrollment = {
  id: string;
  employee_id: string;
  course_id: string;
  completion_date: string;
  due_date: string;
  status: string | null;
  certificate_url: string | null;
  employee?: Employee;
  course?: Course;
};

export default function EnrollmentsPage() {
  return (
    <AuthGate>
      <EnrollmentsInner />
    </AuthGate>
  );
}

function EnrollmentsInner() {
  const { companyId, loading } = useCompanyId();
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const blank: Partial<Enrollment> = {
    employee_id: '',
    course_id: '',
    completion_date: '',
    status: 'concluido',
  };
  const [editing, setEditing] = useState<Partial<Enrollment> | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter(r =>
      r.employee?.full_name.toLowerCase().includes(s) ||
      r.course?.title.toLowerCase().includes(s) ||
      r.course?.course_code.toLowerCase().includes(s)
    );
  }, [rows, q]);

  const loadAll = async () => {
    if (!companyId) return;

    const [e1, e2, e3] = await Promise.all([
      supabase.from('employees').select('id, full_name').eq('company_id', companyId).order('full_name'),
      supabase.from('courses').select('id, title, course_code, validity_days').eq('company_id', companyId).order('title'),
      supabase.from('enrollments').select(`
        id, employee_id, course_id, completion_date, due_date, status, certificate_url,
        employee:employees ( id, full_name ),
        course:courses ( id, title, course_code, validity_days )
      `).eq('company_id', companyId).order('completion_date', { ascending: false }),
    ]);

    setEmps((e1.data ?? []) as Employee[]);
    setCourses((e2.data ?? []) as Course[]);
    setRows((e3.data ?? []) as Enrollment[]);
  };

  useEffect(() => { if (companyId) loadAll(); }, [companyId]);

  const uploadCertificate = async (enrollmentId: string, employeeId: string) => {
    if (!file || !companyId) return null;
    const safe = file.name.replace(/[^\w.\-]+/g, '_').toLowerCase();
    const path = `${companyId}/${employeeId}/${enrollmentId}-${safe}`;
    const up = await supabase.storage.from('certificates').upload(path, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });
    if (up.error) { alert('Upload falhou: ' + up.error.message); return null; }
    const pub = supabase.storage.from('certificates').getPublicUrl(path);
    return pub.data.publicUrl;
  };

  const save = async () => {
    if (!companyId || !editing) return;
    if (!editing.employee_id || !editing.course_id || !editing.completion_date) {
      alert('Preencha: Colaborador, Curso e Data de conclusão.');
      return;
    }
    setBusy(true);

    const payload: any = {
      company_id: companyId,
      employee_id: editing.employee_id,
      course_id: editing.course_id,
      completion_date: editing.completion_date,
      status: editing.status || 'concluido',
    };

    // insert or update
    let id = editing.id as string | undefined;
    if (editing.id) {
      const resp = await supabase.from('enrollments')
        .update(payload)
        .eq('id', editing.id)
        .eq('company_id', companyId)
        .select('id')
        .single();
      if (resp.error) { setBusy(false); alert(resp.error.message); return; }
      id = resp.data.id;
    } else {
      const resp = await supabase.from('enrollments')
        .insert(payload)
        .select('id, employee_id')
        .single();
      if (resp.error) { setBusy(false); alert(resp.error.message); return; }
      id = resp.data.id;
      editing.employee_id = resp.data.employee_id; // para montar caminho do arquivo
    }

    // upload opcional de certificado
    if (id && editing.employee_id && file) {
      const url = await uploadCertificate(id, editing.employee_id);
      if (url) {
        await supabase.from('enrollments').update({ certificate_url: url })
          .eq('id', id).eq('company_id', companyId);
      }
    }

    setBusy(false);
    setEditing(null);
    setFile(null);
    await loadAll();
  };

  const remove = async (id: string) => {
    if (!companyId) return;
    if (!confirm('Excluir esta matrícula?')) return;
    const { error } = await supabase.from('enrollments').delete().eq('id', id).eq('company_id', companyId);
    if (error) { alert(error.message); return; }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  if (loading) return <div className="p-6">Carregando…</div>;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Matrículas de Cursos</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por colaborador, curso, código…"
            className="rounded-xl bg-slate-800 px-3 py-2 outline-none w-72 max-w-full"
          />
          <button onClick={() => { setEditing({ ...blank }); setFile(null); }} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">
            Nova
          </button>
          {/* CSV */}
          <button
            onClick={() =>
              downloadCsv('matriculas.csv', filtered, [
                { title: 'Colaborador', value: (r) => r.employee?.full_name ?? r.employee_id },
                { title: 'Curso', value: (r) => r.course?.title ?? r.course_id },
                { title: 'Código do Curso', value: (r) => r.course?.course_code ?? '' },
                { title: 'Conclusão', value: (r) => r.completion_date },
                { title: 'Vencimento', value: (r) => r.due_date },
                { title: 'Status', value: (r) => r.status ?? '' },
                { title: 'Certificado', value: (r) => r.certificate_url ?? '' },
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
              <th className="p-3">Curso</th>
              <th className="p-3">Conclusão</th>
              <th className="p-3">Vencimento</th>
              <th className="p-3">Certificado</th>
              <th className="p-3 w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(en => (
              <tr key={en.id} className="border-t border-slate-800/60">
                <td className="p-3">{en.employee?.full_name}</td>
                <td className="p-3">{en.course?.title} <span className="text-slate-400">({en.course?.course_code})</span></td>
                <td className="p-3">{en.completion_date}</td>
                <td className="p-3">{en.due_date}</td>
                <td className="p-3">
                  {en.certificate_url ? (
                    <a className="underline text-blue-300" href={en.certificate_url} target="_blank">abrir</a>
                  ) : <span className="text-slate-500">—</span>}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(en); setFile(null); }} className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600">Editar</button>
                    <button onClick={() => remove(en.id)} className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="p-4 text-slate-400" colSpan={6}>Nenhuma matrícula encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {editing && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center p-4 z-50">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0f172a] p-5 shadow">
            <h2 className="text-xl font-semibold mb-3">{editing.id ? 'Editar' : 'Nova'} matrícula</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm text-slate-300">Colaborador*</span>
                <select
                  value={editing.employee_id || ''}
                  onChange={(e) => editing && setEditing({ ...editing, employee_id: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  required
                >
                  <option value="" disabled>Selecione…</option>
                  {emps.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Curso*</span>
                <select
                  value={editing.course_id || ''}
                  onChange={(e) => editing && setEditing({ ...editing, course_id: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  required
                >
                  <option value="" disabled>Selecione…</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.course_code})</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Data de conclusão*</span>
                <input
                  type="date"
                  value={editing.completion_date || ''}
                  onChange={(e) => editing && setEditing({ ...editing, completion_date: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Status</span>
                <input
                  value={editing.status || 'concluido'}
                  onChange={(e) => editing && setEditing({ ...editing, status: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                  placeholder="concluido, em andamento…"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm text-slate-300">Certificado (PDF/Imagem) – opcional</span>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full rounded-xl bg-slate-800 px-3 py-2 outline-none"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setEditing(null); setFile(null); }} className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600">Cancelar</button>
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
