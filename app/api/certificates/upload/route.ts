// app/api/certificates/upload/route.ts
import { Buffer } from "node:buffer";
import { supabaseServer } from "@/lib/supabaseServer";   // client público (RLS)
import { supabaseService } from "@/lib/supabaseService"; // service role (server only)

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();

  const slug = form.get("slug")?.toString() ?? null;
  const employeeIdFromBody = form.get("employee_id")?.toString() ?? null;
  const file = form.get("file") as File | null;
  const label = form.get("label")?.toString() || "certificado";
  const dueDate = form.get("due_date")?.toString() || null; // 'YYYY-MM-DD' ou null

  if (!file || (!slug && !employeeIdFromBody)) {
    return new Response(JSON.stringify({ error: "missing_params" }), { status: 400 });
  }

  // 1) Resolver employee/company via client público (respeita RLS)
  const pub = supabaseServer();

  let employeeId = employeeIdFromBody;
  if (!employeeId && slug) {
    const { data: pass, error } = await pub
      .from("public_passports")
      .select("employee_id, enabled")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !pass || !pass.enabled) {
      return new Response(JSON.stringify({ error: "invalid_slug" }), { status: 404 });
    }
    employeeId = pass.employee_id as string;
  }

  const { data: emp, error: eErr } = await pub
    .from("employees")
    .select("company_id, full_name")
    .eq("id", employeeId!)
    .maybeSingle();

  if (eErr || !emp) {
    return new Response(JSON.stringify({ error: "employee_not_found" }), { status: 404 });
  }

  // 2) Upload no Storage via service role (bucket privado)
  const s = supabaseService();

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext !== "pdf") {
    return new Response(JSON.stringify({ error: "invalid_type" }), { status: 415 });
  }

  const safeName = file.name.replace(/\s+/g, "_");
  const path = `${emp.company_id}/${employeeId}/${Date.now()}_${safeName}`;

  const arrayBuf = await file.arrayBuffer();
  const { error: upErr } = await s.storage
    .from("certificates")
    .upload(path, Buffer.from(arrayBuf), {
      contentType: "application/pdf",
      upsert: false,
    });

  if (upErr) {
    return new Response(JSON.stringify({ error: "upload_failed" }), { status: 500 });
  }

  // 3) (Opcional) gravar metadados em employee_certificates (se a função existir)
  try {
    await s.rpc("upsert_employee_certificate", {
      _employee_id: employeeId,
      _label: label,
      _file_path: path,
      _due_date: dueDate, // string ou null
    });
  } catch {
    // ignore se a função ainda não foi criada
  }

  // 4) Assina a URL por 10 min
  const { data: signed } = await s.storage
    .from("certificates")
    .createSignedUrl(path, 600);

  return Response.json({ ok: true, path, url: signed?.signedUrl ?? null });
}
