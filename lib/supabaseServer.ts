// lib/supabaseServer.ts
import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) {
    throw new Error("Supabase envs ausentes. Verifique .env.local");
  }
  // Server-side client (sem sessão persistida)
  return createClient(url, anon, { auth: { persistSession: false } });
}
