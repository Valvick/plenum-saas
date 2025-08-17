// app/enrollments/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// ---------- Tipos ----------
type Employee = { id: string; full_name: string };
type Course = { id: string; title: string; course_code: string | null; validity_days: number | null };
type Enrollment = {
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

// ---------- Supabase client (browser) ----------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnon);

// Helper: se vier array, pega o primeiro; se vier objeto/null, retorna como está
const first = <T,>(v: T | T[] | null | undefined): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

export default function EnrollmentsPage() {
  const [loading, setLoading] = useState(false);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rows, setRows] = useState<Enrollment[]>([]);

  // filtros simples
  const [q, setQ] = useState("");
  const [courseId, setCourseId] = useState<string | undefined>(undefined);

  async function loadAll() {
    setLoading(true);

    // funcionários
    const e1 = await supabase
      .from("employees")
      .select("id, full_name")
      .limit(2000);

    // cursos
    const e2 = await supabase
      .from("courses")
      .select("id, title, course_code, validity_days")
      .limit(2000);

    // matrículas (enrollments) com relacionamentos
    const e3 = await supabase
      .from("enrollments")
      .select(
        `
        id, employee_id, course_id, completion_date, due_date, status, certificate_url,
        employee:employees ( id, full_name ),
        course:courses ( id, title, course_code, validity_days )
      `
      )
      .limit(5000);

    setEmps((e1.data ?? []) as Employee[]);
    setCourses((e2.data ?? []) as Course[]);

    // normaliza employee/course (caso venham como arrays por falta de FK declarada)
    const normalized: Enrollment[] = (e3.data ?? []).map((r: any) => ({
      id: r.id,
      employee_id: r.employee_id,
      course_id: r.course_id,
      completion_date: r.completion_date ?? null,
      due_date: r.due_date ?? null,
      status: r.status ?? null,
      certificate_url: r.certificate_url ?? null,
      employee: first<Employee>(r.employee),
      course: first<Course>(r.course),
    }));

    setRows(normalized);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesQ =
        !q ||
        (r.employee?.full_name?.toLowerCase().includes(q.toLowerCase()) ?? false) ||
        (r.course?.title?.toLowerCase().includes(q.toLowerCase()) ?? false);
      const matchesCourse = !courseId || r.course_id === courseId;
      return matchesQ && matchesCourse;
    });
  }, [rows, q, courseId]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Matrículas / Certificações</h1>
            <p className="text-sm text-muted-foreground">
              Lista de vínculos colaborador × curso, com datas de conclusão e vencimento.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={loadAll} disabled={loading}>
              {loading ? "Atualizando…" : "Atualizar"}
            </Button>
          </div>
        </header>

        {/* Filtros */}
        <section className="mb-6 grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Buscar por colaborador ou curso…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select onValueChange={(v) => setCourseId(v)} value={courseId}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por curso" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setQ("");
                setCourseId(undefined);
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </section>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Registros ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Conclusão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Certificado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const concl = r.completion_date
                      ? new Date(r.completion_date).toLocaleDateString()
                      : "—";
                    const due = r.due_date ? new Date(r.due_date).toLocaleDateString() : "—";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.employee?.full_name ?? "—"}
                        </TableCell>
                        <TableCell>{r.course?.title ?? "—"}</TableCell>
                        <TableCell>{concl}</TableCell>
                        <TableCell>{due}</TableCell>
                        <TableCell>{r.status ?? "—"}</TableCell>
                        <TableCell>
                          {r.certificate_url ? (
                            <a
                              className="underline"
                              href={r.certificate_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Abrir
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
