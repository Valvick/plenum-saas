'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@/components/ui/table';

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
          <Input
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-60"
          />
          <Link href={'/enrollments' as Route}>
            <Button>Ver matrículas</Button>
          </Link>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Validade (meses)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.course_code}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell>{c.validity_days ?? '-'}</TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>Nenhum curso encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
