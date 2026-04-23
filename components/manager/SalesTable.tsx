import type { SalesStats } from '@/app/api/manager/stats/route';
import type { Member } from './ManagerDashboard';

function fmt(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
  if (n >= 10_000)      return `${(n / 10_000).toFixed(1)}萬`;
  if (n === 0)          return '—';
  return n.toLocaleString();
}

interface Props {
  stats: SalesStats[];
  members: Member[];
  selectedUserId: number | null;
  onSelectUser: (id: number | null) => void;
}

export function SalesTable({ stats, members, selectedUserId, onSelectUser }: Props) {
  if (stats.length === 0) {
    return <p className="text-sm text-zinc-400 text-center py-6">此期間無資料</p>;
  }

  // Show all members, even those with no deals
  const memberMap = new Map(stats.map(s => [s.user_id, s]));
  const rows = members.map(m => ({
    member: m,
    stat: memberMap.get(m.id) ?? {
      user_id: m.id, user_name: m.name,
      developing_count: 0, developing_amount: 0,
      quoting_count: 0,    quoting_amount: 0,
      closed_count: 0,     closed_amount: 0,
      stale_count: 0,      total_amount: 0,
    } as SalesStats,
  }));

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 text-xs text-zinc-400 font-medium border-b border-zinc-100 px-4 py-2.5">
        <span>業務員</span>
        <span className="w-16 text-right">開發中</span>
        <span className="w-16 text-right">報價中</span>
        <span className="w-20 text-right text-emerald-600">已成交</span>
      </div>

      {/* Rows */}
      {rows.map(({ member, stat }) => {
        const isSelected = selectedUserId === member.id;
        return (
          <button
            key={member.id}
            onClick={() => onSelectUser(isSelected ? null : member.id)}
            className={`w-full grid grid-cols-[1fr_auto_auto_auto] gap-0 px-4 py-3 text-left border-b border-zinc-50 last:border-0 transition-colors ${
              isSelected ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50'
            }`}
          >
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                {member.name}
              </span>
              {Number(stat.stale_count) > 0 && (
                <span className={`text-xs mt-0.5 ${isSelected ? 'text-red-300' : 'text-red-500'}`}>
                  ⚠ {stat.stale_count} 件逾期
                </span>
              )}
            </div>
            <div className="w-16 text-right">
              <p className={`text-sm font-medium ${isSelected ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {fmt(Number(stat.developing_amount))}
              </p>
              <p className={`text-xs ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>
                {stat.developing_count} 件
              </p>
            </div>
            <div className="w-16 text-right">
              <p className={`text-sm font-medium ${isSelected ? 'text-blue-300' : 'text-blue-600'}`}>
                {fmt(Number(stat.quoting_amount))}
              </p>
              <p className="text-xs text-zinc-400">{stat.quoting_count} 件</p>
            </div>
            <div className="w-20 text-right">
              <p className={`text-sm font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                {fmt(Number(stat.closed_amount))}
              </p>
              <p className="text-xs text-zinc-400">{stat.closed_count} 件</p>
            </div>
          </button>
        );
      })}

      {/* Footer total */}
      {rows.length > 1 && (
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 px-4 py-2.5 bg-zinc-50 border-t border-zinc-200 text-xs font-semibold text-zinc-500">
          <span>合計</span>
          <span className="w-16 text-right text-zinc-700">
            {fmt(stats.reduce((s, r) => s + Number(r.developing_amount), 0))}
          </span>
          <span className="w-16 text-right text-blue-600">
            {fmt(stats.reduce((s, r) => s + Number(r.quoting_amount), 0))}
          </span>
          <span className="w-20 text-right text-emerald-600">
            {fmt(stats.reduce((s, r) => s + Number(r.closed_amount), 0))}
          </span>
        </div>
      )}
    </div>
  );
}
