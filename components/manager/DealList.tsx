import type { ManagerDeal } from './ManagerDashboard';

const COL_LABEL: Record<string, { label: string; cls: string }> = {
  developing: { label: '開發中', cls: 'bg-zinc-100 text-zinc-600'    },
  quoting:    { label: '報價中', cls: 'bg-blue-100 text-blue-700'    },
  closed:     { label: '已成交', cls: 'bg-emerald-100 text-emerald-700' },
};

function fmt(n: number): string {
  if (n >= 10_000) return `$${(n / 10_000).toFixed(1)}萬`;
  if (n > 0)       return `$${n.toLocaleString()}`;
  return '';
}

function relativeTime(iso: string): string {
  const date = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  const now  = new Date();
  const todayMidnight = new Date(now.getFullYear(),  now.getMonth(),  now.getDate());
  const dateMidnight  = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((todayMidnight.getTime() - dateMidnight.getTime()) / 86_400_000);

  const dateStr = date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  const fullStr = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' });

  if (days === 0) return `今天 ${dateStr}`;
  if (days === 1) return `昨天 ${dateStr}`;
  if (days < 30)  return `${days}天前 ${dateStr}`;
  return fullStr;
}

interface Props { deals: ManagerDeal[]; }

export function DealList({ deals }: Props) {
  if (deals.length === 0) {
    return <p className="text-sm text-zinc-400 text-center py-8">此期間無案件</p>;
  }

  // Group by column for display
  const groups: Record<string, ManagerDeal[]> = { developing: [], quoting: [], closed: [] };
  for (const d of deals) {
    if (groups[d.column_id]) groups[d.column_id].push(d);
  }

  return (
    <div className="flex flex-col gap-4">
      {(['closed', 'quoting', 'developing'] as const).map(col => {
        const colDeals = groups[col];
        if (colDeals.length === 0) return null;
        const { label, cls } = COL_LABEL[col];
        return (
          <div key={col}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
              <span className="text-xs text-zinc-400">{colDeals.length} 件</span>
            </div>
            <div className="flex flex-col gap-2">
              {colDeals.map(deal => (
                <div
                  key={deal.id}
                  className={`bg-white rounded-xl border px-4 py-3 ${
                    deal.isStale ? 'border-l-4 border-l-red-400 border-red-200' : 'border-zinc-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-zinc-900">{deal.customer}</span>
                        {deal.isStale && (
                          <span className="text-xs text-red-500 font-medium">⚠ {deal.daysSinceContact}天未聯繫</span>
                        )}
                      </div>
                      {deal.contact_person && (
                        <p className="text-xs text-zinc-400 mt-0.5">聯絡人：{deal.contact_person}</p>
                      )}
                      {deal.notes && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{deal.notes}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {deal.amount > 0 && (
                        <p className="text-sm font-semibold text-zinc-700">{fmt(deal.amount)}</p>
                      )}
                      <p className="text-xs text-zinc-400 mt-0.5">{deal.user_name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">最後聯繫：{relativeTime(deal.last_contact_at)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
