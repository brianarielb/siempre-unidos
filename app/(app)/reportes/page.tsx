import Link from "next/link";

const REPORTES = [
  { href: "/reportes/socios", titulo: "Reporte de socios", desc: "Listado filtrable de socios por estado, alta, DNI o nombre." },
  { href: "/reportes/pagos", titulo: "Reporte de pagos", desc: "Pagos registrados en un rango de fechas, con totales." },
  { href: "/reportes/pendientes", titulo: "Cuotas pendientes", desc: "Socios que adeudan un período determinado." },
  { href: "/reportes/recaudacion", titulo: "Recaudación", desc: "Recaudación agrupada por año, trimestre y medio de pago." },
];

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Reportes</h1>
        <p className="text-sm text-ink-600">Elegí el reporte que necesitás consultar o exportar.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {REPORTES.map((r) => (
          <Link key={r.href} href={r.href} className="card p-5 transition-colors hover:bg-bg">
            <h2 className="text-sm font-semibold text-ink-900">{r.titulo}</h2>
            <p className="mt-1 text-sm text-ink-600">{r.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
