import type { SalesStats } from '@/app/api/manager/stats/route';

function fmt(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
  if (n >= 10_000)      return `${(n / 10_000).toFixed(1)}萬`;
  return n.toLocaleString();
}

interface Props { stats: SalesStats[]; }

export function SummaryCards({ stats }: Props) {
  const total = {
    closed_amount:     stats.reduce((s, r) => s + Number(r.closed_amount),     0),
    closed_count:      stats.reduce((s, r) => s + Number(r.closed_count),      0),
    quoting_amount:    stats.reduce((s, r) => s + Number(r.quoting_amount),    0),
    quoting_count:     stats.reduce((s, r) => s + Number(r.quoting_count),     0),
    developing_amount: stats.reduce((s, r) => s + Number(r.developing_amount), 0),
    developing_count:  stats.reduce((s, r) => s + Number(r.developing_count),  0),
    stale_count:       stats.reduce((s, r) => s + Number(r.stale_count),       0),
  };

  const cards = [
    {
      label: '已成交',
      amount: total.closed_amount,
      count: total.closed_count,
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    {
      label: '報價中',
      amount: total.quoting_amount,
      count: total.quoting_count,
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      dot: 'bg-blue-400',
    },
    {
      label: '開發中',
      amount: total.developing_amount,
      count: total.developing_count,
      bg: 'bg-zinc-100',
      text: 'text-zinc-700',
      dot: 'bg-zinc-400',
    },
    {
      label: '逾期未聯繫',
      amount: null,
      count: total.stale_count,
      bg: 'bg-red-50',
      text: 'text-red-600',
      dot: 'bg-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-2xl px-4 py-4`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
            <span className="text-xs text-zinc-500">{c.label}</span>
          </div>
          {c.amount !== null && (
            <p className={`text-xl font-bold leading-tight ${c.text}`}>
              ${fmt(c.amount)}
            </p>
          )}
          <p className={`text-sm mt-0.5 ${c.amount !== null ? 'text-zinc-400' : `text-2xl font-bold ${c.text}`}`}>
            {c.amount !== null ? `${c.count} 件` : c.count}
          </p>
        </div>
      ))}
    </div>
  );
}
