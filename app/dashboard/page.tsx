'use client';

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Summary = {
  total: number;
  vencidos: number;
  proximos30: number;
  proximos60: number;
};

export default function DashboardPage() {
  const [sum, setSum] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Busca dados agregados do seu endpoint (já preparado anteriormente)
        const res = await fetch("/api/compliance", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;

        // Faça o mapeamento aqui conforme o shape do /api/compliance
        const s: Summary = {
          total: data?.summary?.total ?? 0,
          vencidos: data?.summary?.overdue ?? 0,
          proximos30: data?.summary?.due_30 ?? 0,
          proximos60: data?.summary?.due_60 ?? 0,
        };
        setSum(s);
      } catch {
        setSum({ total: 0, vencidos: 0, proximos30: 0, proximos60: 0 });
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/employees"><Button variant="secondary">Colaboradores</Button></Link>
          <Link href="/courses"><Button variant="secondary">Cursos</Button></Link>
          <Link href="/exams"><Button variant="secondary">Exames</Button></Link>
          <Link href="/enrollments"><Button>Matrículas</Button></Link>
        </div>
      </header>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card className="rounded-2xl"><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Total de Registros</p>
          <p className="text-3xl font-semibold mt-2">{loading ? "…" : sum?.total ?? 0}</p>
        </CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Vencidos</p>
          <p className="text-3xl font-semibold mt-2">{loading ? "…" : sum?.vencidos ?? 0}</p>
          <Badge variant="destructive" className="mt-3">Ação imediata</Badge>
        </CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Vence em 30 dias</p>
          <p className="text-3xl font-semibold mt-2">{loading ? "…" : sum?.proximos30 ?? 0}</p>
        </CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Vence em 60 dias</p>
          <p className="text-3xl font-semibold mt-2">{loading ? "…" : sum?.proximos60 ?? 0}</p>
        </CardContent></Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground mb-3">Ações rápidas</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/enrollments"><Button>Matricular em curso</Button></Link>
            <Link href="/employees"><Button variant="secondary">Cadastrar colaborador</Button></Link>
            <Link href="/courses"><Button variant="secondary">Criar curso</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
