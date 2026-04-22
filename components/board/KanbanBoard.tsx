'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { ApiDeal, BoardData, ColumnId } from '@/lib/types';
import { COLUMNS } from '@/lib/constants';
import { KanbanColumn } from './KanbanColumn';
import { AddDealButton } from '../deals/AddDealButton';
import { AddDealModal } from '../deals/AddDealModal';
import { DealDetailSheet } from '../deals/DealDetailSheet';
import { CalendarIcon, XCircle } from 'lucide-react';

export function KanbanBoard() {
  const [board, setBoard] = useState<BoardData>({ developing: [], quoting: [], closed: [] });
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<ApiDeal | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const [dateFrom, setDateFrom] = useState(yearStart);
  const [dateTo, setDateTo] = useState(today);

  const fetchBoard = useCallback(async () => {
    const res = await fetch('/api/deals');
    const data: BoardData = await res.json();
    setBoard(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  async function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = source.droppableId as ColumnId;
    const dstCol = destination.droppableId as ColumnId;
    const dealId = parseInt(draggableId);

    // Optimistic update
    const newBoard = { ...board };
    const srcDeals = [...newBoard[srcCol]];
    const [moved] = srcDeals.splice(source.index, 1);
    newBoard[srcCol] = srcDeals;

    const dstDeals = srcCol === dstCol ? srcDeals : [...newBoard[dstCol]];
    dstDeals.splice(destination.index, 0, { ...moved, column_id: dstCol });
    newBoard[dstCol] = dstDeals;
    setBoard(newBoard);

    // Compute new position (gap-based)
    const neighbors = newBoard[dstCol];
    const prev = neighbors[destination.index - 1]?.position ?? 0;
    const next = neighbors[destination.index + 1]?.position ?? (prev + 2000);
    const newPosition = Math.floor((prev + next) / 2);

    await fetch(`/api/deals/${dealId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column_id: dstCol, position: newPosition }),
    });
  }

  function handleDealUpdated(updated: ApiDeal) {
    setBoard(prev => {
      const col = updated.column_id;
      return {
        ...prev,
        [col]: prev[col].map(d => d.id === updated.id ? updated : d),
      };
    });
    setSelectedDeal(updated);
  }

  function handleDealDeleted(id: number) {
    setBoard(prev => {
      const newBoard = { ...prev };
      for (const col of Object.keys(newBoard) as ColumnId[]) {
        newBoard[col] = newBoard[col].filter(d => d.id !== id);
      }
      return newBoard;
    });
    setSelectedDeal(null);
  }

  // Filter deals by created_at date range (client-side)
  const filteredBoard = useMemo<BoardData>(() => {
    if (!dateFrom && !dateTo) return board;
    const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    const filter = (deals: ApiDeal[]) => deals.filter(d => {
      const created = new Date(d.created_at + 'Z');
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });
    return {
      developing: filter(board.developing),
      quoting: filter(board.quoting),
      closed: filter(board.closed),
    };
  }, [board, dateFrom, dateTo]);

  const isFiltering = !!(dateFrom || dateTo);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        載入中...
      </div>
    );
  }

  return (
    <>
      {/* Date filter bar */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 flex-wrap">
        <CalendarIcon size={15} className="text-zinc-400 shrink-0" />
        <span className="text-xs text-zinc-500 shrink-0">篩選建立日期</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="h-8 rounded-lg border border-zinc-200 px-2 text-xs text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        <span className="text-xs text-zinc-400">～</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="h-8 rounded-lg border border-zinc-200 px-2 text-xs text-zinc-700 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        {isFiltering && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600"
          >
            <XCircle size={14} />
            清除
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto px-4 pb-8 pt-2 snap-x snap-mandatory">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              columnId={col.id}
              label={col.label}
              color={col.color}
              deals={filteredBoard[col.id]}
              onDealTap={setSelectedDeal}
            />
          ))}
        </div>
      </DragDropContext>

      <AddDealButton onClick={() => setAddModalOpen(true)} />

      <AddDealModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCreated={(deal) => {
          setBoard(prev => ({
            ...prev,
            [deal.column_id]: [...prev[deal.column_id], deal],
          }));
          setAddModalOpen(false);
        }}
      />

      {selectedDeal && (
        <DealDetailSheet
          deal={selectedDeal}
          open={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onUpdated={handleDealUpdated}
          onDeleted={handleDealDeleted}
        />
      )}
    </>
  );
}
