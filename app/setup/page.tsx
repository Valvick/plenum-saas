export default function Setup() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Configuração</h1>
      <ol className="list-decimal ml-6 space-y-3 text-slate-200">
        <li>Crie um projeto no <strong>Supabase</strong>.</li>
        <li>Copie as chaves <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para o arquivo <code>.env.local</code>.</li>
        <li>Rode <code>npm run dev</code> e acesse no celular. Adicione à tela inicial para instalar como PWA.</li>
        <li>Substitua os ícones em <code>/public/icons</code> (192x192 e 512x512).</li>
      </ol>
    </main>
  );
}
