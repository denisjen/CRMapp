'use client';

import { ContactLog } from '@/lib/types';
import { ContactLogItem } from './ContactLogItem';

interface Props {
  logs: ContactLog[];
}

export function ContactLogList({ logs }: Props) {
  if (logs.length === 0) {
    return <p className="text-sm text-zinc-400 text-center py-4">尚無聯繫紀錄</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {logs.map(log => (
        <ContactLogItem key={log.id} log={log} />
      ))}
    </div>
  );
}
