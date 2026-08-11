"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Props {
  recaudacionPorTrimestre: { periodo: string; total: number }[];
  pagosPorTrimestre: { periodo: string; cantidad: number }[];
}

export function DashboardCharts({ recaudacionPorTrimestre, pagosPorTrimestre }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink-900">Recaudación por trimestre</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={recaudacionPorTrimestre}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" vertical={false} />
            <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString("es-AR")}`, "Recaudado"]}
              contentStyle={{ borderRadius: 8, borderColor: "#E2E5EA", fontSize: 12 }}
            />
            <Bar dataKey="total" fill="#2F5D62" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink-900">Socios que pagaron por trimestre</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={pagosPorTrimestre}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" vertical={false} />
            <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E5EA", fontSize: 12 }} />
            <Bar dataKey="cantidad" fill="#B8860B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
