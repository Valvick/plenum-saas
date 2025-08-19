'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Employee = { id: string; full_name: string };
type Course = { id: string; title: string; course_code: string; validity_days: number | null };
type Row = {
  id: string;
  employee_id: string;
  course_id: string;
  completion_date: string | null;
  due_date: string | null;
  status: string | null;
  certificate_url: string | null;
  employee: Employee | null;
  course: Course | null;
};

export default function Inner() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  const supabase = useMemo(() => {
    try {
      if (!supabaseUrl || !supabaseAnon) return null;
      return createClient(supabaseUrl, supabaseAnon);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [supabaseUrl, supabaseAnon]);

  useEffect(() => {
    (async () => {
      try {
        if (!supabaseUrl || !supabaseAnon) {
          throw new Error('Variáveis de ambiente ausentes: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
        }
        if (!supabase) {
          throw new Error('Falha ao iniciar o client do Supabase.');
        }

        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            id, employee_id, course_id, completion_date, due_date, status, certificate_url,
            employee:employees ( id, full_name ),
            course:courses ( id, title, course_code, validity_days )
          `)
          .limit(500);

        if (error) throw error;

        const normalized: Row[] = (data ?? []).map((r: any) => ({
          id: r.id,
          employee_id: r.employee_id,
          course_id: r.course_id,
          completion_date: r.completion_date ?? null,
          due_date: r.due_date ?? null,
          status: r.status ?? null,
          certificate_url: r.certificate_url ?? null,
          employee: Array.isArray(r.employee) ? r.employee[0] ?? null : r.employee ?? null,
          course: Array.isArray(r.course) ? r.course[0] ?? null : r.course ?? null,
        }));

        setRows(normalized);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [supabase, supabaseUrl, supabaseAnon]);

  if (loading) return <div className="p-6">Carregando…</div>;
  if (err) return <div className="p-6 text-red-400">Erro ao carregar matrículas: {err}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Matrículas</h1>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2">Colaborador</th>
            <th className="text-left p-2">Curso</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Vencimento</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-700">
              <td className="p-2">{r.employee?.full_name ?? '—'}</td>
              <td className="p-2">{r.course?.title ?? '—'}</td>
              <td className="p-2">{r.status ?? '—'}</td>
              <td className="p-2">{r.due_date ?? '—'}</td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={4} className="p-3 text-slate-400">Nenhuma matrícula encontrada.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
