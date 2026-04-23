'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarIcon, XCircle } from 'lucide-react';
import { SummaryCards } from './SummaryCards';
import { SalesTable } from './SalesTable';
import { DealList } from './DealList';
import type { SalesStats } from '@/app/api/manager/stats/route';

export interface Member { id: number; name: string; role: string; dept_id: number; dept_name: string; org_name: string; }
export interface ManagerDeal {
  id: number; user_id: number; user_name: string;
  customer: string; contact_person: string; amount: number;
  column_id: string; notes: string;
  last_contact_at: string; created_at: string;
  isStale: boolean; daysSinceContact: number;
}

export function ManagerDashboard() {
  const today     = new Date().toISOString().split('T')[0];
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [members, setMembers]     = useState<Member[]>([]);
  const [stats, setStats]         = useState<SalesStats[]>([]);
  const [deals, setDeals]         = useState<ManagerDeal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [dateFrom, setDateFrom]   = useState(yearStart);
  const [dateTo, setDateTo]       = useState(today);

  const buildQs = useCallback((userId?: number | null) => {
    const p = new URLSearchParams();
    if (dateFrom) p.set('dateFrom', dateFrom);
    if (dateTo)   p.set('dateTo', dateTo);
    if (userId)   p.set('user_id', String(userId));
    return p.toString() ? '?' + p.toString() : '';
  }, [dateFrom, dateTo]);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = buildQs();
    const [m, s, d] = await Promise.all([
      fetch('/api/manager/members').then(r => r.json()),
      fetch('/api/manager/stats' + qs).then(r => r.json()),
      fetch('/api/manager/deals' + qs).then(r => r.json()),
    ]);
    setMembers(m);
    setStats(s);
    setDeals(d);
    setLoading(false);
  }, [buildQs]);

  useEffect(() => { load(); }, [load]);

  async function handleUserSelect(userId: number | null) {
    setSelectedUser(userId);
    const qs = buildQs(userId);
    const res = await fetch('/api/manager/deals' + qs);
    if (res.ok) setDeals(await res.json());
  }

  function clearFilter() {
    setDateFrom('');
    setDateTo('');
    setSelectedUser(null);
  }

  const isFiltering = !!(dateFrom || dateTo || selectedUser);

  return (
    <div className="flex flex-col gap-6">
      {/* Date filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarIcon size={15} className="text-zinc-400 shrink-0" />
        <span className="text-xs text-zinc-500 shrink-0">篩選建立日期</span>
        <input
          type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="h-8 rounded-lg border border-zinc-200 px-2 text-xs text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        <span className="text-xs text-zinc-400">～</span>
        <input
          type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="h-8 rounded-lg border border-zinc-200 px-2 text-xs text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        {isFiltering && (
          <button onClick={clearFilter} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600">
            <XCircle size={14} /> 清除
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400 text-center py-12">載入中...</p>
      ) : (
        <>
          {/* Summary cards */}
          <SummaryCards stats={stats} />

          {/* Per-salesperson table */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-700 mb-3">業務員業績</h2>
            <SalesTable
              stats={stats}
              members={members}
              selectedUserId={selectedUser}
              onSelectUser={handleUserSelect}
            />
          </div>

          {/* Deal list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-700">
                案件列表
                <span className="ml-1 font-normal text-zinc-400">({deals.length})</span>
              </h2>
              {selectedUser && (
                <button
                  onClick={() => handleUserSelect(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 flex items-center gap-1"
                >
                  <XCircle size={13} />
                  {members.find(m => m.id === selectedUser)?.name} 的篩選
                </button>
              )}
            </div>
            <DealList deals={deals} />
          </div>
        </>
      )}
    </div>
  );
}
