'use client';


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      // Importa supabase-js só quando precisa (evita rodar no build)
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(url, key);

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // redireciona pós-login
      window.location.href = "/dashboard";
    } catch (err: any) {
      setMsg(err?.message ?? "Falha no login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardContent className="p-8">
          <h1 className="text-2xl font-semibold mb-2">Entrar</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Acesse a plataforma Plenum com seu e-mail e senha.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm mb-1 block">E-mail</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="voce@empresa.com" />
            </div>
            <div>
              <label className="text-sm mb-1 block">Senha</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
