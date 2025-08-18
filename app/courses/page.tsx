'use client';

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Course = {
  id: string;
  title: string | null;
  course_code: string | null;
  validity_days: number | null;
};

export default function CoursesPage() {
  const [rows, setRows] = useState<Course[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(url, key);

        const { data } = await supabase
          .from("courses")
          .select("id, title, course_code, validity_days")
          .order("title", { ascending: true });
        if (!alive) return;
        setRows((data as Course[]) ?? []);
      } catch {
        setRows([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = rows.filter(r =>
    (r.title ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (r.course_code ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Cursos</h1>

      <Card className="rounded-2xl">
        <CardContent className="p-4 flex items-center gap-3">
          <Input placeholder="Buscar curso ou código..." value={q} onChange={e=>setQ(e.target.value)} />
          <Badge variant="secondary">{filtered.length} itens</Badge>
        </CardContent>
      </Card>

      <Card className="rounded-2xl overflow-x-auto">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Validade (dias)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title ?? "—"}</TableCell>
                  <TableCell>{r.course_code ?? "—"}</TableCell>
                  <TableCell>{r.validity_days ?? "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sem resultados</TableCell></TableRow>
              )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
