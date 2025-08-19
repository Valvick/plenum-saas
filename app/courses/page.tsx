'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

type Course = {
  id: string;
  title: string;
  course_code: string;
  validity_days: number | null;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    // TODO: substituir por fetch real via Supabase (client-side).
    setCourses([
      { id: '1', title: 'NR-10 Básico', course_code: 'NR10', validity_days: 24 },
      { id: '2', title: 'NR-35 Trabalho em Altura', course_code: 'NR35', validity_days: 24 },
    ]);
  }, []);

  const filtered = q
    ? courses.filter((c) =>
        (c.title + c.course_code).toLowerCase().includes(q.toLowerCase()),
      )
    : courses;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Cursos</h1>
        <div className="flex gap-2">
          <input
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-60 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none"
          />
          <Link href={'/enrollments' as Route} className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">
            Ver matrículas
          </Link>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="text-left px-4 py-3">Código</th>
              <th className="text-left px-4 py-3">Título</th>
              <th className="text-left px-4 py-3">Validade (meses)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-slate-800">
                <td className="px-4 py-3">{c.course_code}</td>
                <td className="px-4 py-3">{c.title}</td>
                <td className="px-4 py-3">{c.validity_days ?? '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr className="border-t border-slate-800">
                <td className="px-4 py-6 text-center" colSpan={3}>Nenhum curso encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
