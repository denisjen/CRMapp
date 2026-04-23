'use client';

import { Draggable } from '@hello-pangea/dnd';
import { ApiDeal } from '@/lib/types';
import { StaleIndicator } from './StaleIndicator';

interface Props {
  deal: ApiDeal;
  index: number;
  onTap: (deal: ApiDeal) => void;
}

function formatAmount(amount: number): string {
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}萬`;
  return amount.toLocaleString();
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
  const now  = new Date();
  const todayMidnight = new Date(now.getFullYear(),  now.getMonth(),  now.getDate());
  const dateMidnight  = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((todayMidnight.getTime() - dateMidnight.getTime()) / 86_400_000);

  const dateStr = date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });
  const fullStr = date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'numeric', day: 'numeric' });

  if (diffDays === 0) return `今天 ${dateStr}`;
  if (diffDays === 1) return `昨天 ${dateStr}`;
  if (diffDays < 30)  return `${diffDays}天前 ${dateStr}`;
  return fullStr;
}

export function DealCard({ deal, index, onTap }: Props) {
  return (
    <Draggable draggableId={String(deal.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onTap(deal)}
          className={`
            relative rounded-xl bg-white p-4 shadow-sm border
            min-h-[72px] cursor-pointer select-none
            transition-shadow active:scale-[0.98]
            ${deal.isStale ? 'border-red-300 border-l-4 border-l-red-500' : 'border-zinc-200'}
            ${snapshot.isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'}
          `}
        >
          {deal.isStale && (
            <div className="mb-2">
              <StaleIndicator daysSinceContact={deal.daysSinceContact} />
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-zinc-900 text-base leading-tight">{deal.customer}</p>
            {deal.amount > 0 && (
              <span className="shrink-0 text-sm font-medium text-zinc-500">
                ${formatAmount(deal.amount)}
              </span>
            )}
          </div>

          {deal.notes && (
            <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{deal.notes}</p>
          )}

          <p className="mt-2 text-xs text-zinc-400">
            最後聯繫：{formatRelativeTime(deal.last_contact_at)}
          </p>
        </div>
      )}
    </Draggable>
  );
}
