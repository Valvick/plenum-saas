'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <h2 className="text-red-400 font-semibold mb-2">Erro em /enrollments</h2>
      <pre className="text-xs whitespace-pre-wrap bg-black/30 p-3 rounded-xl">
        {String(error?.message || error)}
      </pre>
      <button
        onClick={() => reset()}
        className="mt-4 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl"
      >
        Tentar novamente
      </button>
    </div>
  );
}

