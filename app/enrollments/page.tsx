'use client';

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Employee = { id: string; full_name: string | null; };
type Course = { id: string; title: string | null; course_code: string | null; validity_days: number | null; };
type Enrollment = {
  id: string;
  employee_id: string;
  course_id: string;
  completion_date: string | null;
  due_date: string | null;
  status: string | null;
  certificate_url: string | null;
};

export default function EnrollmentsPage() {
  const [emps, setEmps] = useState<Employee[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [q, setQ] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(url, key);

        const [e1, e2, e3] = await Promise.all([
          supabase.from("employees").select("id, full_name").order("full_name", { ascending: true }),
          supabase.from("courses").select("id, title, course_code, validity_days").order("title", { ascending: true }),
          supabase.from("enrollments").select("id, employee_id, course_id, completion_date, due_date, status, certificate_url").order("due_date", { ascending: true }),
        ]);

        if (!alive) return;
        setEmps((e1.data as Employee[]) ?? []);
        setCourses((e2.data as Course[]) ?? []);
        setRows((e3.data as Enrollment[]) ?? []);
      } catch {
        setEmps([]); setCourses([]); setRows([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const indexedEmps = useMemo(() => new Map(emps.map(e => [e.id, e.full_name ?? "—"])), [emps]);
  const indexedCourses = useMemo(() => new Map(courses.map(c => [c.id, c.title ?? "—"])), [courses]);

  const filtered = rows.filter(r => {
    const name = (indexedEmps.get(r.employee_id) ?? "").toLowerCase();
    const courseTitle = (indexedCourses.get(r.course_id) ?? "").toLowerCase();
    const text = `${name} ${courseTitle}`;
    const qok = text.includes(q.toLowerCase());
    const cok = !courseFilter || r.course_id === courseFilter;
    return qok && cok;
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Matrículas</h1>

      <Card className="rounded-2xl">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <Input placeholder="Buscar por colaborador/curso..." value={q} onChange={e=>setQ(e.target.value)} />
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filtrar por curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title ?? "—"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="self-start md:self-center">{filtered.length} itens</Badge>
        </CardContent>
      </Card>

      <Card className="rounded-2xl overflow-x-auto">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Conclusão</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{indexedEmps.get(r.employee_id) ?? "—"}</TableCell>
                  <TableCell>{indexedCourses.get(r.course_id) ?? "—"}</TableCell>
                  <TableCell>{r.completion_date ?? "—"}</TableCell>
                  <TableCell>{r.due_date ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "overdue" ? "destructive" : "secondary"}>
                      {r.status ?? "—"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sem resultados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
