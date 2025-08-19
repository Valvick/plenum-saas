'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import dynamic from 'next/dynamic';

const Inner = dynamic(() => import('./_client/Inner'), {
  ssr: false,
  loading: () => <div className="p-6">Carregando…</div>,
});

export default function Page() {
  return <Inner />;
}
