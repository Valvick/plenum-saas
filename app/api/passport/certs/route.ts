import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseService } from "@/lib/supabaseService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return new Response(JSON.stringify({ error: "missing_slug" }), { status: 400 });
  }

  // 1) Lê dados via client público (respeita RLS — igual à página /p/[slug])
  const pub = supabaseServer();

  const { data: pass, error: pErr } = await pub
    .from("public_passports")
    .select("employee_id, enabled")
    .eq("slug", slug)
    .maybeSingle();

  if (pErr || !pass) {
    return new Response(JSON.stringify({ error: "passport_not_found" }), { status: 404 });
  }
  if (!pass.enabled) {
    return new Response(JSON.stringify({ error: "passport_disabled" }), { status: 403 });
  }

  const { data: emp, error: eErr } = await pub
    .from("employees")
    .select("company_id")
    .eq("id", pass.employee_id)
    .maybeSingle();

  if (eErr || !emp) {
    return new Response(JSON.stringify({ error: "employee_not_found" }), { status: 404 });
  }

  // 2) Gera signed URLs usando service role (para bucket privado)
  const s = supabaseService();
  const dir = `${emp.company_id}/${pass.employee_id}`;

  const { data: listed, error: lErr } = await s.storage
    .from("certificates")
    .list(dir, { limit: 100 });

  if (lErr) {
    return new Response(JSON.stringify({ error: "list_failed" }), { status: 500 });
  }

  const signed = await Promise.all(
    (listed ?? []).map(async (f) => {
      const path = `${dir}/${f.name}`;
      const { data } = await s.storage.from("certificates").createSignedUrl(path, 600);
      return { name: f.name, url: data?.signedUrl ?? null };
    })
  );

  return Response.json(signed, { headers: { "Cache-Control": "no-store" } });
}
