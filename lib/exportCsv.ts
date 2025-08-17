// lib/exportCsv.ts
type ColDef<T> = {
  title: string;                 // cabeçalho da coluna
  value: (row: T) => any;        // como extrair o valor da linha
};

function toCsvLine(values: any[]) {
  return values
    .map((v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      // envolve em aspas e escapa aspas internas
      return `"${s.replace(/"/g, '""')}"`;
    })
    .join(',');
}

export function downloadCsv<T>(filename: string, rows: T[], cols: ColDef<T>[]) {
  const header = toCsvLine(cols.map(c => c.title));
  const body = rows.map(r => toCsvLine(cols.map(c => c.value(r)))).join('\n');
  const csv = '\uFEFF' + header + '\n' + body; // BOM p/ Excel

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
