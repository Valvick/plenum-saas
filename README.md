# Plenum — Rotas mínimas (Passaporte/QR)

Arquivos a colocar na **raiz do projeto Next.js**:
- `lib/supabaseServer.ts`
- `app/api/passport/qr/route.ts`
- `app/p/[slug]/page.tsx`

## Instalação
1) Copie estas pastas/arquivos para o seu projeto.
2) Garanta `tsconfig.json` com:
```json
{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./*"] } } }
```
3) Instale deps:
```bash
npm i @supabase/supabase-js qrcode
```
4) Confirme `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
5) Rode `npm run dev` e teste:
- `/api/passport/qr?slug=<slug>`
- `/p/<slug>`
