// lib/supabaseService.ts
import { createClient } from "@supabase/supabase-js";

export function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !service) throw new Error("Env do Supabase ausente (URL/SERVICE_ROLE_KEY).");
  return createClient(url, service, { auth: { persistSession: false } });
}


