"use client";
import Link from "next/link";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-xl" style={{ background: "hsl(var(--primary))" }} />
          <span className="font-semibold font-display tracking-tight">Plenum</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="hover:underline">Dashboard</Link>
          <Link href="/colaboradores" className="hover:underline">Colaboradores</Link>
          <Link href="/cursos" className="hover:underline">Cursos</Link>
          <Link href="/certificados" className="hover:underline">Certificados</Link>
        </nav>
      </div>
    </header>
  );
}
