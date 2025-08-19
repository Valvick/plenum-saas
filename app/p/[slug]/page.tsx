// app/p/[slug]/page.tsx
import { supabaseServer } from "@/lib/supabaseServer";


type Params = { params: { slug: string } };

export default async function PassportPage({ params }: Params) {
  const supabase = supabaseServer();

  // Passaporte + nome do colaborador em uma consulta (join pela FK employee_id)
  const { data: pass, error } = await supabase
    .from("public_passports")
    .select("slug, enabled, employees:employee_id ( full_name )")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error || !pass || !pass.enabled) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Passaporte não encontrado</h1>
        <p className="text-slate-600 mt-2">Verifique o código/QR.</p>
      </main>
    );
  }

  const fullName = (pass as any).employees?.full_name ?? "—";
  const qrSrc = `/api/passport/qr?slug=${encodeURIComponent(params.slug)}`;

  // Busca certificados via rota estática (?slug=), com fallback
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  let certs: { name: string; url: string | null }[] = [];
  try {
    const res = await fetch(
      `${base}/api/passport/certs?slug=${encodeURIComponent(params.slug)}`,
      { cache: "no-store" }
    );
    if (res.ok) certs = await res.json();
  } catch {
    certs = [];
  }

  return (
    <main className="min-h-screen">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">Plenum Pass</h1>
          <p className="text-sm text-slate-600">Verificação de validade</p>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-start gap-6">
          <img
            src={qrSrc}
            alt="QR do Passaporte"
            className="w-40 h-40 rounded-xl border"
          />
          <div>
            <div className="text-xs text-slate-500">Colaborador</div>
            <h2 className="text-2xl font-semibold">{fullName}</h2>
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
              Passaporte ativo
            </div>
            <div className="mt-4 text-sm text-slate-600">
              Código: <span className="font-mono">{params.slug}</span>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-base font-semibold mb-3">Certificados do colaborador</h3>
          {certs.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum certificado anexado.</p>
          ) : (
            <ul className="space-y-2">
              {certs.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm">{c.name}</span>
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      className="text-sm underline"
                    >
                      Abrir
                    </a>
                  ) : (
                    <span className="text-sm text-slate-500">sem link</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
