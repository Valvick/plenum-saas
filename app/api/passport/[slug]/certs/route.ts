export const runtime = "nodejs";
export const dynamic = "force-dynamic";


/ app/api/passport/[slug]/certs/route.ts
import { supabaseService } from "@/lib/supabaseService";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const s = supabaseService();

  // Descobre employee_id e company_id pelo slug
  const { data: pass, error: pErr } = await s
    .from("public_passports")
    .select("employee_id, employees:employee_id(company_id)")
    .eq("slug", params.slug)
    .maybeSingle();

  if (pErr || !pass) return new Response("Not found", { status: 404 });

  const employeeId = pass.employee_id as string;
  const companyId = (pass as any).employees?.company_id as string;

  // Lista objetos no bucket certificates
  const { data: listed, error: lErr } = await s.storage
    .from("certificates")
    .list(`${companyId}/${employeeId}`, { limit: 100 });

  if (lErr) return new Response("List error", { status: 500 });

  // Gera signed URLs (10 min)
  const signed = await Promise.all(
    (listed ?? []).map(async (f) => {
      const path = `${companyId}/${employeeId}/${f.name}`; // caminho relativo ao bucket
      const { data } = await s.storage.from("certificates").createSignedUrl(path, 600);
      return { name: f.name, url: data?.signedUrl ?? null };
    })
  );

  return Response.json(signed);
}
