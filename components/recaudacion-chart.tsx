"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Fila {
  periodo: string;
  [medio: string]: string | number;
}

const COLORES = ["#2F5D62", "#B8860B", "#8A93A2", "#3F7D52"];

export function RecaudacionChart({ data, medios }: { data: Fila[]; medios: string[] }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-ink-900">Recaudación por trimestre y medio de pago</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" vertical={false} />
          <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#5B6472" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString("es-AR")}`}
            contentStyle={{ borderRadius: 8, borderColor: "#E2E5EA", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {medios.map((m, i) => (
            <Bar key={m} dataKey={m} stackId="a" fill={COLORES[i % COLORES.length]} radius={i === medios.length - 1 ? [4, 4, 0, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
