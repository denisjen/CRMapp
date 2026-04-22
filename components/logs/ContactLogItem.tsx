'use client';

import { ContactLog } from '@/lib/types';

interface Props {
  log: ContactLog;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
  return date.toLocaleString('zh-TW', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ContactLogItem({ log }: Props) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-400" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm text-zinc-800 leading-snug">{log.content}</p>
        <p className="text-xs text-zinc-400">{formatDateTime(log.created_at)}</p>
      </div>
    </div>
  );
}
