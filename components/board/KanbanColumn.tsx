'use client';

import { Droppable } from '@hello-pangea/dnd';
import { ApiDeal, ColumnId } from '@/lib/types';
import { DealCard } from './DealCard';
import { AlertTriangle } from 'lucide-react';

interface Props {
  columnId: ColumnId;
  label: string;
  color: string;
  deals: ApiDeal[];
  onDealTap: (deal: ApiDeal) => void;
}

function formatTotal(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}億`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}萬`;
  return amount.toLocaleString();
}

export function KanbanColumn({ columnId, label, color, deals, onDealTap }: Props) {
  const staleCount = deals.filter(d => d.isStale).length;
  const totalAmount = deals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex flex-col min-w-[300px] w-[300px] snap-start">
      {/* Column header */}
      <div className={`flex items-center justify-between rounded-t-xl px-4 py-3 ${color} text-white`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-base">{label}</span>
          <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-semibold">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {totalAmount > 0 && (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
              ${formatTotal(totalAmount)}
            </span>
          )}
          {staleCount > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">
              <AlertTriangle size={12} />
              {staleCount}
            </div>
          )}
        </div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 flex flex-col gap-3 rounded-b-xl p-3 min-h-[200px]
              transition-colors
              ${snapshot.isDraggingOver ? 'bg-zinc-200' : 'bg-zinc-100'}
            `}
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                onTap={onDealTap}
              />
            ))}
            {provided.placeholder}
            {deals.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-center text-sm text-zinc-400 pt-4">尚無案件</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
