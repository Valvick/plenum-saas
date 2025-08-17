export default function Templates() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Templates de CSV</h1>
      <p className="text-slate-200 mb-4">
        Baixe os modelos de planilhas e depois importe no sistema (em breve).
      </p>
      <ul className="list-disc ml-6 text-slate-200 space-y-2">
        <li><a href="sandbox:/mnt/data/template_colaboradores.csv" className="underline">Template – Colaboradores</a></li>
        <li><a href="sandbox:/mnt/data/template_cursos.csv" className="underline">Template – Cursos</a></li>
        <li><a href="sandbox:/mnt/data/template_matriculas_conclusoes.csv" className="underline">Template – Matrículas/Conclusões</a></li>
        <li><a href="sandbox:/mnt/data/template_exames_medicos.csv" className="underline">Template – Exames Médicos</a></li>
      </ul>
    </main>
  );
}
