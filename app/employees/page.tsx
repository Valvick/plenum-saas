'use client';

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Employee = {
  id: string;
  full_name: string | null;
  email: string | null;
  cpf: string | null;
  team_id: string | null;
  role_id: string | null;
};

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(url, key);

        // RLS deve filtrar pela empresa do usuário logado
        const { data } = await supabase
          .from("employees")
          .select("id, full_name, email, cpf, team_id, role_id")
          .order("full_name", { ascending: true });
        if (!alive) return;
        setRows((data as Employee[]) ?? []);
      } catch {
        setRows([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const filtered = rows.filter(r => (r.full_name ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Colaboradores</h1>

      <Card className="rounded-2xl">
        <CardContent className="p-4 flex items-center gap-3">
          <Input placeholder="Buscar por nome..." value={q} onChange={e=>setQ(e.target.value)} />
          <Badge variant="secondary">{filtered.length} itens</Badge>
        </CardContent>
      </Card>

      <Card className="rounded-2xl overflow-x-auto">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Função</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name ?? "—"}</TableCell>
                  <TableCell>{r.email ?? "—"}</TableCell>
                  <TableCell>{r.cpf ?? "—"}</TableCell>
                  <TableCell>{r.team_id ?? "—"}</TableCell>
                  <TableCell>{r.role_id ?? "—"}</TableCell>
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

