export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = params?.slug;
    if (!slug) {
      return NextResponse.json({ error: "missing_slug" }, { status: 400 });
    }

    const s = supabaseService(); // usa SERVICE_ROLE_KEY no server

    // 1) Buscar passaporte pelo slug
    const { data: pass, error: e1 } = await s
      .from("public_passports")
      .select("employee_id, enabled")
      .eq("slug", slug)
      .single();

    if (e1 || !pass?.employee_id) {
      return NextResponse.json({ error: "passport_not_found" }, { status: 404 });
    }

    // 2) Buscar colaborador para saber company_id e nome
    const { data: emp, error: e2 } = await s
      .from("employees")
      .select("id, company_id, full_name")
      .eq("id", pass.employee_id)
      .single();

    if (e2 || !emp) {
      return NextResponse.json({ error: "employee_not_found" }, { status: 404 });
    }

    // 3) Listar PDFs na pasta certificates/<company_id>/<employee_id>/
    const basePath = `${emp.company_id}/${emp.id}`;
    const { data: files, error: e3 } = await s.storage
      .from("certificates")
      .list(basePath, { limit: 100, offset: 0 });

    if (e3) {
      // Se a pasta não existir ainda, retorne lista vazia (não é erro)
      return NextResponse.json([]);
    }

    const pdfs = (files ?? []).filter((f) => f.name.toLowerCase().endsWith(".pdf"));

    // 4) Gerar Signed URLs (10 minutos)
    const result: { name: string; url: string }[] = [];
    for (const f of pdfs) {
      const path = `${basePath}/${f.name}`;
      const { data: signed } = await s.storage
        .from("certificates")
        .createSignedUrl(path, 600);
      if (signed?.signedUrl) {
        result.push({ name: f.name, url: signed.signedUrl });
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: "internal_error", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
