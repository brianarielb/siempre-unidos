export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
