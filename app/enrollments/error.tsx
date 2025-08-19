'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6 space-y-3">
      <h2 className="text-xl font-semibold">Ops, algo quebrou nesta página.</h2>
      <pre className="text-sm whitespace-pre-wrap bg-black/30 p-3 rounded">{error.message}</pre>
      <button
        onClick={() => reset()}
        className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600"
      >
        Tentar novamente
      </button>
    </div>
  );
}
